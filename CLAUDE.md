# Portfolio — aman.is-a.dev

Personal portfolio of Aman (@amang9446): Next.js 16 site with a public blog and
a Supabase-backed admin dashboard that manages ALL site content.

## Stack

- Next.js 16 (App Router, Turbopack), React 19, TypeScript
- Tailwind CSS v4 (CSS-first config in `globals.css`, no tailwind.config)
- Supabase: Postgres + Auth + Storage (`@supabase/ssr` for cookies/session)
- Light/dark toggle is hand-rolled (`ui/theme-provider.tsx` + `ui/theme-script.tsx`) —
  next-themes was dropped because its ThemeProvider is a client component
- react-markdown + remark-gfm, sonner toasts
- Deployed on Vercel; `vercel.json` cron hits `/api/ping` daily

## Commands

- `npm run dev` / `npm run build`
- `npm run lint` (`eslint .` — `next lint` is gone in Next 16) / `npm run typecheck`
- `npm test` (vitest, `src/**/*.test.ts(x)`) / `npm run test:watch`
- `npm run format` / `npm run format:check` (prettier; CLAUDE.md is ignored)
- CI runs all five on every PR: `.github/workflows/ci.yml`
- Middleware lives in `src/proxy.ts` (Next 16 renamed middleware → proxy)

## Architecture

All public content is DB-first with static fallback (`src/config/portfolio.ts`)
so the site renders without Supabase configured.

`config/portfolio.ts` holds **generic placeholders on purpose** — the repo is
public and reusable. Real deployment content comes from `NEXT_PUBLIC_PORTFOLIO_CONFIG`,
a JSON env var deep-merged over those defaults (objects merge field-by-field,
arrays replace). Never commit personal content back into the defaults;
`config/portfolio.test.ts` guards this.

- `src/lib/settings.ts` — hero/contact/SEO-metadata/skills/section-visibility (`site_settings` JSON-per-key + `skills` table; `sections` key hides homepage sections + blog). Also exports `pageTitle()` and `twitterCreator()` — **no route may hardcode the owner's name or handle**; every title is `pageTitle(label, site)` and the brand wordmark comes from `site.hero.name` via NavBar's `brand` prop
- `src/lib/site-url.ts` — `NEXT_PUBLIC_SITE_URL` → Vercel's project URL → `localhost:3000`. Reaching localhost **on Vercel throws and fails the build**, since localhost canonicals are silent and slow to undo; locally and in CI it is a supported default
- `src/lib/projects.ts` — projects (falls back to config when table empty; rows with `visible=false` are filtered from the public list, but an all-hidden table does NOT re-trigger the static fallback)
- `src/lib/posts.ts` — blog posts; `meta` jsonb holds per-post SEO overrides {title, description, keywords, ogImage}; `tags text[]` drives `/blog/tag/[tag]` archives (`getAllTags`/`getPostsByTag` filter the cached published list rather than querying again)
- `src/lib/tags.ts` — tag normalize/slug helpers shared by admin, public pages, and `savePost`
- `src/lib/markdown-commands.ts` — pure text transforms behind the admin editor (wrap/prefix/heading/indent/list-continuation). No DOM; `components/admin/use-markdown-editor.ts` is the only thing that touches a textarea
- `src/lib/media.ts` — `postMediaPaths()`: which storage objects a post owns, used to clean up on delete
- `src/lib/image-hosts.ts` — single source of truth for optimizable image hosts. `next.config.ts` builds `images.remotePatterns` from it and `post-cover.tsx` checks against it, so they cannot drift. The Supabase host is derived from `NEXT_PUBLIC_SUPABASE_URL`, never hardcoded
- `src/lib/structured-data.ts` — JSON-LD builders (BlogPosting/Blog/Person/WebSite/BreadcrumbList); always embed via `jsonLdScript()`, which escapes `<`
- `src/lib/feed.ts` — RSS 2.0 for `/feed.xml`; `src/app/sitemap.ts` + `src/app/robots.ts` are the other discovery routes. All three gate on `sections.blog`
- `src/lib/supabase/{client,server,public,config}.ts` — browser/server/public clients; `isSupabaseConfigured()` gates all DB calls
- PERF-CRITICAL: public-page reads MUST use `createPublicClient()` (cookie-free). The cookie-bound server client calls `cookies()`, which silently opts the route out of static rendering/ISR and makes every visit hit Supabase live. Server client is for admin/auth paths only.
- `supabase/schema.sql` — canonical schema, kept in sync with live DB (migrations applied via Supabase MCP)
- Public pages use ISR (`revalidate = 60`); admin server actions call `revalidatePath` on save

### Admin (`/admin`)

- Login: Supabase email+password. Route group `(dashboard)` holds guarded pages; `login/` sits outside it
- Sections: Posts (markdown editor: toolbar, split preview, localStorage draft backup, deferred image upload), Projects, Site (hero/skills/contact/SEO), Account (password change — email reset flow unused)
- Server actions in `src/app/admin/actions.ts`; every mutation calls `requireUser()`
- Editor images: inserted as `local:<id>` placeholders, uploaded to the public `media` storage bucket only on Save, then URLs swapped in. `deletePost` removes a post's `media` objects (via `postMediaPaths`) best-effort — a storage failure logs but does not fail the already-completed delete
- The editor is split across four files: `post-form.tsx` (form state, images, save), `editor-toolbar.tsx` (buttons + shortcuts panel), `use-markdown-editor.ts` (textarea controller; routes edits through `execCommand("insertText")` so ⌘Z keeps working), `use-draft-backup.ts` (localStorage). The transforms themselves are pure and tested in `src/lib/markdown-commands.ts` — put new commands there, not in the component

