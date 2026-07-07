create or replace function public.fetch_lol_matchup_entries(body jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  p_hero_id text := nullif(trim(body->>'hero_id'), '');
  entry_rows jsonb;
  max_updated timestamptz;
  legacy_rows jsonb;
  legacy_updated timestamptz;
begin
  if p_hero_id is null then
    return jsonb_build_object('rows', '[]'::jsonb, 'updated_at', null, 'legacy', false);
  end if;

  select coalesce(jsonb_agg(to_jsonb(t) order by t.updated_at desc), '[]'::jsonb),
         max(t.updated_at)
  into entry_rows, max_updated
  from lol_matchup_entries t
  where t.hero_id = p_hero_id;

  if jsonb_array_length(entry_rows) > 0 then
    return jsonb_build_object(
      'rows', entry_rows,
      'updated_at', max_updated,
      'legacy', false
    );
  end if;

  select m.rows, m.updated_at
  into legacy_rows, legacy_updated
  from lol_matchups m
  where m.hero_id = p_hero_id;

  if legacy_rows is not null and jsonb_array_length(legacy_rows) > 0 then
    return jsonb_build_object(
      'rows', legacy_rows,
      'updated_at', legacy_updated,
      'legacy', true
    );
  end if;

  return jsonb_build_object('rows', '[]'::jsonb, 'updated_at', null, 'legacy', false);
end;
$$;

create or replace function public.sync_lol_matchup_entries(body jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  p_hero_id text := nullif(trim(body->>'hero_id'), '');
  p_rows jsonb := coalesce(body->'rows', '[]'::jsonb);
  v_updated_at timestamptz := now();
  row_item jsonb;
  keep_ids text[] := '{}';
begin
  if p_hero_id is null then
    raise exception 'hero_id required';
  end if;

  if jsonb_typeof(p_rows) <> 'array' then
    raise exception 'rows must be a json array';
  end if;

  if jsonb_array_length(p_rows) = 0 then
    delete from lol_matchup_entries where hero_id = p_hero_id;
    return jsonb_build_object('updated_at', v_updated_at);
  end if;

  for row_item in select value from jsonb_array_elements(p_rows) as t(value)
  loop
    keep_ids := array_append(keep_ids, row_item->>'id');

    insert into lol_matchup_entries (
      id,
      hero_id,
      enemy_id,
      difficulty,
      candidate_spell_ids,
      skill_ids,
      primary_rune_ids,
      secondary_rune_ids,
      item_ids,
      tips,
      updated_at
    ) values (
      row_item->>'id',
      p_hero_id,
      nullif(row_item->>'enemy_id', ''),
      coalesce(nullif(row_item->>'difficulty', ''), 'unknown'),
      coalesce(row_item->'candidate_spell_ids', '[]'::jsonb),
      coalesce(row_item->'skill_ids', '[]'::jsonb),
      coalesce(row_item->'primary_rune_ids', '[]'::jsonb),
      coalesce(row_item->'secondary_rune_ids', '[]'::jsonb),
      coalesce(row_item->'item_ids', '[]'::jsonb),
      coalesce(row_item->>'tips', ''),
      v_updated_at
    )
    on conflict (id) do update set
      hero_id = excluded.hero_id,
      enemy_id = excluded.enemy_id,
      difficulty = excluded.difficulty,
      candidate_spell_ids = excluded.candidate_spell_ids,
      skill_ids = excluded.skill_ids,
      primary_rune_ids = excluded.primary_rune_ids,
      secondary_rune_ids = excluded.secondary_rune_ids,
      item_ids = excluded.item_ids,
      tips = excluded.tips,
      updated_at = excluded.updated_at;
  end loop;

  delete from lol_matchup_entries
  where hero_id = p_hero_id
    and not (id = any (keep_ids));

  return jsonb_build_object('updated_at', v_updated_at);
end;
$$;

revoke all on function public.fetch_lol_matchup_entries(jsonb) from public;
revoke all on function public.sync_lol_matchup_entries(jsonb) from public;
grant execute on function public.fetch_lol_matchup_entries(jsonb) to anon, authenticated;
grant execute on function public.sync_lol_matchup_entries(jsonb) to anon, authenticated;
