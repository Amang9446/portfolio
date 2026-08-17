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
  like_count bigint not null default 0
    constraint posts_like_count_nonnegative check (like_count >= 0),
  published boolean not null default false,
  published_at timestamptz,
  tags text[] not null default '{}',
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
  add column if not exists view_count bigint not null default 0,
  add column if not exists like_count bigint not null default 0,
  add column if not exists tags text[] not null default '{}';

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

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'posts_like_count_nonnegative'
      and conrelid = 'public.posts'::regclass
  ) then
    alter table public.posts
      add constraint posts_like_count_nonnegative
      check (like_count >= 0);
  end if;
end $$;

create index if not exists posts_home_published_at_idx
  on public.posts (published_at desc)
  where published = true and show_on_home = true;

-- Unused today: getPostsByTag filters the already-cached published list in
-- memory rather than querying per tag, which keeps the free-tier read count
-- flat. Kept for when the post count outgrows that and archives query
-- `tags @> array[...]` directly.
create index if not exists posts_tags_idx
  on public.posts using gin (tags);

-- ---------------------------------------------------------------------------
-- Projects
-- ---------------------------------------------------------------------------
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  -- URL slug. NOT NULL with no default: every insert must supply one.
  -- saveProject() in src/app/admin/actions.ts derives it from the title.
  slug text not null,
  title text not null,
  description text not null default '',
  image text not null default '',
  demo_url text,
  github_url text,
  docs_url text,
  tags text[] not null default '{}',
  sort_order integer not null default 0,
  visible boolean not null default true,
  -- Long-form case-study fields, optional per project.
  role text not null default '',
  problem text not null default '',
  architecture text not null default '',
  challenges text not null default '',
  results text not null default '',
  media jsonb not null default '[]'::jsonb
    constraint projects_media_is_array check (jsonb_typeof(media) = 'array'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Keep existing installations in sync when this bootstrap schema is rerun.
alter table public.projects
  add column if not exists visible boolean not null default true,
  add column if not exists role text not null default '',
  add column if not exists problem text not null default '',
  add column if not exists architecture text not null default '',
  add column if not exists challenges text not null default '',
  add column if not exists results text not null default '',
  add column if not exists media jsonb not null default '[]'::jsonb;

-- `slug` needs the three-step treatment on an existing table: it is NOT NULL
-- with no default, so it has to arrive nullable, be backfilled, and only then
-- be constrained. (New installs get it directly from the create table above.)
alter table public.projects
  add column if not exists slug text;

update public.projects
set slug = coalesce(
  nullif(
    trim(both '-' from lower(
      regexp_replace(
        regexp_replace(title, '[^a-zA-Z0-9\s-]', '', 'g'),
        '\s+', '-', 'g'
      )
    )),
    ''
  ),
  'project-' || left(id::text, 8)
)
where slug is null or btrim(slug) = '';

-- Two projects can share a title; de-duplicate before the unique index.
with ranked as (
  select id, slug, row_number() over (partition by slug order by created_at, id) as n
  from public.projects
)
update public.projects p
set slug = ranked.slug || '-' || ranked.n
from ranked
where p.id = ranked.id and ranked.n > 1;

alter table public.projects
  alter column slug set not null;

create unique index if not exists projects_slug_key
  on public.projects (slug);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'projects_media_is_array'
      and conrelid = 'public.projects'::regclass
  ) then
    alter table public.projects
      add constraint projects_media_is_array
      check (jsonb_typeof(media) = 'array');
  end if;
end $$;

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

