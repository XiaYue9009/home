create table if not exists public.lol_matchup_entries (
  id text primary key,
  hero_id text not null,
  enemy_id text,
  difficulty text not null default 'unknown',
  candidate_spell_ids jsonb not null default '[]'::jsonb,
  skill_ids jsonb not null default '[]'::jsonb,
  primary_rune_ids jsonb not null default '[]'::jsonb,
  secondary_rune_ids jsonb not null default '[]'::jsonb,
  item_ids jsonb not null default '[]'::jsonb,
  tips text not null default '',
  updated_at timestamptz not null default now()
);

create index if not exists lol_matchup_entries_hero_id_idx
  on public.lol_matchup_entries (hero_id);

create index if not exists lol_matchup_entries_updated_at_idx
  on public.lol_matchup_entries (updated_at desc);

create unique index if not exists lol_matchup_entries_hero_enemy_uidx
  on public.lol_matchup_entries (hero_id, enemy_id)
  where enemy_id is not null;

alter table public.lol_matchup_entries enable row level security;

drop policy if exists "lol_matchup_entries anon all" on public.lol_matchup_entries;
create policy "lol_matchup_entries anon all"
  on public.lol_matchup_entries
  for all
  to anon, authenticated
  using (true)
  with check (true);
