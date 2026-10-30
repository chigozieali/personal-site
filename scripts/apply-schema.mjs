import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import postgres from "postgres";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

function splitStatements(sql) {
  return sql
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n")
    .split(";")
    .map((statement) => statement.trim())
    .filter((statement) => statement !== "");
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set. Put it in .env.local or your shell.");
    process.exit(1);
  }

  const sql = postgres(url, {
    max: 1,
    prepare: false,
    ssl: /@(localhost|127\.0\.0\.1|\[::1\])(:|\/|$)/.test(url) ? false : "require",
  });

  const schema = await readFile(join(root, "db", "schema.sql"), "utf8");

  for (const statement of splitStatements(schema)) {
    await sql.unsafe(statement);
    console.log("applied:", statement.split("\n")[0].slice(0, 70));
  }

  await sql.end();
  console.log("\nSchema is up to date.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
