alter table public.projects
  add column if not exists visible boolean not null default true;
