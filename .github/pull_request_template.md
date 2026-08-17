## What this changes

<!-- One or two sentences. Link the issue if there is one. -->

## Why

<!-- The problem being solved, not the diff. -->

## Checks

- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] `npm run build`

## If this touches the database

- [ ] Migration added under `supabase/migrations/`
- [ ] `supabase/schema.sql` updated to match — it is the canonical schema
- [ ] RLS policies follow the two conventions documented at the top of the
      policy section (per-command admin policies, `(select public.is_admin())`)

## If this touches the markdown pipeline

- [ ] `src/components/markdown/markdown-content.test.tsx` still passes — the
      admin preview and the public article share one pipeline, so a change to
      either affects both
