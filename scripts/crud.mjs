import { spawn } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.env.SMOKE_PORT ?? 3179);
const base = `http://127.0.0.1:${port}`;

let failures = 0;
function check(label, condition, extra = "") {
  console.log(`${condition ? "ok  " : "FAIL"}  ${label}${extra ? ` -> ${extra}` : ""}`);
  if (!condition) failures += 1;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** The server action ids change with every build, so they are read from the client chunks. */
async function readActionIds() {
  const dir = join(root, ".next", "static", "chunks");
  const files = await readdir(dir, { recursive: true });
  const ids = {};
  for (const file of files) {
    if (!file.endsWith(".js")) continue;
    const text = await readFile(join(dir, file), "utf8");
    for (const match of text.matchAll(
      /createServerReference\)\("([a-f0-9]{40,64})"[\s\S]{0,140}?"(\w+Action)"/g,
    )) {
      ids[match[2]] = match[1];
    }
  }
  return ids;
}

const server = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "start", "-p", String(port)],
  { cwd: root, env: process.env, stdio: ["ignore", "pipe", "pipe"] },
);
let serverLog = "";
server.stdout.on("data", (d) => (serverLog += d.toString()));
server.stderr.on("data", (d) => (serverLog += d.toString()));

async function waitForServer() {
  for (let i = 0; i < 80; i += 1) {
    try {
      const res = await fetch(base, { redirect: "manual" });
      if (res.status > 0) return true;
    } catch {
      await sleep(500);
    }
  }
  return false;
}

async function callAction(id, args, cookie) {
  const res = await fetch(`${base}/settings`, {
    method: "POST",
    body: JSON.stringify(args),
    redirect: "manual",
    headers: {
      "content-type": "text/plain;charset=UTF-8",
      "next-action": id,
      origin: base,
      cookie,
    },
  });
  return { status: res.status, text: await res.text() };
}

try {
  const up = await waitForServer();
  check("server started", up);
  if (!up) throw new Error("server did not start");

  const ACTIONS = await readActionIds();
  for (const name of [
    "loginAction",
    "saveSettingAction",
    "createItemAction",
    "updateItemAction",
    "moveItemAction",
    "deleteItemAction",
  ]) {
    check(`action ${name} found`, Boolean(ACTIONS[name]));
  }

  /* sign in through the real form */
  const loginHtml = await (await fetch(`${base}/settings/login`)).text();
  const formHtml = loginHtml.match(/<form[\s\S]*?<\/form>/)?.[0] ?? "";
  const hidden = [...formHtml.matchAll(/<input type="hidden" name="([^"]+)"(?: value="([^"]*)")?\/>/g)];
  const body = new FormData();
  for (const [, name, value] of hidden) {
    body.append(
      name,
      (value ?? "")
        .replace(/&quot;/g, '"')
        .replace(/&#x27;/g, "'")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&"),
    );
  }
  body.append("password", process.env.SETTINGS_PASSWORD ?? "");
  const loginRes = await fetch(`${base}/settings/login`, {
    method: "POST",
    body,
    redirect: "manual",
    headers: { origin: base },
  });
  const cookie = (loginRes.headers.get("set-cookie") ?? "").split(";")[0];
  check("signed in", cookie.startsWith("st_session="), cookie.slice(0, 24));

  const sql = postgres(process.env.DATABASE_URL, {
    max: 1,
    prepare: false,
    ssl: /@(localhost|127\.0\.0\.1|\[::1\])(:|\/|$)/.test(process.env.DATABASE_URL ?? "")
      ? false
      : "require",
  });

  /* read the current contact block */
  const [before] = await sql`SELECT value FROM site_settings WHERE key = 'contact'`;
  check("contact block is an object", typeof before.value === "object");

  /* save a setting through the server action */
  const edited = { ...before.value, heading: "Smoke test heading" };
  const saved = await callAction(ACTIONS.saveSettingAction, ["contact", edited], cookie);
  check("saveSettingAction responds 200", saved.status === 200, String(saved.status));
  check("saveSettingAction returns ok", saved.text.includes('"ok":true'));

  const [after] = await sql`SELECT value FROM site_settings WHERE key = 'contact'`;
  check("setting stored as an object", typeof after.value === "object" && after.value !== null);
  check("setting stored the new value", after.value.heading === "Smoke test heading");

  /* the public page picks it up */
  await sleep(500);
  const home = await (await fetch(base)).text();
  check("public page shows the edit", home.includes("Smoke test heading"));

  /* restore */
  await callAction(ACTIONS.saveSettingAction, ["contact", before.value], cookie);
  const [restored] = await sql`SELECT value FROM site_settings WHERE key = 'contact'`;
  check("setting restored", restored.value.heading === before.value.heading);

  /* create, update, move and delete an item */
  const created = await callAction(
    ACTIONS.createItemAction,
    ["projects", { title: "Smoke probe", summary: "temporary" }],
    cookie,
  );
  check("createItemAction responds 200", created.status === 200, String(created.status));
  const createdId = created.text.match(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/,
  )?.[0];
  check("createItemAction returns the new id", Boolean(createdId));

  const [row] = await sql`SELECT data FROM site_items WHERE id = ${createdId}`;
  check("item data is an object", typeof row?.data === "object" && row.data !== null);
  check("item data kept the title", row?.data?.title === "Smoke probe");

  const updated = await callAction(
    ACTIONS.updateItemAction,
    [createdId, { title: "Smoke probe renamed", summary: "temporary" }],
    cookie,
  );
  check("updateItemAction returns ok", updated.text.includes('"ok":true'));
  const [updatedRow] = await sql`SELECT data FROM site_items WHERE id = ${createdId}`;
  check("item update persisted", updatedRow?.data?.title === "Smoke probe renamed");

  const moved = await callAction(ACTIONS.moveItemAction, [createdId, "up"], cookie);
  check("moveItemAction returns ok", moved.text.includes('"ok":true'));
  const [movedRow] = await sql`SELECT position FROM site_items WHERE id = ${createdId}`;
  check("item moved up", movedRow?.position === 7, `position ${movedRow?.position}`);

  const removed = await callAction(ACTIONS.deleteItemAction, [createdId], cookie);
  check("deleteItemAction returns ok", removed.text.includes('"ok":true'));
  const [gone] = await sql`SELECT id FROM site_items WHERE id = ${createdId}`;
  check("item deleted", !gone);

  /* the positions stay contiguous after a move and a delete */
  const projects = await sql`
    SELECT position FROM site_items WHERE collection = 'projects' ORDER BY position
  `;
  check(
    "positions are contiguous",
    projects.every((row, index) => row.position === index),
    projects.map((row) => row.position).join(","),
  );

  /* an unauthenticated call is rejected */
  const anonymous = await callAction(ACTIONS.saveSettingAction, ["contact", edited], "");
  check(
    "unauthenticated write is rejected",
    anonymous.text.includes("session expired") || anonymous.status === 401,
    `${anonymous.status}`,
  );

  await sql.end();
} catch (error) {
  console.error(error);
  failures += 1;
} finally {
  server.kill();
  await sleep(300);
  if (failures > 0) console.log("\n--- server log ---\n" + serverLog.slice(-2000));
  console.log(failures === 0 ? "\nCRUD smoke tests passed." : `\n${failures} check(s) failed.`);
  process.exit(failures === 0 ? 0 : 1);
}
