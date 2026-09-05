-- Admin allowlist: only emails in this table may write content.
-- Mitigates the default-open Supabase signup: a random signed-up user is
-- "authenticated" but NOT an admin.
create table if not exists public.admin_emails (
  email text primary key
);

-- Lock the table down completely: RLS on, no policies.
-- Only the security-definer function below (and the service role) can read it.
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

-- Add YOUR admin login email here. This is the row that actually grants write
-- access — it must match an address in the ADMIN_EMAILS env var too.
--
-- Deliberately left commented out: this file is public, and a hardcoded
-- address would hand admin rights to someone else's account on every fork.
--
-- insert into public.admin_emails (email) values
--   ('you@example.com')
-- on conflict (email) do nothing;

-- Replace authenticated-role policies with admin-only policies.
drop policy if exists "Public can read published posts" on public.posts;
create policy "Public can read published posts"
  on public.posts for select
  using (published = true or public.is_admin());

drop policy if exists "Authenticated can write posts" on public.posts;
drop policy if exists "Admins can write posts" on public.posts;
create policy "Admins can write posts"
  on public.posts for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Authenticated can write projects" on public.projects;
drop policy if exists "Admins can write projects" on public.projects;
create policy "Admins can write projects"
  on public.projects for all
  using (public.is_admin())
  with check (public.is_admin());
