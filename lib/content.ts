import { revalidatePath, unstable_cache, updateTag } from "next/cache";
import type { Sql } from "postgres";
import fallbackJson from "@/content/fallback.json";
import { getDb, hasDatabase } from "./db";
import {
  COLLECTIONS,
  type CollectionKey,
  type SettingKey,
  type SiteContent,
  type SiteItems,
  type SiteSettings,
  isCollectionKey,
  isSettingKey,
} from "./types";

export const CONTENT_TAG = "site-content";

export const fallbackContent = fallbackJson as SiteContent;

type Row = Record<string, unknown>;

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export function hasDatabaseConfigured(): boolean {
  return hasDatabase();
}

/**
 * postgres encodes json/jsonb parameters with JSON.stringify, so the parameter has to
 * hold a real value. Passing a pre-serialised string would end up as a jsonb string
 * instead of a jsonb object.
 */
function toJsonValue(value: unknown): JsonValue {
  if (typeof value !== "string") return value as JsonValue;
  try {
    const parsed = JSON.parse(value) as unknown;
    return typeof parsed === "object" && parsed !== null
      ? (parsed as JsonValue)
      : value;
  } catch {
    return value;
  }
}

/** Reads a jsonb column back, tolerating rows that still hold the encoded text. */
function fromJsonColumn<T>(value: T | string): T {
  if (typeof value !== "string") return value;
  try {
    const parsed = JSON.parse(value) as unknown;
    return (typeof parsed === "object" && parsed !== null ? parsed : value) as T;
  } catch {
    return value as T;
  }
}

function emptyItems(): SiteItems {
  return {
    now: [],
    stats: [],
    experience: [],
    services: [],
    skills: [],
    certificates: [],
    roadmap: [],
    projects: [],
  };
}

/** The bundled content, used when the database has not been seeded yet. */
function fallbackItems(): SiteItems {
  return Object.fromEntries(
    COLLECTIONS.map((key) => [key, [...fallbackContent.items[key]]]),
  ) as SiteItems;
}

async function readFromDb(): Promise<SiteContent> {
  const sql = getDb();

  const [settingRows, itemRows] = await Promise.all([
    sql`SELECT key, value FROM site_settings`,
    sql`SELECT id, collection, position, data FROM site_items ORDER BY collection, position, created_at`,
  ]);

  const settings: SiteSettings = { ...fallbackContent.settings };
  for (const raw of settingRows as unknown as Row[]) {
    const key = String(raw.key);
    if (isSettingKey(key)) settings[key] = fromJsonColumn(raw.value) as never;
  }

  const items = emptyItems();
  for (const raw of itemRows as unknown as Row[]) {
    const collection = String(raw.collection);
    if (!isCollectionKey(collection)) continue;
    const data = fromJsonColumn((raw.data ?? {}) as Record<string, unknown> | string) as Record<
      string,
      unknown
    >;
    (items[collection] as unknown[]).push({ ...data, id: String(raw.id) });
  }

  return { settings, items: itemRows.length === 0 ? fallbackItems() : items };
}

const getCachedContent = unstable_cache(readFromDb, ["site-content"], {
  tags: [CONTENT_TAG],
  revalidate: 3600,
});

/** Cached read used by the public page. Falls back to bundled content if the DB is unreachable. */
export async function getSiteContent(): Promise<SiteContent> {
  if (!hasDatabase()) return fallbackContent;
  try {
    return await getCachedContent();
  } catch (error) {
    console.error("[content] database read failed, serving bundled content", error);
    return fallbackContent;
  }
}

/** Uncached read used by the settings editor so it always shows the current state. */
export async function getSiteContentFresh(): Promise<SiteContent> {
  if (!hasDatabase()) return fallbackContent;
  return readFromDb();
}

export async function revalidateContent(): Promise<void> {
  try {
    /* immediate expiry, so the editor shows the change straight after saving */
    updateTag(CONTENT_TAG);
  } catch {
    /* not inside a Server Action, fall back to a background revalidation */
  }
  revalidatePath("/", "page");
}

/** Keeps the row id out of the stored JSON, it belongs to the table not the content. */
function withoutId(data: unknown): unknown {
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const rest = { ...(data as Record<string, unknown>) };
    delete rest.id;
    return rest;
  }
  return data;
}

export async function saveSetting(key: SettingKey, value: unknown): Promise<void> {
  const sql = getDb();
  await sql`
    INSERT INTO site_settings (key, value, updated_at)
    VALUES (${key}, ${sql.json(toJsonValue(value))}, NOW())
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
  `;
  await revalidateContent();
}

export async function createItem(
  collection: CollectionKey,
  data: unknown,
): Promise<string> {
  const sql = getDb();
  const rows = (await sql`
    INSERT INTO site_items (collection, position, data)
    SELECT ${collection}, COALESCE(MAX(position), -1) + 1, ${sql.json(toJsonValue(withoutId(data)))}
    FROM site_items WHERE collection = ${collection}
    RETURNING id
  `) as unknown as Row[];
  await revalidateContent();
  return String(rows[0].id);
}

export async function updateItem(id: string, data: unknown): Promise<void> {
  const sql = getDb();
  await sql`
    UPDATE site_items SET data = ${sql.json(toJsonValue(withoutId(data)))}, updated_at = NOW()
    WHERE id = ${id}
  `;
  await revalidateContent();
}

/** Keeps the positions of a collection contiguous, 0, 1, 2 ... */
async function renumber(sql: Sql, collection: string): Promise<void> {
  const rows = (await sql`
    SELECT id FROM site_items WHERE collection = ${collection} ORDER BY position, created_at
  `) as unknown as Row[];

  await sql.begin(async (tx) => {
    for (const [position, row] of rows.entries()) {
      await tx`UPDATE site_items SET position = ${position} WHERE id = ${String(row.id)}`;
    }
  });
}
export async function deleteItem(id: string): Promise<void> {
  const sql = getDb();
  const rows = (await sql`
    SELECT collection FROM site_items WHERE id = ${id}
  `) as unknown as Row[];

  await sql`DELETE FROM site_items WHERE id = ${id}`;
  if (rows[0]) await renumber(sql, String(rows[0].collection));
  await revalidateContent();
}

export async function moveItem(id: string, direction: "up" | "down"): Promise<void> {
  const sql = getDb();
  const rows = (await sql`
    SELECT id, collection, position FROM site_items WHERE id = ${id}
  `) as unknown as Row[];

  const current = rows[0];
  if (!current) return;

  const collection = String(current.collection);
  const currentId = String(current.id);

  const items = (await sql`
    SELECT id FROM site_items WHERE collection = ${collection} ORDER BY position, created_at
  `) as unknown as Row[];

  const ids = items.map((row) => String(row.id));
  const index = ids.indexOf(currentId);
  if (index === -1) return;

  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= ids.length) return;

  ids.splice(index, 1);
  ids.splice(target, 0, currentId);

  await sql.begin(async (tx) => {
    for (const [position, itemId] of ids.entries()) {
      await tx`UPDATE site_items SET position = ${position} WHERE id = ${itemId}`;
    }
  });

  await revalidateContent();
}
