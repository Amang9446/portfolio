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

- `npm run dev` / `npm run build` / `npm run lint` (`eslint .` — `next lint` is gone in Next 16)
- Middleware lives in `src/proxy.ts` (Next 16 renamed middleware → proxy)

## Architecture

All public content is DB-first with static fallback (`src/config/portfolio.ts`)
so the site renders without Supabase configured.

- `src/lib/settings.ts` — hero/contact/SEO-metadata/skills/section-visibility (`site_settings` JSON-per-key + `skills` table; `sections` key hides homepage sections + blog)
- `src/lib/projects.ts` — projects (falls back to config when table empty; rows with `visible=false` are filtered from the public list, but an all-hidden table does NOT re-trigger the static fallback)
- `src/lib/posts.ts` — blog posts; `meta` jsonb holds per-post SEO overrides {title, description, keywords, ogImage}; `tags text[]` drives `/blog/tag/[tag]` archives (`getAllTags`/`getPostsByTag` filter the cached published list rather than querying again)
- `src/lib/tags.ts` — tag normalize/slug helpers shared by admin, public pages, and `savePost`
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
- Editor images: inserted as `local:<id>` placeholders, uploaded to the public `media` storage bucket only on Save, then URLs swapped in

### Security model (do not weaken)

Three layers, all must stay:
1. `src/proxy.ts` — session refresh + admin gate + redirect for `/admin/*`
2. `(dashboard)/layout.tsx` + `requireUser()` in every action — server-side check
3. RLS — the hard boundary. Writes require `public.is_admin()`, which checks the JWT email against the `admin_emails` table (RLS deny-all, read via security-definer fn). "authenticated" alone is NOT trusted because Supabase signups are public by default.

App-layer allowlist mirrors it via `ADMIN_EMAILS` env (`src/lib/admin.ts`).
Security headers in `next.config.ts`; `/admin` is noindex. Admin email: amang9446@gmail.com.

## Supabase project

- Project: "portfolio" (`nasejsbkkaonqcfkxljf`), region ap-south-1, free tier
- Tables: `posts`, `projects`, `site_settings`, `skills`, `admin_emails`; storage bucket `media` (public read, admin write)
- Env (`.env.local`, also needed on Vercel): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ADMIN_EMAILS`
- Supabase MCP server is configured for this repo — use it for migrations/SQL instead of asking the user to run dashboard queries; mirror every migration into `supabase/schema.sql`
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
- Large body of work is uncommitted on branch `v2`

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
