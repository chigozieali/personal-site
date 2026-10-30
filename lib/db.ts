import postgres, { type Sql } from "postgres";

let client: Sql | null = null;

export function hasDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

function isLocal(url: string): boolean {
  return /@(localhost|127\.0\.0\.1|\[::1\])(:|\/|$)/.test(url);
}

function sslOption(url: string): boolean | "require" {
  const override = process.env.DATABASE_SSL?.toLowerCase();
  if (override === "disable") return false;
  if (override === "require") return "require";
  /* local development over TCP usually has no TLS, hosted Postgres does */
  return isLocal(url) ? false : "require";
}

export function getDb(): Sql {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Add a Vercel Postgres database or put DATABASE_URL in .env.local.",
    );
  }
  if (!client) {
    client = postgres(url, {
      /* a serverless function should not hold a large pool open */
      max: Number(process.env.DATABASE_POOL_SIZE ?? 1),
      idle_timeout: 20,
      connect_timeout: 10,
      ssl: sslOption(url),
      /* the Neon pooled endpoint does not support prepared statements */
      prepare: false,
    });
  }
  return client;
}
