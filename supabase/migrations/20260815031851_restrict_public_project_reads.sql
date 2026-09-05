-- Hide unpublished projects from the public Data API. The previous SELECT
-- policy used USING (true), so visible=false was only a UI filter.
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
