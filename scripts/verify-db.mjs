import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const sql = postgres(url, {
  max: 1,
  prepare: false,
  ssl: /@(localhost|127\.0\.0\.1|\[::1\])(:|\/|$)/.test(url) ? false : "require",
});

let failures = 0;
function check(label, condition, extra = "") {
  console.log(`${condition ? "ok  " : "FAIL"}  ${label}${extra ? ` -> ${extra}` : ""}`);
  if (!condition) failures += 1;
}

async function main() {
  /* schema */
  const tables = await sql`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name IN ('site_settings', 'site_items')
  `;
  check("schema applied", tables.length === 2, `${tables.length} tables`);

  /* settings round trip */
  const before = await sql`SELECT key, value FROM site_settings ORDER BY key`;
  check("settings present", before.length === 6, `${before.length} rows`);
  const profile = before.find((row) => row.key === "profile");
  check("profile is jsonb object", typeof profile.value === "object" && profile.value !== null);

  await sql`
    INSERT INTO site_settings (key, value, updated_at)
    VALUES ('__probe__', ${sql.json({ ok: true })}, NOW())
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
  `;
  const probe = await sql`SELECT value FROM site_settings WHERE key = '__probe__'`;
  check("upsert works", probe[0].value.ok === true);
  await sql`DELETE FROM site_settings WHERE key = '__probe__'`;

  /* item count and order */
  const projects = await sql`
    SELECT id, position, data FROM site_items
    WHERE collection = 'projects' ORDER BY position
  `;
  check("projects seeded", projects.length === 8, `${projects.length} rows`);
  check(
    "item data is jsonb object",
    projects.every((row) => typeof row.data === "object" && row.data !== null),
  );
  check("positions are ordered", projects.every((row, i) => row.position === i));

  /* create appends to the end */
  const [created] = await sql`
    INSERT INTO site_items (collection, position, data)
    SELECT 'projects', COALESCE(MAX(position), -1) + 1, ${sql.json({ title: "Probe project" })}
    FROM site_items WHERE collection = 'projects'
    RETURNING id, position
  `;
  check("create appends last", created.position === projects.length, `position ${created.position}`);

  /* update */
  await sql`
    UPDATE site_items SET data = ${sql.json({ title: "Probe renamed" })}
    WHERE id = ${created.id}
  `;
  const updated = await sql`SELECT data FROM site_items WHERE id = ${created.id}`;
  check("update writes jsonb", updated[0].data.title === "Probe renamed");

  /* move up */
  const neighbour = await sql`
    SELECT id, position FROM site_items
    WHERE collection = 'projects' AND position < ${created.position}
    ORDER BY position DESC LIMIT 1
  `;
  await sql.begin(async (tx) => {
    await tx`UPDATE site_items SET position = ${neighbour[0].position} WHERE id = ${created.id}`;
    await tx`UPDATE site_items SET position = ${created.position} WHERE id = ${neighbour[0].id}`;
  });
  const moved = await sql`
    SELECT id, position FROM site_items
    WHERE collection = 'projects' AND position IN (${created.position}, ${neighbour[0].position})
    ORDER BY position
  `;
  check(
    "move swaps positions",
    moved[0].id === created.id && moved[1].id === neighbour[0].id,
    `${moved.map((row) => row.position).join(",")}`,
  );

  /* delete */
  await sql`DELETE FROM site_items WHERE id = ${created.id}`;
  const after = await sql`SELECT id FROM site_items WHERE collection = 'projects'`;
  check("delete removes the row", after.length === projects.length, `${after.length} rows`);

  await sql.end();

  console.log(failures === 0 ? "\nAll database checks passed." : `\n${failures} check(s) failed.`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
