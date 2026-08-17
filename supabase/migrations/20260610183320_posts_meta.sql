-- Per-post SEO metadata: {title, description, keywords, ogImage}.
-- Falls back to post title/excerpt when fields are empty.
alter table public.posts
  add column if not exists meta jsonb not null default '{}'::jsonb;
