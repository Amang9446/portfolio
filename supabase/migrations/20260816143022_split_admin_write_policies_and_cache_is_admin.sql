-- Two RLS performance fixes, applied together because they touch the same
-- policies.
--
-- 1. The "Admins can write X" policies were declared `for all`, which includes
--    SELECT. Every public read therefore evaluated two permissive SELECT
--    policies and called is_admin() for the second one. Splitting them into
--    INSERT / UPDATE / DELETE leaves exactly one SELECT policy per table.
--
-- 2. `public.is_admin()` is now always called as `(select public.is_admin())`.
--    Postgres evaluates a scalar subquery once per statement as an InitPlan,
--    whereas a bare function call in a policy is re-evaluated per row.

-- ---------------------------------------------------------------------------
-- posts
-- ---------------------------------------------------------------------------
drop policy if exists "Public can read published posts" on public.posts;
create policy "Public can read published posts"
  on public.posts for select
  using (published = true or (select public.is_admin()));

drop policy if exists "Admins can write posts" on public.posts;

create policy "Admins can insert posts"
  on public.posts for insert
  with check ((select public.is_admin()));

create policy "Admins can update posts"
  on public.posts for update
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Admins can delete posts"
  on public.posts for delete
  using ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- projects
-- ---------------------------------------------------------------------------
drop policy if exists "Admins can write projects" on public.projects;

create policy "Admins can insert projects"
  on public.projects for insert
  with check ((select public.is_admin()));

create policy "Admins can update projects"
  on public.projects for update
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Admins can delete projects"
  on public.projects for delete
  using ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- site_settings
-- ---------------------------------------------------------------------------
drop policy if exists "Admins can write site settings" on public.site_settings;

create policy "Admins can insert site settings"
  on public.site_settings for insert
  with check ((select public.is_admin()));

create policy "Admins can update site settings"
  on public.site_settings for update
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Admins can delete site settings"
  on public.site_settings for delete
  using ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- skills
-- ---------------------------------------------------------------------------
drop policy if exists "Admins can write skills" on public.skills;

create policy "Admins can insert skills"
  on public.skills for insert
  with check ((select public.is_admin()));

create policy "Admins can update skills"
  on public.skills for update
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Admins can delete skills"
  on public.skills for delete
  using ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- storage: same treatment for the media bucket
-- ---------------------------------------------------------------------------
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
