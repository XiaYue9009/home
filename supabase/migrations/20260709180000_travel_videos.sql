-- 旅行页：抖音收藏视频持久化 + 地理信息 + 增量同步

create table if not exists public.travel_videos (
  id text primary key,
  title text not null default '',
  cover text not null default '',
  author text not null default '',
  share_url text not null default '',
  digg_count integer not null default 0,
  play_count integer not null default 0,
  create_time timestamptz,
  folder_id text not null default '',
  folder_name text not null default '',
  category text not null default '',
  province text not null default '',
  city text not null default '',
  district text not null default '',
  place_name text not null default '',
  geo_label text not null default '',
  poi_name text not null default '',
  topics jsonb not null default '[]'::jsonb,
  synced_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists travel_videos_category_idx on public.travel_videos (category);
create index if not exists travel_videos_folder_idx on public.travel_videos (folder_id);
create index if not exists travel_videos_province_idx on public.travel_videos (province);
create index if not exists travel_videos_city_idx on public.travel_videos (city);
create index if not exists travel_videos_place_idx on public.travel_videos (place_name);
create index if not exists travel_videos_synced_at_idx on public.travel_videos (synced_at desc);

alter table public.travel_videos enable row level security;

drop policy if exists "travel_videos anon all" on public.travel_videos;
create policy "travel_videos anon all"
  on public.travel_videos
  for all
  to anon, authenticated
  using (true)
  with check (true);

create table if not exists public.travel_sync_meta (
  id text primary key default 'default',
  account jsonb not null default '{}'::jsonb,
  last_douyin_sync_at timestamptz,
  last_auto_sync_date date,
  last_sync_type text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.travel_sync_meta enable row level security;

drop policy if exists "travel_sync_meta anon all" on public.travel_sync_meta;
create policy "travel_sync_meta anon all"
  on public.travel_sync_meta
  for all
  to anon, authenticated
  using (true)
  with check (true);

insert into public.travel_sync_meta (id)
values ('default')
on conflict (id) do nothing;

create or replace function public.fetch_travel_videos(body jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  p_category text := nullif(trim(coalesce(body->>'category', '')), '');
  p_province text := nullif(trim(coalesce(body->>'province', '')), '');
  p_city text := nullif(trim(coalesce(body->>'city', '')), '');
  p_district text := nullif(trim(coalesce(body->>'district', '')), '');
  p_place text := nullif(trim(coalesce(body->>'place_name', '')), '');
  p_videos jsonb;
  p_updated_at timestamptz;
begin
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', v.id,
        'title', v.title,
        'cover', v.cover,
        'author', v.author,
        'share_url', v.share_url,
        'digg_count', v.digg_count,
        'play_count', v.play_count,
        'create_time', v.create_time,
        'folder_id', v.folder_id,
        'folder_name', v.folder_name,
        'category', v.category,
        'province', v.province,
        'city', v.city,
        'district', v.district,
        'place_name', v.place_name,
        'geo_label', v.geo_label,
        'poi_name', v.poi_name,
        'topics', coalesce(v.topics, '[]'::jsonb),
        'synced_at', v.synced_at,
        'created_at', v.created_at
      )
      order by v.create_time desc nulls last, v.synced_at desc
    ),
    '[]'::jsonb
  ), max(v.synced_at)
  into p_videos, p_updated_at
  from public.travel_videos v
  where (p_category is null or v.category = p_category)
    and (p_province is null or v.province = p_province)
    and (p_city is null or v.city = p_city)
    and (p_district is null or v.district = p_district)
    and (p_place is null or v.place_name = p_place);

  return jsonb_build_object(
    'videos', coalesce(p_videos, '[]'::jsonb),
    'updated_at', p_updated_at
  );
end;
$$;

