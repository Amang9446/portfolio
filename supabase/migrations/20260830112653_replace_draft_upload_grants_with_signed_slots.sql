-- Replace the custom public Edge Function capability system with Supabase
-- Storage's native signed upload URLs. Only an authenticated admin can issue a
-- slot because the existing storage.objects INSERT policy calls is_admin().

drop function if exists public.consume_draft_image_upload_grant(
  uuid,
  text,
  text,
  text,
  bigint
);

drop function if exists private.issue_draft_image_upload_grant(
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  bigint
);

drop table if exists private.draft_image_upload_grants;

-- Signed slots bind the destination path and forbid overwrite. Bucket limits
-- provide the server-side payload guard even if a temporary URL is mishandled.
update storage.buckets
set
  file_size_limit = 10485760,
  allowed_mime_types = array[
    'image/avif',
    'image/gif',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
where id = 'media';

notify pgrst, 'reload schema';
