-- 将全量 sync_upcoming_cards 拆成按操作粒度的 RPC，避免卡片多时每次传整表。
-- 仍复用 upcoming_cards.cards jsonb 文档存储；fetch / sync（全量引导）保留。

create or replace function public._upcoming_cards_read()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  p_cards jsonb;
begin
  select cards into p_cards from upcoming_cards where id = 'default';
  return coalesce(p_cards, '[]'::jsonb);
end;
$$;

create or replace function public._upcoming_cards_write(p_cards jsonb)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
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

  return v_updated_at;
end;
$$;

-- 新建 / 更新单张卡片（按 id upsert；可选 ids 同步顺序）
create or replace function public.upsert_upcoming_card(body jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  p_card jsonb := body->'card';
  p_ids jsonb := body->'ids';
  p_id text;
  p_cards jsonb;
  v_idx int;
  v_map jsonb := '{}'::jsonb;
  v_next jsonb := '[]'::jsonb;
  v_id text;
  v_seen text[] := '{}';
  v_existing jsonb;
  v_updated_at timestamptz;
begin
  if p_card is null or jsonb_typeof(p_card) <> 'object' then
    raise exception 'card must be a json object';
  end if;

  p_id := nullif(trim(coalesce(p_card->>'id', '')), '');
  if p_id is null then
    raise exception 'card.id is required';
  end if;

  p_card := jsonb_build_object(
    'id', p_id,
    'title', coalesce(p_card->>'title', '未命名'),
    'content', coalesce(p_card->>'content', ''),
    'pinned', coalesce((p_card->>'pinned')::boolean, false)
      and not coalesce((p_card->>'done')::boolean, false),
    'done', coalesce((p_card->>'done')::boolean, false),
    'updated_at', coalesce(p_card->>'updated_at', p_card->>'updatedAt', now()::text)
  );

  p_cards := public._upcoming_cards_read();

  if p_ids is not null and jsonb_typeof(p_ids) = 'array' then
    for v_existing in select elem from jsonb_array_elements(p_cards) as elem
    loop
      v_map := v_map || jsonb_build_object(v_existing->>'id', v_existing);
    end loop;
    v_map := v_map || jsonb_build_object(p_id, p_card);

    for v_id in
      select nullif(trim(value #>> '{}'), '')
      from jsonb_array_elements(p_ids) as t(value)
    loop
      if v_id is null or v_id = any (v_seen) then
        continue;
      end if;
      v_existing := v_map -> v_id;
      if v_existing is null then
        continue;
      end if;
      if v_id = p_id then
        v_existing := p_card;
      end if;
      v_next := v_next || jsonb_build_array(v_existing);
      v_seen := array_append(v_seen, v_id);
    end loop;

    for v_existing in select elem from jsonb_array_elements(p_cards) as elem
    loop
      if not ((v_existing->>'id') = any (v_seen)) then
        if (v_existing->>'id') = p_id then
          v_next := v_next || jsonb_build_array(p_card);
        else
          v_next := v_next || jsonb_build_array(v_existing);
        end if;
        v_seen := array_append(v_seen, v_existing->>'id');
      end if;
    end loop;

    if not (p_id = any (v_seen)) then
      v_next := v_next || jsonb_build_array(p_card);
    end if;

    p_cards := v_next;
  else
    select ord - 1 into v_idx
    from jsonb_array_elements(p_cards) with ordinality as t(elem, ord)
    where elem->>'id' = p_id
    limit 1;

    if v_idx is null then
      p_cards := p_cards || jsonb_build_array(p_card);
    else
      p_cards := jsonb_set(p_cards, array[v_idx::text], p_card, false);
    end if;
  end if;

  v_updated_at := public._upcoming_cards_write(p_cards);
  return jsonb_build_object('updated_at', v_updated_at, 'card', p_card);
end;
$$;

-- 删除单张卡片
create or replace function public.delete_upcoming_card(body jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  p_id text := nullif(trim(coalesce(body->>'id', '')), '');
  p_cards jsonb;
  v_updated_at timestamptz;
begin
  if p_id is null then
    raise exception 'id is required';
  end if;

  p_cards := (
    select coalesce(jsonb_agg(elem), '[]'::jsonb)
    from jsonb_array_elements(public._upcoming_cards_read()) as elem
    where elem->>'id' <> p_id
  );

  v_updated_at := public._upcoming_cards_write(p_cards);
  return jsonb_build_object('updated_at', v_updated_at, 'id', p_id);
end;
$$;

-- 更新置顶 / 完成状态（不传正文；可选 ids 同步顺序）
create or replace function public.set_upcoming_card_flags(body jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  p_id text := nullif(trim(coalesce(body->>'id', '')), '');
  p_ids jsonb := body->'ids';
  p_cards jsonb;
  v_idx int;
  v_card jsonb;
  v_done boolean;
  v_pinned boolean;
  v_map jsonb := '{}'::jsonb;
  v_next jsonb := '[]'::jsonb;
  v_id text;
  v_seen text[] := '{}';
  v_existing jsonb;
  v_updated_at timestamptz;
begin
  if p_id is null then
    raise exception 'id is required';
  end if;

  p_cards := public._upcoming_cards_read();
  select ord - 1, elem into v_idx, v_card
  from jsonb_array_elements(p_cards) with ordinality as t(elem, ord)
  where elem->>'id' = p_id
  limit 1;

  if v_idx is null then
    raise exception 'card not found: %', p_id;
  end if;

  v_done := case
    when body ? 'done' then coalesce((body->>'done')::boolean, false)
    else coalesce((v_card->>'done')::boolean, false)
  end;
  v_pinned := case
    when body ? 'pinned' then coalesce((body->>'pinned')::boolean, false)
    else coalesce((v_card->>'pinned')::boolean, false)
  end;

  if v_done then
    v_pinned := false;
  end if;

  v_card := v_card
    || jsonb_build_object(
      'done', v_done,
      'pinned', v_pinned,
      'updated_at', coalesce(body->>'updated_at', body->>'updatedAt', now()::text)
    );

  if p_ids is not null and jsonb_typeof(p_ids) = 'array' then
    for v_existing in select elem from jsonb_array_elements(p_cards) as elem
    loop
      v_map := v_map || jsonb_build_object(v_existing->>'id', v_existing);
    end loop;
    v_map := v_map || jsonb_build_object(p_id, v_card);

    for v_id in
      select nullif(trim(value #>> '{}'), '')
      from jsonb_array_elements(p_ids) as t(value)
    loop
      if v_id is null or v_id = any (v_seen) then
        continue;
      end if;
      v_existing := v_map -> v_id;
      if v_existing is null then
        continue;
      end if;
      if v_id = p_id then
        v_existing := v_card;
      end if;
      v_next := v_next || jsonb_build_array(v_existing);
      v_seen := array_append(v_seen, v_id);
    end loop;

    for v_existing in select elem from jsonb_array_elements(p_cards) as elem
    loop
      if not ((v_existing->>'id') = any (v_seen)) then
        if (v_existing->>'id') = p_id then
          v_next := v_next || jsonb_build_array(v_card);
        else
          v_next := v_next || jsonb_build_array(v_existing);
        end if;
        v_seen := array_append(v_seen, v_existing->>'id');
      end if;
    end loop;

    p_cards := v_next;
  else
    p_cards := jsonb_set(p_cards, array[v_idx::text], v_card, false);
  end if;

  v_updated_at := public._upcoming_cards_write(p_cards);
  return jsonb_build_object('updated_at', v_updated_at, 'card', v_card);
end;
$$;

-- 仅同步顺序（传 id 列表，不传正文）
create or replace function public.reorder_upcoming_cards(body jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  p_ids jsonb := coalesce(body->'ids', '[]'::jsonb);
  p_cards jsonb;
  v_map jsonb := '{}'::jsonb;
  v_next jsonb := '[]'::jsonb;
  v_id text;
  v_card jsonb;
  v_seen text[] := '{}';
  v_updated_at timestamptz;
begin
  if jsonb_typeof(p_ids) <> 'array' then
    raise exception 'ids must be a json array';
  end if;

  p_cards := public._upcoming_cards_read();

  for v_card in select elem from jsonb_array_elements(p_cards) as elem
  loop
    v_map := v_map || jsonb_build_object(v_card->>'id', v_card);
  end loop;

  for v_id in
    select nullif(trim(value #>> '{}'), '')
    from jsonb_array_elements(p_ids) as t(value)
  loop
    if v_id is null then
      continue;
    end if;
    if v_id = any (v_seen) then
      continue;
    end if;
    v_card := v_map -> v_id;
    if v_card is null then
      continue;
    end if;
    v_next := v_next || jsonb_build_array(v_card);
    v_seen := array_append(v_seen, v_id);
  end loop;

  -- 未出现在 ids 中的卡片追加到末尾，避免误删
  for v_card in select elem from jsonb_array_elements(p_cards) as elem
  loop
    if not ((v_card->>'id') = any (v_seen)) then
      v_next := v_next || jsonb_build_array(v_card);
    end if;
  end loop;

  v_updated_at := public._upcoming_cards_write(v_next);
  return jsonb_build_object('updated_at', v_updated_at);
end;
$$;

revoke all on function public.upsert_upcoming_card(jsonb) from public;
revoke all on function public.delete_upcoming_card(jsonb) from public;
revoke all on function public.set_upcoming_card_flags(jsonb) from public;
revoke all on function public.reorder_upcoming_cards(jsonb) from public;

grant execute on function public.upsert_upcoming_card(jsonb) to anon, authenticated;
grant execute on function public.delete_upcoming_card(jsonb) to anon, authenticated;
grant execute on function public.set_upcoming_card_flags(jsonb) to anon, authenticated;
grant execute on function public.reorder_upcoming_cards(jsonb) to anon, authenticated;

-- 全量 sync 仅用于本地首次引导上传，保留兼容
comment on function public.sync_upcoming_cards(jsonb) is
  'Full replace of upcoming cards. Prefer upsert/delete/flags/reorder for incremental edits.';
