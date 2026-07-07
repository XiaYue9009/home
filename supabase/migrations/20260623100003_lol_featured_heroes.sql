create table if not exists public.lol_featured_heroes (
  id text primary key default 'default',
  hero_ids jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.lol_featured_heroes enable row level security;

drop policy if exists "lol_featured_heroes anon all" on public.lol_featured_heroes;
create policy "lol_featured_heroes anon all"
  on public.lol_featured_heroes
  for all
  to anon, authenticated
  using (true)
  with check (true);