-- Engagement counters are analytics, not editorial changes, so they must not
-- rewrite the post's updated_at timestamp.
create or replace function public.set_post_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if (pg_catalog.to_jsonb(new) - 'view_count' - 'like_count')
     is distinct from
     (pg_catalog.to_jsonb(old) - 'view_count' - 'like_count') then
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
-- A note on the Supabase database linter
--
-- The functions below are SECURITY DEFINER and granted to `anon`, so the
-- advisor reports `anon_security_definer_function_executable` for each. That
-- is intentional and is the point of the design: each one is a deliberately
-- narrow RPC that reads or writes exactly one thing on behalf of a caller who
-- has no direct table access at all.
--
--   is_admin()            reads the RLS-locked admin_emails table
--   record_post_view()    increments the counter of a published post
--   get_post_like_state() reads one visitor's like state
--   set_post_like()       toggles one visitor's like
--   has_any_projects()    one bit: does the projects table have any rows
--
-- Every one of them sets an empty or fixed search_path and is revoked from
-- PUBLIC before being granted to the roles that need it. Do not "fix" the
-- advisor warning by switching them to SECURITY INVOKER — that would break
-- them, because the callers cannot touch the underlying tables.
-- ---------------------------------------------------------------------------

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

-- Anonymous readers get one reversible like per browser-generated visitor ID.
-- The raw visitor IDs stay private; clients can only use the two narrow RPCs.
create table if not exists public.post_likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  visitor_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (post_id, visitor_id)
);

alter table public.post_likes enable row level security;

revoke all on table public.post_likes from public, anon, authenticated;
grant all on table public.post_likes to service_role;

