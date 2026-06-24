-- MoonHome · LOL 对线笔记云端表
-- 在 Supabase SQL Editor 中执行此脚本

create table if not exists public.lol_matchups (
  hero_id text primary key,
  rows jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists lol_matchups_updated_at_idx on public.lol_matchups (updated_at desc);

alter table public.lol_matchups enable row level security;

-- 个人站点：允许匿名读写（anon key 会打包进前端，请勿存放敏感数据）
drop policy if exists "lol_matchups anon all" on public.lol_matchups;
create policy "lol_matchups anon all"
  on public.lol_matchups
  for all
  to anon, authenticated
  using (true)
  with check (true);
