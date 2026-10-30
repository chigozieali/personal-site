"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Fields, { type Draft } from "./Fields";
import SettingsSidebar from "./SettingsSidebar";
import SkillsAi from "./SkillsAi";
import type { RewriteRequest, SkillGroupDraft } from "./ai-types";
import {
  COLLECTION_SPECS,
  SETTING_SPECS,
  normalizeDraft,
} from "@/lib/editor-spec";
import {
  COLLECTIONS,
  SETTING_KEYS,
  type CollectionKey,
  type SettingKey,
  type SiteContent,
} from "@/lib/types";
import {
  createItemAction,
  deleteItemAction,
  logoutAction,
  moveItemAction,
  saveSettingAction,
  updateItemAction,
} from "@/app/settings/actions";
import { rewriteTextAction } from "@/app/settings/ai-actions";

type Row = { id: string; data: Draft };
type Message = { ok: boolean; text: string } | null;

export default function SettingsEditor({
  content,
  tab,
  dbConnected,
  aiName,
}: {
  content: SiteContent;
  tab: string;
  dbConnected: boolean;
  aiName: string | null;
}) {
  const aiEnabled = aiName !== null;
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<Message>(null);

  const [drafts, setDrafts] = useState<Record<string, Draft>>(() => {
    const out: Record<string, Draft> = {};
    for (const key of SETTING_KEYS) {
      out[key] = { ...(content.settings[key] as unknown as Draft) };
    }
    return out;
  });

  const [lists, setLists] = useState<Record<string, Row[]>>(() => {
    const out: Record<string, Row[]> = {};
    for (const key of COLLECTIONS) {
      out[key] = content.items[key].map((item) => {
        const { id, ...rest } = item as unknown as Draft;
        if (key === "projects" && typeof rest.category !== "string") {
          rest.category =
            typeof rest.type === "string" && rest.type.trim()
              ? rest.type
              : "Other";
        }
        return { id: typeof id === "string" ? id : "", data: rest as Draft };
      });
    }
    return out;
  });

  const refresh = () => startTransition(() => router.refresh());

  const rewrite: RewriteRequest = async ({ text, label, multiline }) => {
    const result = await rewriteTextAction({ text, label, multiline });
    if (!result.ok) return { ok: false, error: result.error };
    return { ok: true, variants: result.data.variants };
  };

  async function saveSettingTab(key: SettingKey) {
    const spec = SETTING_SPECS[key];
    const clean = normalizeDraft(spec.fields, drafts[key] ?? {});
    setBusy(true);
    setMessage(null);
    const result = await saveSettingAction(key, clean);
    setBusy(false);
    if (result.ok) {
      setDrafts((current) => ({ ...current, [key]: clean }));
      setMessage({ ok: true, text: "Saved. The public page is updated." });
      refresh();
    } else {
      setMessage({ ok: false, text: result.error ?? "Could not save." });
    }
  }

  async function addItem(collection: CollectionKey) {
    const spec = COLLECTION_SPECS[collection];
    const blank = spec.blank();
    setBusy(true);
    setMessage(null);
    const result = await createItemAction(collection, blank);
    setBusy(false);
    if (result.ok && result.id) {
      setLists((current) => ({
        ...current,
        [collection]: [...(current[collection] ?? []), { id: result.id as string, data: blank }],
      }));
      setMessage({ ok: true, text: "Added. Open it to fill in the details." });
      refresh();
    } else {
      setMessage({ ok: false, text: result.error ?? "Could not add the item." });
    }
  }

  async function saveItem(collection: CollectionKey, id: string) {
    const spec = COLLECTION_SPECS[collection];
    const row = (lists[collection] ?? []).find((entry) => entry.id === id);
    if (!row) return;
    const clean = normalizeDraft(spec.fields, row.data);
    setBusy(true);
    setMessage(null);
    const result = await updateItemAction(id, clean);
    setBusy(false);
    if (result.ok) {
      setLists((current) => ({
        ...current,
        [collection]: (current[collection] ?? []).map((entry) =>
          entry.id === id ? { ...entry, data: clean } : entry,
        ),
      }));
      setMessage({ ok: true, text: "Saved. The public page is updated." });
      refresh();
    } else {
      setMessage({ ok: false, text: result.error ?? "Could not save the item." });
    }
  }

  async function move(collection: CollectionKey, id: string, direction: "up" | "down") {
    setBusy(true);
    setMessage(null);
    const result = await moveItemAction(id, direction);
    setBusy(false);
    if (!result.ok) {
      setMessage({ ok: false, text: result.error ?? "Could not reorder." });
      return;
    }
    setLists((current) => {
      const rows = [...(current[collection] ?? [])];
      const from = rows.findIndex((entry) => entry.id === id);
      const to = direction === "up" ? from - 1 : from + 1;
      if (from < 0 || to < 0 || to >= rows.length) return current;
      const moved = rows[from];
      rows[from] = rows[to];
      rows[to] = moved;
      return { ...current, [collection]: rows };
    });
    refresh();
  }

  async function removeItem(collection: CollectionKey, id: string) {
    if (!window.confirm("Delete this item? This cannot be undone.")) return;
    setBusy(true);
    setMessage(null);
    const result = await deleteItemAction(id);
    setBusy(false);
    if (result.ok) {
      setLists((current) => ({
        ...current,
        [collection]: (current[collection] ?? []).filter((entry) => entry.id !== id),
      }));
      setMessage({ ok: true, text: "Deleted." });
      refresh();
    } else {
      setMessage({ ok: false, text: result.error ?? "Could not delete the item." });
    }
  }

  const activeSetting = SETTING_KEYS.includes(tab as SettingKey)
    ? (tab as SettingKey)
    : null;
  const activeCollection = COLLECTIONS.includes(tab as CollectionKey)
    ? (tab as CollectionKey)
    : null;
  const activeTab = activeSetting ?? activeCollection ?? tab;

  async function applySkillSuggestions(groups: SkillGroupDraft[]) {
    if (groups.length === 0) return;
    setBusy(true);
    setMessage(null);

    const snapshot = lists.skills ?? [];
    const updates: { id: string; data: Draft }[] = [];
    let created = 0;

    for (const entry of groups) {
      const name = entry.group.trim();
      if (name === "" || entry.items.length === 0) continue;

      const existing = snapshot.find(
        (row) => String(row.data.group ?? "").trim().toLowerCase() === name.toLowerCase(),
      );

      if (existing) {
        const current = Array.isArray(existing.data.items)
          ? (existing.data.items as { label: string; hot?: boolean }[])
          : [];
        const have = new Set(current.map((tag) => tag.label.toLowerCase()));
        const merged = [
          ...current,
          ...entry.items.filter((tag) => !have.has(tag.label.toLowerCase())),
        ];
        if (merged.length > current.length) {
          updates.push({ id: existing.id, data: { ...existing.data, items: merged } });
        }
        continue;
      }

      const result = await createItemAction("skills", {
        group: name,
        items: entry.items,
      });
      if (result.ok && result.id) {
        created += 1;
        const row: Row = { id: result.id, data: { group: name, items: entry.items } };
        setLists((current) => ({ ...current, skills: [...(current.skills ?? []), row] }));
      }
    }

    let updated = 0;
    for (const update of updates) {
      const result = await updateItemAction(update.id, update.data);
      if (!result.ok) continue;
      updated += 1;
      setLists((current) => ({
        ...current,
        skills: (current.skills ?? []).map((row) =>
          row.id === update.id ? { ...row, data: update.data } : row,
        ),
      }));
    }

    setBusy(false);
    const parts: string[] = [];
    if (updated > 0) {
      parts.push(`added tags to ${updated} group${updated === 1 ? "" : "s"}`);
    }
    if (created > 0) {
      parts.push(`created ${created} new group${created === 1 ? "" : "s"}`);
    }
    setMessage({
      ok: true,
      text:
        parts.length > 0
          ? `Saved: ${parts.join(" and ")}.`
          : "Those tags are already on the page, so nothing changed.",
    });
    refresh();
  }

  return (
    <div className="st">
      <div className="st-head">
        <div>
          <h1>Site settings</h1>
          <p className="sub">
            Edit the content of the site. Saving updates the live page straight away.
          </p>
        </div>
        <div className="sp">
          <a className="btn sm" href="/" target="_blank" rel="noopener noreferrer">
            View site ↗
          </a>
          <form action={logoutAction}>
            <button className="st-btn danger" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </div>

      {!dbConnected ? (
        <p className="st-msg err">
          No database is connected, so editing is disabled. Add DATABASE_URL and apply the
          schema to switch editing on.
        </p>
      ) : null}

      {!aiEnabled ? (
        <p className="st-msg">
          The assistant is off. Add a free Google AI Studio key as
          GOOGLE_GENERATIVE_AI_API_KEY to turn it on.
        </p>
      ) : null}

      <div className="st-layout">
        <SettingsSidebar active={activeTab} aiName={aiName} />

        <div className="st-main">
          {message ? (
            <p className={message.ok ? "st-msg" : "st-msg err"}>{message.text}</p>
          ) : null}

          {activeSetting ? (
            <div className="st-panel">
              <div className="st-card">
                <h2>{SETTING_SPECS[activeSetting].label}</h2>
                <p className="hint">
                  Wrap words in **double asterisks** to bold them. Changes go live when you
                  save.
                </p>
                <Fields
                  fields={SETTING_SPECS[activeSetting].fields}
                  value={drafts[activeSetting] ?? {}}
                  onChange={(next) =>
                    setDrafts((current) => ({ ...current, [activeSetting]: next }))
                  }
                  disabled={!dbConnected || busy}
                  rewrite={rewrite}
                  aiEnabled={aiEnabled}
                />
                <div className="st-actions">
                  <button
                    className="st-btn pri"
                    type="button"
                    disabled={!dbConnected || busy}
                    onClick={() => saveSettingTab(activeSetting)}
                  >
                    {busy ? "Saving…" : "Save changes"}
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {activeCollection ? (
            <div className="st-panel">
              {activeCollection === "skills" ? (
                <div className="st-card">
                  <h2>Skill suggestions</h2>
                  <p className="hint">
                    The assistant reads your saved profile, experience, projects and
                    certificates, then proposes groups and tags. Nothing is written until
                    you add it.
                  </p>
                  <SkillsAi enabled={aiEnabled} onApply={applySkillSuggestions} />
                </div>
              ) : null}

              <div className="st-card">
                <h2>{COLLECTION_SPECS[activeCollection].label}</h2>
                <p className="hint">
                  Add, edit, reorder or remove entries. The order here is the order on the site.
                </p>
                <div className="st-actions">
                  <button
                    className="st-btn pri"
                    type="button"
                    disabled={!dbConnected || busy}
                    onClick={() => addItem(activeCollection)}
                  >
                    Add {COLLECTION_SPECS[activeCollection].label}
                  </button>
                  <span className="sp" />
                  <span className="st-note">
                    {(lists[activeCollection] ?? []).length} item(s)
                  </span>
                </div>
              </div>

              {(lists[activeCollection] ?? []).map((row, index) => (
                <details className="st-item" key={row.id || `row-${index}`}>
                  <summary>
                    <span className="t">
                      {COLLECTION_SPECS[activeCollection].summary(row.data)}
                    </span>
                    <span className="m">#{index + 1}</span>
                    <span className="sp">
                      <button
                        className="st-btn mini"
                        type="button"
                        disabled={!dbConnected || busy || index === 0}
                        onClick={(event) => {
                          event.preventDefault();
                          move(activeCollection, row.id, "up");
                        }}
                      >
                        Up
                      </button>
                      <button
                        className="st-btn mini"
                        type="button"
                        disabled={
                          !dbConnected ||
                          busy ||
                          index === (lists[activeCollection] ?? []).length - 1
                        }
                        onClick={(event) => {
                          event.preventDefault();
                          move(activeCollection, row.id, "down");
                        }}
                      >
                        Down
                      </button>
                    </span>
                  </summary>
                  <div className="st-body">
                    <Fields
                      fields={COLLECTION_SPECS[activeCollection].fields}
                      value={row.data}
                      onChange={(next) =>
                        setLists((current) => ({
                          ...current,
                          [activeCollection]: (current[activeCollection] ?? []).map(
                            (entry) => (entry.id === row.id ? { ...entry, data: next } : entry),
                          ),
                        }))
                      }
                      disabled={!dbConnected || busy}
                      rewrite={rewrite}
                      aiEnabled={aiEnabled}
                    />
                    <div className="st-actions">
                      <button
                        className="st-btn pri"
                        type="button"
                        disabled={!dbConnected || busy}
                        onClick={() => saveItem(activeCollection, row.id)}
                      >
                        Save
                      </button>
                      <button
                        className="st-btn danger"
                        type="button"
                        disabled={!dbConnected || busy}
                        onClick={() => removeItem(activeCollection, row.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </details>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
