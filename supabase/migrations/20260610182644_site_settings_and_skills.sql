-- Singleton site content (hero, contact, metadata) as JSON per section.
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
create policy "Admins can write site settings"
  on public.site_settings for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Public can read skills" on public.skills;
create policy "Public can read skills"
  on public.skills for select
  using (true);

drop policy if exists "Admins can write skills" on public.skills;
create policy "Admins can write skills"
  on public.skills for all
  using (public.is_admin())
  with check (public.is_admin());

-- Placeholder seed so a fresh install has coherent content to render.
-- Edit it in the admin dashboard (Site) once you are signed in; `on conflict
-- do nothing` means re-running this never overwrites what you have saved.
insert into public.site_settings (key, value) values
(
  'hero',
  '{
    "name": "Your Name",
    "title": "Software Engineer",
    "subtitle": "Mobile · Open Source",
    "description": "I build mobile and web applications, and contribute to open source along the way.",
    "image": ""
  }'::jsonb
),
(
  'contact',
  '{
    "email": "you@example.com",
    "availability": "Available",
    "responseTime": "Usually responds within 24 hours",
    "socialLinks": [
      {"name": "GitHub", "url": "https://github.com/you", "icon": "github"},
      {"name": "LinkedIn", "url": "https://linkedin.com/in/you", "icon": "linkedin"},
      {"name": "X", "url": "https://x.com/you", "icon": "x"}
    ]
  }'::jsonb
),
(
  'metadata',
  '{
    "title": "Your Name | Software Engineer",
    "description": "Software engineer building mobile and web applications.",
    "author": "Your Name",
    "keywords": ["Software Engineer", "TypeScript", "React", "Next.js", "Portfolio"],
    "twitterHandle": ""
  }'::jsonb
)
on conflict (key) do nothing;

insert into public.skills (name, category, sort_order)
select * from (values
  ('TypeScript', 'tech', 0),
  ('React', 'tech', 1),
  ('Next.js', 'tech', 2),
  ('Node.js', 'tech', 3),
  ('Postgres', 'tech', 4),
  ('Git', 'tools', 0),
  ('Docker', 'tools', 1),
  ('Figma', 'tools', 2)
) as v(name, category, sort_order)
where not exists (select 1 from public.skills);
