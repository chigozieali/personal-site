import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import postgres from "postgres";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

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

  const content = JSON.parse(
    await readFile(join(root, "content", "fallback.json"), "utf8"),
  );

  await sql.begin(async (tx) => {
    for (const [key, value] of Object.entries(content.settings)) {
      await tx`
        INSERT INTO site_settings (key, value, updated_at)
        VALUES (${key}, ${tx.json(value)}, NOW())
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
      `;
      console.log("setting:", key);
    }

    for (const [collection, items] of Object.entries(content.items)) {
      await tx`DELETE FROM site_items WHERE collection = ${collection}`;
      for (const [index, item] of items.entries()) {
        await tx`
          INSERT INTO site_items (collection, position, data)
          VALUES (${collection}, ${index}, ${tx.json(item)})
        `;
      }
      console.log("collection:", collection, `(${items.length} items)`);
    }
  });

  await sql.end();
  console.log("\nSeed complete.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
