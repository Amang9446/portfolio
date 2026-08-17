# Security policy

## Reporting a vulnerability

Please **do not** open a public issue for a security problem.

Use GitHub's [private vulnerability reporting](https://github.com/amanunreal/portfolio/security/advisories/new)
(Security → Report a vulnerability), or email **amang9446@gmail.com**.

Include what you found, how to reproduce it, and what an attacker could do with
it. I'll acknowledge within a few days. This is a personal project maintained in
spare time, so please allow reasonable time for a fix before disclosing.

## Scope

This repo is a personal site, but people fork it as a template — so anything
that would let a **non-admin write content, read unpublished drafts, or escalate
into the admin dashboard** is in scope, in a default install as documented in
the README.

Also in scope: anything that leaks Supabase credentials beyond the anon key,
bypasses the RLS boundary, or lets a public RPC do more than it advertises.

## The security model

Three independent layers guard the admin surface. All three are load-bearing:

1. **`src/proxy.ts`** — refreshes the session and gates `/admin/*` at the edge.
2. **Server-side checks** — the `(dashboard)` layout and `requireUser()` at the
   top of every server action re-verify on the server.
3. **Row Level Security** — the hard boundary. Writes require
   `public.is_admin()`, which matches the JWT email against the RLS-locked
   `admin_emails` table.

Being merely `authenticated` grants nothing. This matters because **Supabase
allows public signups by default** — if `authenticated` were the write gate,
anyone who registered could edit the site. Disabling public signups is step 3
of the README's setup for exactly this reason.

The app-layer allowlist in `src/lib/admin.ts` mirrors the database one via the
`ADMIN_EMAILS` env var, and **fails closed**: if the variable is unset, nobody
gets into `/admin`, including the owner. Never widen that check.

### Keys

The `NEXT_PUBLIC_SUPABASE_ANON_KEY` is meant to be shipped to the browser. It
carries no privileges of its own — every table has RLS enabled, so a leaked
anon key cannot write.

**Never add a service-role key to this project.** Nothing here needs one, and it
would bypass every policy above.

### Public RPCs

Five `SECURITY DEFINER` functions are callable by anonymous visitors. Each one
is deliberately narrow, and the Supabase database linter flags all five by
design — see the note at the top of `supabase/schema.sql` before "fixing" them.

## Known, accepted limitations

These are deliberate trade-offs for a personal site, not undiscovered bugs.
Worth knowing if you fork this and your threat model differs:

- **View counts are not rate-limited.** `record_post_view` can be called
  repeatedly to inflate a post's counter. It can only ever increment the
  counter of an already-published post.
- **Likes are keyed to a browser-generated visitor ID** held in
  `localStorage`. Clearing storage or scripting the RPC allows repeat likes.
  Both counters are presentational; nothing depends on their accuracy.
- **Admin content is trusted.** Post markdown is authored by an admin and
  rendered without HTML sanitization beyond what `react-markdown` does by
  default (raw HTML is not enabled). If you extend this to accept content from
  anyone but yourself, that assumption no longer holds.