create or replace function public.append_travel_videos(body jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  p_videos jsonb := coalesce(body->'videos', '[]'::jsonb);
  p_account jsonb := coalesce(body->'account', '{}'::jsonb);
  p_sync_type text := coalesce(nullif(trim(body->>'sync_type', ''), ''), 'manual');
  p_auto_sync_date date := nullif(trim(body->>'auto_sync_date', ''), '')::date;
  v_item jsonb;
  v_inserted integer := 0;
  v_skipped integer := 0;
  v_now timestamptz := now();
begin
  if jsonb_typeof(p_videos) <> 'array' then
    raise exception 'videos must be a json array';
  end if;

  for v_item in select value from jsonb_array_elements(p_videos)
  loop
    if coalesce(nullif(trim(v_item->>'id'), ''), '') = '' then
      v_skipped := v_skipped + 1;
      continue;
    end if;

    insert into public.travel_videos (
      id, title, cover, author, share_url,
      digg_count, play_count, create_time,
      folder_id, folder_name, category,
      province, city, district, place_name, geo_label,
      poi_name, topics, synced_at
    ) values (
      trim(v_item->>'id'),
      coalesce(v_item->>'title', ''),
      coalesce(v_item->>'cover', ''),
      coalesce(v_item->>'author', ''),
      coalesce(v_item->>'share_url', ''),
      coalesce((v_item->>'digg_count')::integer, 0),
      coalesce((v_item->>'play_count')::integer, 0),
      nullif(v_item->>'create_time', '')::timestamptz,
      coalesce(v_item->>'folder_id', ''),
      coalesce(v_item->>'folder_name', ''),
      coalesce(v_item->>'category', ''),
      coalesce(v_item->>'province', ''),
      coalesce(v_item->>'city', ''),
      coalesce(v_item->>'district', ''),
      coalesce(v_item->>'place_name', ''),
      coalesce(v_item->>'geo_label', ''),
      coalesce(v_item->>'poi_name', ''),
      coalesce(v_item->'topics', '[]'::jsonb),
      v_now
    )
    on conflict (id) do nothing;

    if found then
      v_inserted := v_inserted + 1;
    else
      v_skipped := v_skipped + 1;
    end if;
  end loop;

  insert into public.travel_sync_meta (id, account, last_douyin_sync_at, last_auto_sync_date, last_sync_type, updated_at)
  values (
    'default',
    p_account,
    v_now,
    case when p_sync_type = 'scheduled' then coalesce(p_auto_sync_date, current_date) else null end,
    p_sync_type,
    v_now
  )
  on conflict (id) do update set
    account = case when p_account <> '{}'::jsonb then excluded.account else travel_sync_meta.account end,
    last_douyin_sync_at = v_now,
    last_auto_sync_date = case
      when p_sync_type = 'scheduled' then coalesce(p_auto_sync_date, current_date)
      else travel_sync_meta.last_auto_sync_date
    end,
    last_sync_type = excluded.last_sync_type,
    updated_at = v_now;

  return jsonb_build_object(
    'inserted', v_inserted,
    'skipped', v_skipped,
    'total', (select count(*) from public.travel_videos),
    'updated_at', v_now
  );
end;
$$;

create or replace function public.fetch_travel_sync_meta(body jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  p_row public.travel_sync_meta%rowtype;
begin
  select * into p_row from public.travel_sync_meta where id = 'default';

  if not found then
    return jsonb_build_object(
      'account', '{}'::jsonb,
      'last_douyin_sync_at', null,
      'last_auto_sync_date', null,
      'last_sync_type', '',
      'updated_at', null
    );
  end if;

  return jsonb_build_object(
    'account', coalesce(p_row.account, '{}'::jsonb),
    'last_douyin_sync_at', p_row.last_douyin_sync_at,
    'last_auto_sync_date', p_row.last_auto_sync_date,
    'last_sync_type', p_row.last_sync_type,
    'updated_at', p_row.updated_at
  );
end;
$$;

revoke all on function public.fetch_travel_videos(jsonb) from public;
revoke all on function public.append_travel_videos(jsonb) from public;
revoke all on function public.fetch_travel_sync_meta(jsonb) from public;
grant execute on function public.fetch_travel_videos(jsonb) to anon, authenticated;
grant execute on function public.append_travel_videos(jsonb) to anon, authenticated;
grant execute on function public.fetch_travel_sync_meta(jsonb) to anon, authenticated;
