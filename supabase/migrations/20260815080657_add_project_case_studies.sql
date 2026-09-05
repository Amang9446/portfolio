-- Long-form case-study fields for projects, plus a URL slug.
--
-- NOTE: `slug` ends up NOT NULL with no default, so every INSERT into
-- public.projects must supply one. src/app/admin/actions.ts derives it from
-- the title in saveProject().
alter table public.projects
  add column if not exists slug text,
  add column if not exists role text not null default '',
  add column if not exists problem text not null default '',
  add column if not exists architecture text not null default '',
  add column if not exists challenges text not null default '',
  add column if not exists results text not null default '',
  add column if not exists media jsonb not null default '[]'::jsonb;

-- Backfill slugs for existing rows before the NOT NULL constraint lands.
update public.projects
set slug = coalesce(
  nullif(
    trim(both '-' from lower(
      regexp_replace(
        regexp_replace(title, '[^a-zA-Z0-9\s-]', '', 'g'),
        '\s+',
        '-',
        'g'
      )
    )),
    ''
  ),
  'project-' || left(id::text, 8)
)
where slug is null or btrim(slug) = '';

-- Two projects can share a title; de-duplicate before the unique index.
with ranked as (
  select
    id,
    slug,
    row_number() over (partition by slug order by created_at, id) as n
  from public.projects
)
update public.projects p
set slug = ranked.slug || '-' || ranked.n
from ranked
where p.id = ranked.id
  and ranked.n > 1;

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
