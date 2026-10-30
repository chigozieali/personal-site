import { spawn } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.env.SMOKE_PORT ?? 3177);
const base = `http://127.0.0.1:${port}`;

let failures = 0;
function check(label, condition, extra = "") {
  console.log(`${condition ? "ok  " : "FAIL"}  ${label}${extra ? ` -> ${extra}` : ""}`);
  if (!condition) failures += 1;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function decodeEntities(value) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

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

try {
  const up = await waitForServer();
  check("server started", up, up ? "" : serverLog.slice(-800));
  if (!up) throw new Error("server did not start");

  /* public page */
  const home = await fetch(base, { redirect: "manual" });
  const homeHtml = await home.text();
  check("GET / is 200", home.status === 200, String(home.status));
  check("home renders the name", homeHtml.includes("Chigozie Alioha"));
  check("home renders db content", homeHtml.includes("Multi-Floor Office Network"));
  check("home has no raw json leakage", !homeHtml.includes("&quot;headline&quot;"));
  check(
    "contact form is rendered",
    homeHtml.includes('class="cform"') &&
      homeHtml.includes('name="email"') &&
      homeHtml.includes('name="message"'),
  );

  /* DOM only: the RSC payload repeats page content, so strip scripts first */
  const dom = homeHtml.replace(/<script[\s\S]*?<\/script>/g, "");
  const statLabels = [
    ...(dom.match(/<div class="nums">([\s\S]*?)<\/div><\/div>/)?.[1] ?? "").matchAll(
      /<span>([^<]*)<\/span>/g,
    ),
  ].map((match) => match[1]);
  check(
    "stats render once each",
    statLabels.length > 0 && new Set(statLabels).size === statLabels.length,
    `${statLabels.length} stats, ${new Set(statLabels).size} unique`,
  );

  /* settings is protected */
  const guarded = await fetch(`${base}/settings`, { redirect: "manual" });
  check(
    "GET /settings redirects to login",
    guarded.status >= 300 &&
      guarded.status < 400 &&
      String(guarded.headers.get("location")).includes("/settings/login"),
    `${guarded.status} -> ${guarded.headers.get("location")}`,
  );

  /* login page */
  const loginPage = await fetch(`${base}/settings/login`, { redirect: "manual" });
  const loginHtml = await loginPage.text();
  check("GET /settings/login is 200", loginPage.status === 200, String(loginPage.status));
  check("login page has a password field", loginHtml.includes('name="password"'));

  /* the action id is embedded in the rendered form */
  const formHtml = loginHtml.match(/<form[\s\S]*?<\/form>/)?.[0] ?? "";
  const hidden = [
    ...formHtml.matchAll(/<input type="hidden" name="([^"]+)"(?: value="([^"]*)")?\/>/g),
  ].map((match) => [match[1], decodeEntities(match[2] ?? "")]);
  check("login form exposes hidden action fields", hidden.length > 0, `${hidden.length} fields`);

  if (hidden.length > 0) {
    const body = new FormData();
    for (const [name, value] of hidden) body.append(name, value);
    body.append("password", process.env.SETTINGS_PASSWORD ?? "");
    const posted = await fetch(`${base}/settings/login`, {
      method: "POST",
      body,
      redirect: "manual",
      headers: { origin: base },
    });
    const setCookie = posted.headers.get("set-cookie") ?? "";
    check("login sets a session cookie", setCookie.includes("st_session="), `${posted.status}`);
    check(
      "login redirects to /settings",
      String(posted.headers.get("location")).includes("/settings"),
      `${posted.status} -> ${posted.headers.get("location")}`,
    );

    const cookie = setCookie.split(";")[0];
    const authed = await fetch(`${base}/settings`, {
      redirect: "manual",
      headers: { cookie },
    });
    const authedHtml = await authed.text();
    check("GET /settings with cookie is 200", authed.status === 200, String(authed.status));
    check("settings page renders the editor", authedHtml.includes("Site settings"));
    check("settings page lists db content", authedHtml.includes("Chigozie"));
    check(
      "settings sidebar groups the panels",
      authedHtml.includes("Skills &amp; proof") && authedHtml.includes("st-side-group"),
    );
    check(
      "settings has a mobile section picker",
      authedHtml.includes("st-nav-mobile") && authedHtml.includes("<optgroup"),
    );
    check("settings reports the assistant state", authedHtml.includes("AI assistant:"));
  }

  /* a hand made session token also works */
  const secret = new TextEncoder().encode(
    process.env.AUTH_SECRET || process.env.SETTINGS_PASSWORD || "",
  );
  const { SignJWT } = await import("jose");
  const token = await new SignJWT({ sub: "owner" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
  const withToken = await fetch(`${base}/settings`, {
    redirect: "manual",
    headers: { cookie: `st_session=${token}` },
  });
  check("signed token opens /settings", withToken.status === 200, String(withToken.status));

  /* a wrong password is rejected */
  if (hidden.length > 0) {
    const body = new FormData();
    for (const [name, value] of hidden) body.append(name, value);
    body.append("password", "definitely-wrong");
    const rejected = await fetch(`${base}/settings/login`, {
      method: "POST",
      body,
      redirect: "manual",
      headers: { origin: base },
    });
    check(
      "wrong password sets no cookie",
      !(rejected.headers.get("set-cookie") ?? "").includes("st_session="),
      String(rejected.status),
    );
  }

  /* the action ids are readable, the crud script needs them */
  const actions = await readActionIds();
  check(
    "server action ids are in the client chunks",
    Object.keys(actions).length >= 7,
    Object.keys(actions).join(", "),
  );
} catch (error) {
  console.error(error);
  failures += 1;
} finally {
  server.kill();
  await sleep(300);
  if (failures > 0) console.log("\n--- server log ---\n" + serverLog.slice(-2000));
  console.log(failures === 0 ? "\nSmoke tests passed." : `\n${failures} check(s) failed.`);
  process.exit(failures === 0 ? 0 : 1);
}
