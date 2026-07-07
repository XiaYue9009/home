create table if not exists public.upcoming_cards (
  id text primary key default 'default',
  cards jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.upcoming_cards enable row level security;

drop policy if exists "upcoming_cards anon all" on public.upcoming_cards;
create policy "upcoming_cards anon all"
  on public.upcoming_cards
  for all
  to anon, authenticated
  using (true)
  with check (true);

create or replace function public.fetch_upcoming_cards(body jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  p_cards jsonb;
  p_updated_at timestamptz;
begin
  select cards, updated_at
  into p_cards, p_updated_at
  from upcoming_cards
  where id = 'default';

  if p_cards is null then
    return jsonb_build_object('cards', '[]'::jsonb, 'updated_at', null);
  end if;

  return jsonb_build_object(
    'cards', coalesce(p_cards, '[]'::jsonb),
    'updated_at', p_updated_at
  );
end;
$$;

create or replace function public.sync_upcoming_cards(body jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  p_cards jsonb := coalesce(body->'cards', '[]'::jsonb);
  v_updated_at timestamptz := now();
begin
  if jsonb_typeof(p_cards) <> 'array' then
    raise exception 'cards must be a json array';
  end if;

  insert into upcoming_cards (id, cards, updated_at)
  values ('default', p_cards, v_updated_at)
  on conflict (id) do update set
    cards = excluded.cards,
    updated_at = excluded.updated_at;

  return jsonb_build_object('updated_at', v_updated_at);
end;
$$;

revoke all on function public.fetch_upcoming_cards(jsonb) from public;
revoke all on function public.sync_upcoming_cards(jsonb) from public;
grant execute on function public.fetch_upcoming_cards(jsonb) to anon, authenticated;
grant execute on function public.sync_upcoming_cards(jsonb) to anon, authenticated;

insert into storage.buckets (id, name, public)
values ('upcoming-images', 'upcoming-images', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "upcoming_images public read" on storage.objects;
create policy "upcoming_images public read"
  on storage.objects
  for select
  to public
  using (bucket_id = 'upcoming-images');

drop policy if exists "upcoming_images anon upload" on storage.objects;
create policy "upcoming_images anon upload"
  on storage.objects
  for insert
  to anon, authenticated
  with check (bucket_id = 'upcoming-images');
