# Chigozie Alioha — portfolio site

A one page portfolio with a password protected editor at `/settings`. The copy, the
projects, the skills, the certificates and the contact details live in Postgres, so
everything on the page can be changed without touching the code.

- **Framework:** Next.js 16 (App Router, React 19, TypeScript)
- **Content store:** Postgres, Vercel Postgres (Neon) in production, local Postgres in development
- **Auth:** one shared password, signed session cookie (jose, HS256)
- **Styling:** the original hand written CSS, ported as is

## How it works

| Route | What it does |
| --- | --- |
| `/` | The public page. Statically rendered, revalidated every hour and immediately after an edit. |
| `/settings` | The editor. Password protected, renders the live content from the database. |
| `/settings/login` | The sign in form. |

The content is split in two:

- `site_settings` holds one row per editable block of copy (`meta`, `profile`, `hero`,
  `about`, `servicesCta`, `contact`).
- `site_items` holds one row per repeatable entry (`now`, `stats`, `experience`,
  `services`, `skills`, `certificates`, `roadmap`, `projects`).

Both store their payload in a `JSONB` column, so the shape of an entry is owned by the
app (`lib/types.ts` and `lib/editor-spec.ts`), not by the database.

If the database cannot be reached the public page falls back to
`content/fallback.json`, which is also the seed data. The same fallback is used while
`site_items` is still empty, so a fresh database renders the starter content. Once rows
exist they replace the bundled lists rather than being appended to them, and an empty
collection stays empty.

## Local development