create or replace function public.get_post_like_state(
  target_post_id uuid,
  target_visitor_id uuid
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select pg_catalog.jsonb_build_object(
    'liked', exists (
      select 1
      from public.post_likes as likes
      where likes.post_id = target_post_id
        and likes.visitor_id = target_visitor_id
    ),
    'like_count', post.like_count
  )
  from public.posts as post
  where post.id = target_post_id
    and post.published = true;
$$;

revoke all on function public.get_post_like_state(uuid, uuid)
  from public, anon, authenticated, service_role;
grant execute on function public.get_post_like_state(uuid, uuid)
  to anon, authenticated;

create or replace function public.set_post_like(
  target_post_id uuid,
  target_visitor_id uuid,
  target_liked boolean
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  next_count bigint;
  changed_rows integer;
begin
  if target_liked is null then
    raise exception 'Like state is required';
  end if;
  if target_visitor_id is null then
    raise exception 'Visitor ID is required';
  end if;

  -- Lock one post briefly so the unique like row and cached count stay in sync.
  select post.like_count
  into next_count
  from public.posts as post
  where post.id = target_post_id
    and post.published = true
  for update;

  if not found then
    raise exception 'Post is not available';
  end if;

  if target_liked then
    insert into public.post_likes (post_id, visitor_id)
    values (target_post_id, target_visitor_id)
    on conflict (post_id, visitor_id) do nothing;
    get diagnostics changed_rows = row_count;

    if changed_rows = 1 then
      update public.posts
      set like_count = like_count + 1
      where id = target_post_id
      returning like_count into next_count;
    end if;
  else
    delete from public.post_likes as likes
    where likes.post_id = target_post_id
      and likes.visitor_id = target_visitor_id;
    get diagnostics changed_rows = row_count;

    if changed_rows = 1 then
      update public.posts
      set like_count = case when like_count > 0 then like_count - 1 else 0 end
      where id = target_post_id
      returning like_count into next_count;
    end if;
  end if;

  return pg_catalog.jsonb_build_object(
    'liked', target_liked,
    'like_count', next_count
  );
end;
$$;

revoke all on function public.set_post_like(uuid, uuid, boolean)
  from public, anon, authenticated, service_role;
grant execute on function public.set_post_like(uuid, uuid, boolean)
  to anon, authenticated;

-- Make newly created RPC signatures visible to PostgREST immediately.
notify pgrst, 'reload schema';

-- Replace with your admin login email(s):
-- insert into public.admin_emails (email) values ('you@example.com');

-- ---------------------------------------------------------------------------
-- Row Level Security: public read, admin-only write
-- ---------------------------------------------------------------------------
alter table public.posts enable row level security;
alter table public.projects enable row level security;

-- Two conventions apply to every policy below; keep them when adding more.
--
-- 1. Admin write access is granted per command (INSERT / UPDATE / DELETE),
--    never as `for all`. `for all` includes SELECT, which would leave two
--    permissive SELECT policies on the table and make every public read
--    evaluate is_admin() as well.
-- 2. is_admin() is always called as `(select public.is_admin())`. Postgres
--    caches a scalar subquery as a once-per-statement InitPlan; a bare call
--    is re-evaluated for every row.

drop policy if exists "Public can read published posts" on public.posts;
create policy "Public can read published posts"
  on public.posts for select
  using (published = true or (select public.is_admin()));

drop policy if exists "Admins can write posts" on public.posts;

drop policy if exists "Admins can insert posts" on public.posts;
create policy "Admins can insert posts"
  on public.posts for insert
  with check ((select public.is_admin()));

drop policy if exists "Admins can update posts" on public.posts;
create policy "Admins can update posts"
  on public.posts for update
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "Admins can delete posts" on public.posts;
create policy "Admins can delete posts"
  on public.posts for delete
  using ((select public.is_admin()));

drop policy if exists "Public can read projects" on public.projects;
create policy "Public can read projects"
  on public.projects for select
  using (visible = true or (select public.is_admin()));

-- Public pages cannot see hidden rows after the policy above, so they need
-- a 1-bit check to tell "table is empty" (use static fallback) from
-- "rows exist but are all hidden" (render an empty list).
create or replace function public.has_any_projects()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.projects);
$$;

revoke all on function public.has_any_projects()
  from public, anon, authenticated, service_role;
grant execute on function public.has_any_projects()
  to anon, authenticated;

notify pgrst, 'reload schema';

drop policy if exists "Admins can write projects" on public.projects;

drop policy if exists "Admins can insert projects" on public.projects;
create policy "Admins can insert projects"
  on public.projects for insert
  with check ((select public.is_admin()));

drop policy if exists "Admins can update projects" on public.projects;
create policy "Admins can update projects"
  on public.projects for update
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "Admins can delete projects" on public.projects;
create policy "Admins can delete projects"
  on public.projects for delete
  using ((select public.is_admin()));

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
  with check (bucket_id = 'media' and (select public.is_admin()));

drop policy if exists "Admins can update media" on storage.objects;
create policy "Admins can update media"
  on storage.objects for update to authenticated
  using (bucket_id = 'media' and (select public.is_admin()))
  with check (bucket_id = 'media' and (select public.is_admin()));

drop policy if exists "Admins can delete media" on storage.objects;
create policy "Admins can delete media"
  on storage.objects for delete to authenticated
  using (bucket_id = 'media' and (select public.is_admin()));

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

drop policy if exists "Admins can insert site settings" on public.site_settings;
create policy "Admins can insert site settings"
  on public.site_settings for insert
  with check ((select public.is_admin()));

drop policy if exists "Admins can update site settings" on public.site_settings;
create policy "Admins can update site settings"
  on public.site_settings for update
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "Admins can delete site settings" on public.site_settings;
create policy "Admins can delete site settings"
  on public.site_settings for delete
  using ((select public.is_admin()));

drop policy if exists "Public can read skills" on public.skills;
create policy "Public can read skills"
  on public.skills for select
  using (true);

drop policy if exists "Admins can write skills" on public.skills;

drop policy if exists "Admins can insert skills" on public.skills;
create policy "Admins can insert skills"
  on public.skills for insert
  with check ((select public.is_admin()));

drop policy if exists "Admins can update skills" on public.skills;
create policy "Admins can update skills"
  on public.skills for update
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "Admins can delete skills" on public.skills;
create policy "Admins can delete skills"
  on public.skills for delete
  using ((select public.is_admin()));
