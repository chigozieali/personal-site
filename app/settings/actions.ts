"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  clearSession,
  createSession,
  isAuthenticated,
  verifyPassword,
} from "@/lib/auth";
import {
  createItem,
  deleteItem,
  moveItem,
  saveSetting,
  updateItem,
} from "@/lib/content";
import { isCollectionKey, isSettingKey } from "@/lib/types";

export type ActionResult = {
  ok: boolean;
  error?: string;
  id?: string;
};

async function requireAuth(): Promise<ActionResult> {
  if (!(await isAuthenticated())) {
    return { ok: false, error: "Your session expired. Sign in again." };
  }
  return { ok: true };
}

export async function loginAction(
  _prev: { error: string | null },
  formData: FormData,
): Promise<{ error: string | null }> {
  const password = String(formData.get("password") ?? "");
  if (!verifyPassword(password)) {
    return { error: "That password is not right." };
  }
  await createSession();
  redirect("/settings");
}

export async function logoutAction(): Promise<void> {
  await clearSession();
  redirect("/settings/login");
}

export async function saveSettingAction(
  key: string,
  value: unknown,
): Promise<ActionResult> {
  const auth = await requireAuth();
  if (!auth.ok) return auth;
  if (!isSettingKey(key)) return { ok: false, error: `Unknown setting "${key}".` };

  try {
    await saveSetting(key, value);
    revalidatePath("/settings");
    return { ok: true };
  } catch (error) {
    console.error(error);
    return {
      ok: false,
      error: "Could not save. Check that the database is connected and the schema is applied.",
    };
  }
}

export async function createItemAction(
  collection: string,
  data: unknown,
): Promise<ActionResult> {
  const auth = await requireAuth();
  if (!auth.ok) return auth;
  if (!isCollectionKey(collection)) {
    return { ok: false, error: `Unknown collection "${collection}".` };
  }

  try {
    const id = await createItem(collection, data);
    return { ok: true, id };
  } catch (error) {
    console.error(error);
    return { ok: false, error: "Could not add the item. Is the database connected?" };
  }
}

export async function updateItemAction(
  id: string,
  data: unknown,
): Promise<ActionResult> {
  const auth = await requireAuth();
  if (!auth.ok) return auth;

  try {
    await updateItem(id, data);
    return { ok: true };
  } catch (error) {
    console.error(error);
    return { ok: false, error: "Could not save the item." };
  }
}

export async function deleteItemAction(id: string): Promise<ActionResult> {
  const auth = await requireAuth();
  if (!auth.ok) return auth;

  try {
    await deleteItem(id);
    return { ok: true };
  } catch (error) {
    console.error(error);
    return { ok: false, error: "Could not delete the item." };
  }
}

export async function moveItemAction(
  id: string,
  direction: "up" | "down",
): Promise<ActionResult> {
  const auth = await requireAuth();
  if (!auth.ok) return auth;

  try {
    await moveItem(id, direction);
    return { ok: true };
  } catch (error) {
    console.error(error);
    return { ok: false, error: "Could not reorder the item." };
  }
}
