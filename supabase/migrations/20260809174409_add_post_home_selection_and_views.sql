alter table public.posts
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

update public.posts
set show_on_home = true
where published = true;

-- View counts are analytics, not editorial changes, so they must not bump
-- updated_at. (20260810172417_add_post_likes extends this to like_count.)
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