### Security model (do not weaken)

Three layers, all must stay:
1. `src/proxy.ts` — session refresh + admin gate + redirect for `/admin/*`
2. `(dashboard)/layout.tsx` + `requireUser()` in every action — server-side check
3. RLS — the hard boundary. Writes require `public.is_admin()`, which checks the JWT email against the `admin_emails` table (RLS deny-all, read via security-definer fn). "authenticated" alone is NOT trusted because Supabase signups are public by default.

Two RLS conventions, documented above the policy section in `schema.sql`:
admin write access is granted **per command** (never `for all`, which would add a
second permissive SELECT policy to every table), and `is_admin()` is always
called as `(select public.is_admin())` so Postgres caches it as a once-per-statement
InitPlan instead of re-evaluating per row.

Public-facing SECURITY DEFINER RPCs (`is_admin`, `record_post_view`,
`get_post_like_state`, `set_post_like`, `has_any_projects`) are flagged by the
Supabase linter **by design** — see the note in `schema.sql`. Do not "fix" them.

App-layer allowlist mirrors it via `ADMIN_EMAILS` env (`src/lib/admin.ts`).
Security headers in `next.config.ts`; `/admin` is noindex. Admin email: amang9446@gmail.com.

## Supabase project

- Project: "portfolio" (`nasejsbkkaonqcfkxljf`), region ap-south-1, free tier
- Tables: `posts`, `projects`, `site_settings`, `skills`, `admin_emails`; storage bucket `media` (public read, admin write)
- Env (`.env.local`, also needed on Vercel): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ADMIN_EMAILS`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_PORTFOLIO_CONFIG`
- Supabase MCP server is configured for this repo — use it for migrations/SQL instead of asking the user to run dashboard queries; mirror every migration into `supabase/schema.sql`
- `supabase/config.toml` makes `migrations/` a real CLI history (`supabase db push`, `supabase start`); `schema.sql` remains the canonical single-file install. Both must stay in sync with the live DB — verify with `list_migrations` and an `information_schema.columns` query, not by assuming
- The migration files seed **placeholder** content and no admin email on purpose; the live DB's real values are not in the repo
- Free tier pauses after ~1 week of zero activity; the daily `/api/ping` cron (live after Vercel deploy) prevents that

## Design system

Soft minimal, "precise, confident, calm" — context in `.impeccable.md`. Both themes first-class.
- Fonts: Schibsted Grotesk (display) + Albert Sans (body) + Geist Mono (labels/code), loaded in `layout.tsx`
- OKLCH tokens in `globals.css`, neutrals tinted toward warm clay (~hue 40–75); accent `--primary`
- Conventions: mono uppercase tracking-wide kickers, `max-w-5xl px-6` section wrapper, border-separated sections, `.reveal` staggered entrance (respects reduced motion), `.markdown` styles blog content

### Article Markdown extensions

The pipeline in `src/components/markdown/markdown-content.tsx` is shared by the
public article and the admin split preview, so both always agree.

- **Callouts**: `> [!NOTE|TIP|IMPORTANT|WARNING|CAUTION]`, optionally followed by a
  custom title on the same line. `src/lib/remark-callouts.ts` tags the blockquote;
  `markdown/callout.tsx` renders the label. Unmarked blockquotes are untouched, and
  the raw `.md` endpoints keep the standard GFM syntax.
- **Code fences**: ```` ```ts title="src/lib/posts.ts" {2,4-6} numbered ````. The meta
  string survives to hast as `data.meta`; `src/lib/rehype-code-lines.ts` runs *after*
  `rehype-highlight` and splits the output into `.code-line` spans (cloning any hljs
  token that straddles a newline). Line numbers and highlighting both hang off those
  spans. It removes the newline text nodes, so the copy button in `code-block.tsx`
  rejoins lines explicitly — keep those two in sync.
- **Image zoom**: `posts/article-lightbox.tsx` mounts once per article and promotes
  the server-rendered `<img>`s to focusable buttons via one delegated listener, so
  image count never adds client components. Images inside links are skipped.
- Avoid: gradient text, glassmorphism, glow effects, card grids with icon-above-heading, pure black/white

## Pending / manual steps (dashboard-only, not exposed via MCP)

- Disable public signups: Auth → Sign In/Up settings
- Enable leaked-password protection: same page
- At deploy: set Site URL to prod domain (Auth → URL Configuration) — currently localhost, so auth emails link wrong (harmless; email flows unused)
- **Set `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_PORTFOLIO_CONFIG` in Vercel.** Neither was ever set there — the domain used to be hardcoded in `site-url.ts` and the identity in `config/portfolio.ts`. A Vercel build without `NEXT_PUBLIC_SITE_URL` now fails deliberately rather than shipping localhost canonicals

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
