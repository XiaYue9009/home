-- Legacy blob table (fetch RPC fallback)
create table if not exists public.lol_matchups (
  hero_id text primary key,
  rows jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists lol_matchups_updated_at_idx on public.lol_matchups (updated_at desc);

alter table public.lol_matchups enable row level security;

drop policy if exists "lol_matchups anon all" on public.lol_matchups;
create policy "lol_matchups anon all"
  on public.lol_matchups
  for all
  to anon, authenticated
  using (true)
  with check (true);
