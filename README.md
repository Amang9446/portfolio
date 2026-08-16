# aman.is-a.dev

Personal portfolio and blog. A Next.js 16 site with a public front end and a
Supabase-backed admin dashboard that manages **all** of the site's content —
hero copy, projects, skills, contact details, SEO metadata, and blog posts.

The whole site is DB-first with a static fallback, so it renders correctly even
with no database configured. That makes it easy to clone and run before you
decide whether you want the CMS half at all.

## Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack), React 19, TypeScript |
| Styling | Tailwind CSS v4 — CSS-first config in `globals.css`, no `tailwind.config` |
| Backend | Supabase (Postgres + Auth + Storage) via `@supabase/ssr` |
| Content | `react-markdown` + `remark-gfm` + `rehype-highlight`, with local plugins |
| UI | `lucide-react` icons, `sonner` toasts, Radix Dialog |
| Theming | Hand-rolled light/dark provider — see `src/components/ui/theme-provider.tsx` |
| Hosting | Vercel (`vercel.json` runs a daily cron against `/api/ping`) |

## Getting started

### 1. Run it without a database

```bash
git clone https://github.com/Amang9446/portfolio
cd portfolio
npm install
npm run dev
```

Open http://localhost:3000. With no `.env.local`, `isSupabaseConfigured()`
returns false, every DB call is skipped, and the public pages fall back to the
static content in `src/config/portfolio.ts`. Edit that file to make the site
yours. The blog and `/admin` will be empty — that part needs Supabase.

### 2. Add Supabase for the blog and admin dashboard

Create a project at [supabase.com](https://supabase.com), then:

```bash
cp .env.example .env.local
```

Fill in the values (Dashboard → Project Settings → API):

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key — public by design; RLS is the boundary |
| `NEXT_PUBLIC_SITE_URL` | Public origin, for canonical and social-preview URLs |
| `ADMIN_EMAILS` | Comma-separated emails allowed into `/admin` |

Apply the schema by pasting `supabase/schema.sql` into the Supabase SQL editor.
It is the canonical, always-current schema; `supabase/migrations/` holds the
incremental history if you'd rather replay it in order.

Then create your admin account:

1. Auth → Users → **Add user**, using an email you listed in `ADMIN_EMAILS`.
2. Insert the same address into the `admin_emails` table — this is what the
   database trusts, and it is what actually grants write access.
3. **Auth → Sign In/Up → disable public signups.** Supabase allows open
   registration by default; leaving it on means strangers can create accounts.

Restart the dev server and sign in at `/admin`.

> [!IMPORTANT]
> `ADMIN_EMAILS` must be set on every deployment, including Vercel. The gate in
> `src/lib/admin.ts` fails **closed** — if the variable is missing, nobody gets
> into `/admin`, including you.

## Security model

Three independent layers guard the admin surface. Keep all three:

1. **`src/proxy.ts`** — refreshes the session and gates `/admin/*` at the edge.
   (Next.js 16 renamed `middleware` → `proxy`.)
2. **Server-side checks** — the `(dashboard)` layout and `requireUser()` in
   every server action re-verify on the server.
3. **Row Level Security** — the hard boundary. Writes require
   `public.is_admin()`, which matches the JWT email against the `admin_emails`
   table. Being merely `authenticated` grants nothing, because Supabase signups
   are public by default.

The anon key is meant to be shipped to the browser. It carries no privileges of
its own — every table is protected by RLS, so a leaked anon key cannot write.
Never put a service-role key in this project; nothing here needs one.

## Project structure

```
src/
├── app/
│   ├── page.tsx                  # Home
│   ├── blog/                     # Blog index, articles, /blog/tag/[tag] archives
│   ├── admin/                    # Dashboard — (dashboard) group is auth-guarded
│   ├── api/og/blog/[slug]/       # Generated social preview images
│   ├── feed.xml/ llms.txt/       # RSS + LLM-readable article endpoints
│   ├── sitemap.ts  robots.ts     # Discovery
│   └── globals.css               # Tailwind v4 config + OKLCH design tokens
├── components/
│   ├── sections/                 # Hero, Projects, Skills, Writing, Contact
│   ├── posts/                    # Blog cards, TOC, lightbox, reading progress
│   ├── markdown/                 # Markdown pipeline + callouts + code blocks
│   ├── admin/                    # Editor, forms, tag input
│   └── ui/                       # Shared primitives
├── lib/
│   ├── supabase/                 # Browser, server, and public clients
│   ├── posts.ts  projects.ts     # DB reads with static fallback
│   ├── settings.ts               # Hero/contact/SEO/skills/section visibility
│   ├── structured-data.ts        # JSON-LD builders
│   └── remark-callouts.ts        # Local markdown plugins
├── config/portfolio.ts           # Static fallback content
└── proxy.ts                      # Session refresh + admin gate
supabase/
├── schema.sql                    # Canonical schema
└── migrations/                   # Incremental history
```

### One rule worth knowing

Public pages must read through `createPublicClient()` (cookie-free). The
cookie-bound server client calls `cookies()`, which silently opts the route out
of static rendering and makes every visit hit the database. The server client is
for admin and auth paths only.

## Writing posts

Posts are written in Markdown in the admin editor, which has a toolbar, split
preview, localStorage draft backup, and image upload. Standard GFM works, plus
three extensions — the preview and the published article share one pipeline, so
they always agree.

**Callouts** — GitHub-style alerts, with an optional custom title:

```markdown
> [!WARNING] Mind the cache
> Public pages are statically rendered and revalidate every 60 seconds.
```

Supported: `NOTE`, `TIP`, `IMPORTANT`, `WARNING`, `CAUTION`. Blockquotes without
a marker render as ordinary blockquotes.

**Code blocks** — a filename, highlighted lines, and line numbers:

````markdown
```ts title="src/lib/posts.ts" {2,4-6} numbered
```
````

**Images** — click any article image to open it full-size in a lightbox. This is
wired up by one delegated listener per article, so image count never adds
client-side components.

## Discovery

`/sitemap.xml`, `/robots.txt`, and `/feed.xml` (RSS 2.0) are generated from the
database, and every page carries JSON-LD. `/blog/<slug>.md`, `/llms.txt`, and
`/llms-full.txt` expose clean Markdown for LLM consumers. All of it respects the
blog's visibility toggle in the admin dashboard.

## Scripts

```bash
npm run dev     # Turbopack dev server
npm run build   # production build
npm run start   # serve the production build
npm run lint    # eslint . — note: `next lint` was removed in Next.js 16
```

## Contributing

Issues and pull requests are welcome. Please run `npm run lint` and
`npm run build` before opening a PR — the build is the real check, since the
sitemap and the tag archives execute against the database at build time.

If you reuse this as a template, a link back or a shoutout is appreciated.

## License

[MIT](./LICENSE) © Aman
