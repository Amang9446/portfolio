-- Portfolio schema: blog posts + projects.
-- Run this in the Supabase SQL editor (Dashboard -> SQL Editor -> New query).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Posts
-- ---------------------------------------------------------------------------
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text not null default '',
  content text not null default '',
  cover_image_url text not null default '',
  cover_image_alt text not null default '',
  show_on_home boolean not null default false,
  view_count bigint not null default 0
    constraint posts_view_count_nonnegative check (view_count >= 0),
  published boolean not null default false,
  published_at timestamptz,
  -- Per-post SEO overrides: {title, description, keywords, ogImage}
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Keep existing installations in sync when this bootstrap schema is rerun.
alter table public.posts
  add column if not exists cover_image_url text not null default '',
  add column if not exists cover_image_alt text not null default '',
  add column if not exists show_on_home boolean not null default false,
  add column if not exists view_count bigint not null default 0;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'posts_view_count_nonnegative'
      and conrelid = 'public.posts'::regclass
  ) then
    alter table public.posts
      add constraint posts_view_count_nonnegative
      check (view_count >= 0);
  end if;
end $$;

create index if not exists posts_home_published_at_idx
  on public.posts (published_at desc)
  where published = true and show_on_home = true;

-- ---------------------------------------------------------------------------
-- Projects
-- ---------------------------------------------------------------------------
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  image text not null default '',
  demo_url text,
  github_url text,
  docs_url text,
  tags text[] not null default '{}',
  sort_order integer not null default 0,
  visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- View increments are analytics, not editorial changes, so they must not
-- rewrite the post's updated_at timestamp.
create or replace function public.set_post_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if (pg_catalog.to_jsonb(new) - 'view_count')
     is distinct from
     (pg_catalog.to_jsonb(old) - 'view_count') then
    new.updated_at = pg_catalog.now();
  end if;
  return new;
end;
$$;

revoke all on function public.set_post_updated_at()
  from public, anon, authenticated, service_role;

drop trigger if exists posts_updated_at on public.posts;
create trigger posts_updated_at
  before update on public.posts
  for each row execute function public.set_post_updated_at();

drop trigger if exists projects_updated_at on public.projects;
create trigger projects_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Admin allowlist: only emails in this table may write content.
-- Supabase signups are public by default, so "authenticated" is NOT a
-- sufficient write gate. Add your login email(s) below.
-- ---------------------------------------------------------------------------
create table if not exists public.admin_emails (
  email text primary key
);

-- RLS on with no policies: nothing can read this table except the
-- security-definer function below and the service role.
alter table public.admin_emails enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_emails
    where lower(email) = lower(coalesce(auth.jwt()->>'email', ''))
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- Public, deliberately narrow RPC used by the article page. It can only
-- increment the counter of an already-published post and returns that count.
create or replace function public.record_post_view(target_post_id uuid)
returns bigint
language sql
volatile
security definer
set search_path = ''
as $$
  update public.posts
  set view_count = view_count + 1
  where id = target_post_id
    and published = true
  returning view_count;
$$;

revoke all on function public.record_post_view(uuid)
  from public, anon, authenticated, service_role;
grant execute on function public.record_post_view(uuid) to anon, authenticated;

-- Replace with your admin login email(s):
-- insert into public.admin_emails (email) values ('you@example.com');

-- ---------------------------------------------------------------------------
-- Row Level Security: public read, admin-only write
-- ---------------------------------------------------------------------------
alter table public.posts enable row level security;
alter table public.projects enable row level security;

drop policy if exists "Public can read published posts" on public.posts;
create policy "Public can read published posts"
  on public.posts for select
  using (published = true or public.is_admin());

drop policy if exists "Admins can write posts" on public.posts;
create policy "Admins can write posts"
  on public.posts for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Public can read projects" on public.projects;
create policy "Public can read projects"
  on public.projects for select
  using (true);

drop policy if exists "Admins can write projects" on public.projects;
create policy "Admins can write projects"
  on public.projects for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Storage: public media bucket, admin-only writes
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

drop policy if exists "Public can read media" on storage.objects;
create policy "Public can read media"
  on storage.objects for select
  using (bucket_id = 'media');

drop policy if exists "Admins can upload media" on storage.objects;
create policy "Admins can upload media"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and public.is_admin());

drop policy if exists "Admins can update media" on storage.objects;
create policy "Admins can update media"
  on storage.objects for update to authenticated
  using (bucket_id = 'media' and public.is_admin())
  with check (bucket_id = 'media' and public.is_admin());

drop policy if exists "Admins can delete media" on storage.objects;
create policy "Admins can delete media"
  on storage.objects for delete to authenticated
  using (bucket_id = 'media' and public.is_admin());

-- ---------------------------------------------------------------------------
-- Site content: singleton settings (hero/contact/metadata) + skills
-- ---------------------------------------------------------------------------
create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

drop trigger if exists site_settings_updated_at on public.site_settings;
create trigger site_settings_updated_at
  before update on public.site_settings
  for each row execute function public.set_updated_at();

create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in ('tech', 'tools')),
  sort_order integer not null default 0
);

alter table public.site_settings enable row level security;
alter table public.skills enable row level security;

drop policy if exists "Public can read site settings" on public.site_settings;
create policy "Public can read site settings"
  on public.site_settings for select
  using (true);

drop policy if exists "Admins can write site settings" on public.site_settings;
create policy "Admins can write site settings"
  on public.site_settings for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Public can read skills" on public.skills;
create policy "Public can read skills"
  on public.skills for select
  using (true);

drop policy if exists "Admins can write skills" on public.skills;
create policy "Admins can write skills"
  on public.skills for all
  using (public.is_admin())
  with check (public.is_admin());
