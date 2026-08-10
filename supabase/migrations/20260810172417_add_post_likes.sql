-- Adds reversible anonymous article likes and a cached public count.
alter table public.posts
  add column if not exists like_count bigint not null default 0;

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

notify pgrst, 'reload schema';
