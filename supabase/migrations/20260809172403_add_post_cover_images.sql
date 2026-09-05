alter table public.posts
  add column if not exists cover_image_url text not null default '',
  add column if not exists cover_image_alt text not null default '';
