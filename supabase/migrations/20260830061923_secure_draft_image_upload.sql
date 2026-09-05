-- Short-lived, capability-scoped grants for agent-assisted draft image uploads.
--
-- The public Edge Function never receives an admin JWT or service-role key.
-- A database administrator (including Supabase MCP) creates one grant per
-- exact file. The function can consume that grant once, for one unpublished
-- post, within ten minutes. Only a SHA-256 hash of the bearer token is stored.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table private.draft_image_upload_grants (
  id uuid primary key,
  post_id uuid not null references public.posts(id) on delete cascade,
  object_path text not null unique,
  token_hash text not null unique,
  file_sha256 text not null,
  content_type text not null,
  max_bytes bigint not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz,
  constraint draft_image_upload_token_hash check (
    token_hash ~ '^[0-9a-f]{64}$'
  ),
  constraint draft_image_upload_file_hash check (
    file_sha256 ~ '^[0-9a-f]{64}$'
  ),
  constraint draft_image_upload_content_type check (
    content_type in (
      'image/avif',
      'image/gif',
      'image/jpeg',
      'image/png',
      'image/webp'
    )
  ),
  constraint draft_image_upload_size check (
    max_bytes between 1 and 10485760
  ),
  constraint draft_image_upload_expiry check (
    expires_at > created_at
    and expires_at <= created_at + interval '10 minutes'
  )
);

alter table private.draft_image_upload_grants enable row level security;
alter table private.draft_image_upload_grants force row level security;

create index draft_image_upload_grants_post_id_idx
  on private.draft_image_upload_grants (post_id);

create index draft_image_upload_grants_expires_at_idx
  on private.draft_image_upload_grants (expires_at)
  where used_at is null;

-- Called only through direct database administration. No API role can issue
-- upload grants, including service_role.
create or replace function private.issue_draft_image_upload_grant(
  p_grant_id uuid,
  p_post_id uuid,
  p_object_path text,
  p_token_hash text,
  p_file_sha256 text,
  p_content_type text,
  p_max_bytes bigint
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  post_slug text;
  post_published boolean;
  expected_prefix text;
  expected_extension text;
begin
  select p.slug, p.published
    into post_slug, post_published
  from public.posts p
  where p.id = p_post_id;

  if post_slug is null then
    raise exception 'Draft post not found';
  end if;
  if post_published then
    raise exception 'Upload grants are limited to unpublished posts';
  end if;
  if p_token_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid token hash';
  end if;
  if p_file_sha256 !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid file hash';
  end if;
  if p_max_bytes not between 1 and 10485760 then
    raise exception 'Image must be between 1 byte and 10 MiB';
  end if;

  expected_extension := case p_content_type
    when 'image/avif' then 'avif'
    when 'image/gif' then 'gif'
    when 'image/jpeg' then '(jpg|jpeg)'
    when 'image/png' then 'png'
    when 'image/webp' then 'webp'
    else null
  end;
  if expected_extension is null then
    raise exception 'Unsupported image content type';
  end if;

  expected_prefix := 'posts/' || post_slug || '/agent-' || p_grant_id::text || '-';
  if not starts_with(p_object_path, expected_prefix)
    or p_object_path !~ ('^[a-z0-9/_-]+\.(' || expected_extension || ')$')
  then
    raise exception 'Object path is outside this draft or has the wrong extension';
  end if;

  delete from private.draft_image_upload_grants
  where expires_at <= now()
     or used_at < now() - interval '1 day';

  insert into private.draft_image_upload_grants (
    id,
    post_id,
    object_path,
    token_hash,
    file_sha256,
    content_type,
    max_bytes,
    expires_at
  ) values (
    p_grant_id,
    p_post_id,
    p_object_path,
    p_token_hash,
    p_file_sha256,
    p_content_type,
    p_max_bytes,
    now() + interval '10 minutes'
  );

  return p_grant_id;
end;
$$;

revoke all on function private.issue_draft_image_upload_grant(
  uuid, uuid, text, text, text, text, bigint
) from public, anon, authenticated, service_role;

-- The Edge Function calls this after hashing and size-checking the request
-- body. The atomic UPDATE makes the capability single-use under concurrency.
create or replace function public.consume_draft_image_upload_grant(
  p_grant_id uuid,
  p_token_hash text,
  p_file_sha256 text,
  p_content_type text,
  p_content_length bigint
)
returns table (object_path text)
language sql
volatile
security definer
set search_path = ''
as $$
  update private.draft_image_upload_grants as grant_row
  set used_at = now()
  from public.posts as post_row
  where grant_row.id = p_grant_id
    and grant_row.post_id = post_row.id
    and post_row.published = false
    and grant_row.used_at is null
    and grant_row.expires_at > now()
    and grant_row.token_hash = p_token_hash
    and grant_row.file_sha256 = p_file_sha256
    and grant_row.content_type = p_content_type
    and p_content_length between 1 and grant_row.max_bytes
  returning grant_row.object_path;
$$;

revoke all on function public.consume_draft_image_upload_grant(
  uuid, text, text, text, bigint
) from public, anon, authenticated;
grant execute on function public.consume_draft_image_upload_grant(
  uuid, text, text, text, bigint
) to service_role;

notify pgrst, 'reload schema';