Requirements: Node 20+ and a Postgres instance. [Docker](https://www.docker.com/products/docker-desktop/)
or a local install both work.

```bash
npm install
cp .env.example .env.local      # then fill in the values
```

`.env.local` needs three values:

```bash
DATABASE_URL="postgresql://postgres@localhost:5432/portfolio"
SETTINGS_PASSWORD="a-password-for-the-editor"
AUTH_SECRET="a-long-random-string"   # node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

`AUTH_SECRET` signs the session cookie. If it is missing the password is used as the
secret, which is fine for local work but not for production.

To enable the optional editor assistant, add a provider key. Google AI Studio is the
recommended starting point for basic use; its Gemini API has a free tier for supported
models. Create a key at [Google AI Studio](https://aistudio.google.com/apikey) and add:

```bash
GOOGLE_GENERATIVE_AI_API_KEY="your-key"
```

Groq is also supported with `GROQ_API_KEY`; OpenAI works with `OPENAI_API_KEY` but is
optional and may require paid API billing. If more than one key is set, the app uses
Gemini first, then Groq, then OpenAI. `AI_MODEL` is optional and defaults to the
configured provider's model. Free-tier availability and usage limits depend on the
provider's current terms and your account.

Create the database and load the schema and the content:

```bash
createdb portfolio            # only the first time
npm run db:push               # creates the tables
npm run db:seed               # loads content/fallback.json
npm run dev                   # http://localhost:3000
```

### Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Development server. |
| `npm run build` / `npm start` | Production build and server. |
| `npm run typecheck` | `tsc --noEmit`. |
| `npm run lint` | ESLint. |
| `npm run db:push` | Applies `db/schema.sql`. |
| `npm run db:seed` | Loads `content/fallback.json` into the database. |
| `npm run db:check` | Reads and writes the database to confirm it behaves. |
| `npm run test:smoke` | Starts the built app and checks the pages and the login flow. |
| `npm run test:crud` | Drives the server actions: save, create, update, reorder, delete. |

The two test scripts need a build first (`npm run build`) and a reachable database.

## Editor layout

The editor groups its panels in a sidebar instead of one long row of tabs:

| Group | Panels |
| --- | --- |
| Identity | Profile, Hero, About, Site & footer |
| Work | Experience, Projects, Services, Services call to action |
| Skills & proof | Skills, Certificates, Roadmap |
| Numbers | Stats, Right now |
| Contact | Contact |

The groups live in `lib/settings-nav.ts`. Each panel is still a `?tab=` URL, so a link
can point at one directly. Below 860px the sidebar is replaced by a native picker.
Projects can be assigned a category in Settings; the public Projects section groups
them into expandable sections. Existing projects without a category initially use
their Type as the category, and new category names can be entered directly on a project.

## The editor assistant

`/settings` can ask Gemini, Groq, or OpenAI for help with the copy. Gemini is selected
first when its API key is configured; the assistant is a drafting aid, never an author:
nothing it produces is written to the database until you pick it.

- **Improve with AI** under any paragraph or bullet field. Returns two rewrites of what
  you already wrote; *Use this* drops one into the field, which still needs saving.
- **Suggest skills** on the Skills panel. It reads the saved profile, experience,
  projects and certificates and proposes groups and tags. Tick what you want, then
  *Add*; matching groups get the tags appended and new groups are created.

It is off unless a provider API key is set. The recommended free-tier option is
`GOOGLE_GENERATIVE_AI_API_KEY`; `GROQ_API_KEY` and `OPENAI_API_KEY` are also supported.
Set `AI_MODEL` to override the selected provider's default model. Requests are capped at
40 per hour per server instance, and the prompt tells the model to rephrase only what is
already there — no invented employers, dates, numbers or certifications. Both actions
check the session before calling out.

The code is in `lib/ai.ts` (prompts and schemas), `app/settings/ai-actions.ts` (auth,
throttle, context) and `components/settings/AiAssist.tsx` / `SkillsAi.tsx` (the UI).

## Contact form

The contact form submits `name`, `email` and `message` with a standard `POST` to
[Formtorch](https://formtorch.com/f/d0w1ed3wlm). The endpoint is set in
`components/site/ContactForm.tsx`; no environment variable is needed. To use a different
Formtorch endpoint, update the form's `action` URL.

## Deploying to Vercel

1. **Push the project to GitHub.** Create a repository, push this folder, and connect it
   in Vercel with `npx vercel` or the dashboard. The framework preset is detected
   automatically, `vercel.json` already pins the build command.

2. **Create the database.** In the Vercel project go to *Storage* and create a
   *Postgres* database. Vercel creates a Neon database, provisions `DATABASE_URL` and
   `POSTGRES_PRISMA_URL` for you, and links the two projects. If you use Neon directly,
   copy its pooled connection string instead.

3. **Add the secrets.** In *Settings* → *Environment Variables*:

   | Variable | Value |
   | --- | --- |
   | `DATABASE_URL` | Provided by the database integration. |
   | `SETTINGS_PASSWORD` | The password for `/settings`. Use a long random string. |
   | `AUTH_SECRET` | A different long random string, used to sign the session cookie. |
   | `GOOGLE_GENERATIVE_AI_API_KEY` | Optional. Recommended free-tier provider; turns on the assistant. |
   | `GROQ_API_KEY` | Optional alternative provider. |
   | `OPENAI_API_KEY` | Optional; OpenAI API billing may be required. |
   | `AI_MODEL` | Optional. Overrides the default model for the selected provider. |

   `DATABASE_SSL` is only needed for a self managed database, `DATABASE_POOL_SIZE`
   overrides the connection pool size (default `1`, which is right for serverless).

4. **Set the region.** `vercel.json` pins the function region to `iad1`. Change it to
   the region of your database so the page does not wait on a cross region round trip.
   Neon databases created through Vercel default to the same region.

5. **Create the tables.** The build cannot talk to the database, so apply the schema
   from a machine that can reach it:

   ```bash
   DATABASE_URL="<the connection string>" npm run db:push
   DATABASE_URL="<the connection string>" npm run db:seed   # optional, loads the starter content
   ```

   Or paste `db/schema.sql` into the Neon SQL editor.

6. **Deploy.** Push to the connected branch and Vercel builds the site. Open
   `/settings` and sign in with `SETTINGS_PASSWORD`.

Every edit in the editor writes to Postgres and revalidates the page, so the change is
live as soon as it is saved.

## Project layout

```
app/
  page.tsx                 the public page
  settings/                the editor, its login page and the server actions
  globals.css              the original stylesheet plus the editor styles
components/
  site/                    the sections of the public page
  settings/                the editor UI
content/fallback.json      the starter content and the offline fallback
db/schema.sql              the two tables
lib/
  content.ts               read and write the content
  db.ts                    the Postgres client
  auth.ts                  password check and session cookie
  ai.ts                    assistant prompts and response schemas
  editor-spec.ts           which fields each block and collection exposes
  settings-nav.ts          how the editor panels are grouped
  types.ts                 the content types
scripts/                   schema, seed, verification and smoke tests
legacy/original-site.html  the static page this was built from
```

## Notes

- `postgres` (porsel) is used instead of a Neon specific driver so the same code runs
  against a local database and the hosted one. The Neon pooled endpoint does not
  support prepared statements, so the client runs with `prepare: false`.
- `jsonb` parameters are sent with `sql.json(value)`. postgres serialises json
  parameters with `JSON.stringify`, so a pre-serialised string would be stored as a
  jsonb string instead of a jsonb object.
- The editor keeps the positions of a collection contiguous, so a new entry is always
  appended at the end and reordering never leaves gaps.
