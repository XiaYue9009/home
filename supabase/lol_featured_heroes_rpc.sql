-- MoonHome · 我的英雄 RPC（客户端 POST + JSON body）
-- 依赖 lol_featured_heroes.sql；在 Supabase SQL Editor 中执行

create or replace function public.fetch_lol_featured_heroes(body jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  p_hero_ids jsonb;
  p_updated_at timestamptz;
begin
  select hero_ids, updated_at
  into p_hero_ids, p_updated_at
  from lol_featured_heroes
  where id = 'default';

  if p_hero_ids is null then
    return jsonb_build_object('hero_ids', '[]'::jsonb, 'updated_at', null);
  end if;

  return jsonb_build_object(
    'hero_ids', coalesce(p_hero_ids, '[]'::jsonb),
    'updated_at', p_updated_at
  );
end;
$$;

create or replace function public.sync_lol_featured_heroes(body jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  p_hero_ids jsonb := coalesce(body->'hero_ids', '[]'::jsonb);
  v_updated_at timestamptz := now();
begin
  if jsonb_typeof(p_hero_ids) <> 'array' then
    raise exception 'hero_ids must be a json array';
  end if;

  insert into lol_featured_heroes (id, hero_ids, updated_at)
  values ('default', p_hero_ids, v_updated_at)
  on conflict (id) do update set
    hero_ids = excluded.hero_ids,
    updated_at = excluded.updated_at;

  return jsonb_build_object('updated_at', v_updated_at);
end;
$$;

revoke all on function public.fetch_lol_featured_heroes(jsonb) from public;
revoke all on function public.sync_lol_featured_heroes(jsonb) from public;
grant execute on function public.fetch_lol_featured_heroes(jsonb) to anon, authenticated;
grant execute on function public.sync_lol_featured_heroes(jsonb) to anon, authenticated;
