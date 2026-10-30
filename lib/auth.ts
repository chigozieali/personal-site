import { cookies } from "next/headers";
import { timingSafeEqual } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";

const COOKIE = "st_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function secret(): Uint8Array {
  const raw = process.env.AUTH_SECRET || process.env.SETTINGS_PASSWORD;
  if (!raw) {
    throw new Error(
      "SETTINGS_PASSWORD is not set. Add it to .env.local and to the Vercel project settings.",
    );
  }
  return new TextEncoder().encode(raw);
}

export function isPasswordConfigured(): boolean {
  return Boolean(process.env.SETTINGS_PASSWORD);
}

export function verifyPassword(candidate: string): boolean {
  const expected = process.env.SETTINGS_PASSWORD;
  if (!expected) return false;
  const a = Buffer.from(candidate);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function createSession(): Promise<void> {
  const token = await new SignJWT({ sub: "owner" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret());

  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}

export async function isAuthenticated(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, secret());
    return true;
  } catch {
    return false;
  }
}
