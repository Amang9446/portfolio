-- Topic tags for blog posts.
-- Public reads are already covered by the existing row-level policies on
-- public.posts; adding a column needs no policy change.

alter table public.posts
  add column if not exists tags text[] not null default '{}';

-- Supports the tag archive pages (`tags @> array[...]`).
create index if not exists posts_tags_idx
  on public.posts using gin (tags);
