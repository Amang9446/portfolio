# Contributing

Thanks for taking a look. Issues and pull requests are both welcome — bug
reports and small fixes especially.

## Getting set up

```bash
npm install
npm run dev
```

That is enough for most changes. With no `.env.local`, Supabase is skipped
entirely and the public pages render from `src/config/portfolio.ts`, so you can
work on layout, styling, and the markdown pipeline without a database. The blog
and `/admin` need Supabase — see [the README](./README.md#2-add-supabase-for-the-blog-and-admin-dashboard).

## Before opening a PR

```bash
npm run format:check   # prettier
npm run lint           # eslint
npm run typecheck      # tsc --noEmit
npm test               # vitest
npm run build          # the real check
```

CI runs all five on every pull request. The build matters most: `generateStaticParams`,
the sitemap, and the tag archives all execute at build time.

`npm run format` fixes formatting; `npm run test:watch` reruns tests as you edit.

## How the codebase is laid out

The short version — [CLAUDE.md](./CLAUDE.md) has the detail.

- `src/app/` — routes. Public pages are ISR (`revalidate = 60`); `admin/` is dynamic.
- `src/lib/` — data access and pure logic. Anything testable lives here.
- `src/components/` — `sections/`, `posts/`, `markdown/`, `admin/`, `ui/`.
- `src/config/portfolio.ts` — static fallback content.
- `supabase/` — `schema.sql` is canonical; `migrations/` is the history.

## Things worth knowing before you change them

**Public reads must use `createPublicClient()`.** The cookie-bound server
client calls `cookies()`, which silently opts the route out of static rendering
and makes every visit hit the database. The server client is for admin and auth
paths only.

**The security model has three layers** — proxy, server-side `requireUser()`,
and RLS. All three stay. See [SECURITY.md](./SECURITY.md).

**Database changes need both files.** Add a migration under
`supabase/migrations/` _and_ update `supabase/schema.sql`, which is the
canonical schema a fresh install runs. New RLS policies follow the two
conventions documented above the policy section in `schema.sql`.

**The markdown pipeline is shared.** `markdown-content.tsx` renders both the
public article and the admin split preview, so they can never disagree. It is
covered by `markdown-content.test.tsx`; add a case there for any change.

### Agent-assisted draft image uploads

Agents never receive an admin session or service-role key. They prepare a
non-secret request describing the exact local files:

```bash
node scripts/draft-image-upload.mjs request \
  path/to/cover.webp path/to/diagram.webp
```

Paste the printed request into **Agent image upload** on the saved, unpublished
post. Review the filenames, sizes, and MIME types, then click **Approve exact
files**. The authenticated editor asks Supabase Storage for non-overwriting
signed upload URLs and downloads the handoff JSON. Give only that downloaded
file back to the agent and run the command printed by `request`.
On the same Mac, the downloaded filename contains the request id, so the agent
already knows its exact path in `Downloads`; saying “done” is enough unless the
browser saves downloads somewhere else.

The handoff is restricted to new, random paths under that post, ends five
minutes before Supabase's two-hour token lifetime, and contains no admin or
service-role credential. The local command verifies every SHA-256 hash before
network access, records progress so interrupted batches resume safely, and
deletes its temporary credentials after success. It uploads media only—it never
edits the article body or metadata. Do not commit or paste a handoff file into an
issue; discard it or wait for it to expire if the batch is cancelled.

**`rehype-code-lines.ts` and `code-block.tsx` are coupled.** The rehype plugin
removes the newline text nodes between lines, which is why the copy button
rejoins `.code-line` elements by hand. Change one, check the other.

## Style

Prettier and ESLint decide formatting; don't hand-format around them. Beyond
that, the main convention is that comments explain _why_ rather than _what_ —
match the density of the file you are editing.

Component files are kebab-case. Pure logic goes in `src/lib/` with a
`*.test.ts` next to it.

## Using this as a template

Go ahead — it's MIT. Start with `src/config/portfolio.ts`, then the design
tokens in `src/app/globals.css`. A link back is appreciated but not required.
