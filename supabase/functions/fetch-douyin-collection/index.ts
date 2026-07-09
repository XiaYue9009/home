/**
 * Supabase Edge Function：按关键词拉取「我的收藏夹」中匹配的收藏夹视频。
 * 部署：supabase secrets set DOUYIN_COOKIE=... && supabase functions deploy fetch-douyin-collection
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const COLLECTS_LIST_URL = 'https://www.douyin.com/aweme/v1/web/collects/list/';
const COLLECTS_VIDEO_URL = 'https://www.douyin.com/aweme/v1/web/collects/video/list/';
const PROFILE_URL = 'https://www.douyin.com/aweme/v1/web/user/profile/self/';
const PAGE_SIZE = 20;
const DEFAULT_MAX = 60;
const DEFAULT_KEYWORDS = ['旅游', '美食'];

const COMMON_PARAMS = 'device_platform=webapp&aid=6383&channel=channel_pc_web&pc_client_type=1&version_code=190500&version_name=19.5.0';

function buildHeaders(cookie: string) {
  return {
    Accept: 'application/json, text/plain, */*',
    Cookie: cookie,
    Referer: 'https://www.douyin.com/',
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  };
}

function parseDouyinJson(text: string) {
  const safe = text.replace(
    /"(collects_id|aweme_id|cursor)"\s*:\s*(\d{16,})/g,
    '"$1":"$2"',
  );
  return JSON.parse(safe);
}

function pickCover(aweme: Record<string, unknown>) {
  const video = aweme?.video as Record<string, unknown> | undefined;
  const cover = video?.cover as { url_list?: string[] } | undefined;
  const origin = video?.origin_cover as { url_list?: string[] } | undefined;
  return cover?.url_list?.[0] || origin?.url_list?.[0] || '';
}

function normalizeVideo(aweme: Record<string, unknown>) {
  const id = String(aweme?.aweme_id || '');
  const stats = aweme?.statistics as Record<string, number> | undefined;
  const share = aweme?.share_info as { share_url?: string } | undefined;
  const author = aweme?.author as { nickname?: string } | undefined;
  return {
    id,
    title: String(aweme?.desc || '无标题').replace(/\s+/g, ' ').trim(),
    cover: pickCover(aweme),
    author: author?.nickname || '',
    diggCount: stats?.digg_count ?? 0,
    playCount: stats?.play_count ?? 0,
    shareUrl: share?.share_url?.split('?')[0] || (id ? `https://www.douyin.com/video/${id}` : ''),
    createTime: aweme?.create_time
      ? new Date(Number(aweme.create_time) * 1000).toISOString()
      : null,
  };
}

function normalizeAccount(user: Record<string, unknown> | null, syncedAt: string) {
  const uniqueId = user?.unique_id || user?.short_id || '';
  const avatar168 = user?.avatar_168x168 as { url_list?: string[] } | undefined;
  const avatarThumb = user?.avatar_thumb as { url_list?: string[] } | undefined;
  return {
    nickname: user?.nickname || '',
    uniqueId: String(uniqueId),
    avatar: avatar168?.url_list?.[0] || avatarThumb?.url_list?.[0] || '',
    profileUrl: uniqueId ? `https://www.douyin.com/user/${uniqueId}` : 'https://www.douyin.com/',
    syncedAt,
  };
}

function normalizeCollectFolder(item: Record<string, unknown>) {
  return {
    id: String(item?.collects_id ?? ''),
    name: String(item?.collects_name || item?.name || '').trim(),
    total: (item?.total_number as number | undefined) ?? (item?.item_count as number | undefined) ?? 0,
  };
}

function parseKeywords(input: unknown): string[] {
  if (Array.isArray(input)) {
    const list = input.map((item) => String(item || '').trim()).filter(Boolean);
    return list.length ? list : [...DEFAULT_KEYWORDS];
  }
  const raw = String(input ?? '').trim();
  if (!raw) return [...DEFAULT_KEYWORDS];
  const list = raw.split(/[,，、|]/).map((item) => item.trim()).filter(Boolean);
  return list.length ? list : [...DEFAULT_KEYWORDS];
}

async function fetchJson(url: string, cookie: string, init: RequestInit = {}) {
  const res = await fetch(url, { ...init, headers: { ...buildHeaders(cookie), ...(init.headers || {}) } });
  if (!res.ok) throw new Error(`请求失败 (${res.status})`);
  const data = parseDouyinJson(await res.text());
  if (data?.status_code && data.status_code !== 0) {
    throw new Error(data?.status_msg || `接口错误 (${data.status_code})`);
  }
  return data;
}

async function fetchCollectFolders(cookie: string) {
  const folders: Array<{ id: string; name: string; total: number }> = [];
  let cursor = '0';
  let hasMore: unknown = 1;

  while (hasMore && folders.length < 200) {
    const data = await fetchJson(
      `${COLLECTS_LIST_URL}?${COMMON_PARAMS}&cursor=${encodeURIComponent(cursor)}&count=${PAGE_SIZE}`,
      cookie,
    );
    const list = data?.collects_list || [];
    for (const item of list) {
      const folder = normalizeCollectFolder(item);
      if (folder.id) folders.push(folder);
    }
    hasMore = data?.has_more;
    cursor = String(data?.cursor ?? 0);
    if (!list.length) break;
  }

  return folders;
}

function groupFoldersByKeywords(
  folders: Array<{ id: string; name: string; total: number }>,
  keywords: string[],
) {
  const used = new Set<string>();
  return keywords.map((keyword) => {
    const matched = [];
    for (const folder of folders) {
      if (used.has(folder.id)) continue;
      if (!folder.name.includes(keyword)) continue;
      used.add(folder.id);
      matched.push(folder);
    }
    return { keyword, label: keyword, folders: matched };
  });
}

async function fetchCollectFolderVideos(cookie: string, collectsId: string, maxVideos: number) {
  const videos = [];
  let cursor = '0';
  let hasMore: unknown = 1;

  while (hasMore && videos.length < maxVideos) {
    const count = Math.min(PAGE_SIZE, maxVideos - videos.length);
    const data = await fetchJson(
      `${COLLECTS_VIDEO_URL}?${COMMON_PARAMS}&cursor=${encodeURIComponent(cursor)}&count=${count}&collects_id=${encodeURIComponent(collectsId)}`,
      cookie,
    );

    for (const aweme of data?.aweme_list || []) {
      if (videos.length >= maxVideos) break;
      videos.push(normalizeVideo(aweme));
    }

    hasMore = data?.has_more;
    cursor = String(data?.cursor ?? 0);
    if (!(data?.aweme_list || []).length) break;
  }

  return videos;
}

async function mapPool<T, R>(items: T[], concurrency: number, mapper: (item: T, index: number) => Promise<R>) {
  const results = new Array<R>(items.length);
  let next = 0;

  async function worker() {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await mapper(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) || 1 }, () => worker()));
  return results;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const cookie = Deno.env.get('DOUYIN_COOKIE')?.trim();
    if (!cookie) {
      return new Response(JSON.stringify({ error: '未配置 DOUYIN_COOKIE' }), { status: 500 });
    }

    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const maxVideos = Number(body?.maxVideos) || DEFAULT_MAX;
    const keywords = parseKeywords(
      body?.keywords ?? body?.collectsName ?? Deno.env.get('DOUYIN_COLLECTS_KEYWORDS'),
    );
    const syncedAt = new Date().toISOString();

    const [profileData, allFolders] = await Promise.all([
      fetchJson(`${PROFILE_URL}?${COMMON_PARAMS}`, cookie),
      fetchCollectFolders(cookie),
    ]);

    const grouped = groupFoldersByKeywords(allFolders, keywords);
    const matchedCount = grouped.reduce((sum, g) => sum + g.folders.length, 0);
    if (!matchedCount) {
      const names = allFolders.map((f) => f.name).filter(Boolean);
      const hint = names.length ? `现有：${names.slice(0, 8).join('、')}` : '当前账号下暂无收藏夹';
      return new Response(
        JSON.stringify({ error: `未找到名称含「${keywords.join(' / ')}」的收藏夹。${hint}` }),
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const groups = [];
    for (const group of grouped) {
      const foldersWithVideos = await mapPool(group.folders, 3, async (folder) => {
        const videos = await fetchCollectFolderVideos(cookie, folder.id, maxVideos);
        return { ...folder, videos };
      });
      groups.push({
        keyword: group.keyword,
        label: group.label,
        folders: foldersWithVideos,
      });
    }

    const videos = groups.flatMap((g) => g.folders.flatMap((f) => f.videos));

    return new Response(
      JSON.stringify({
        account: normalizeAccount(profileData?.user || null, syncedAt),
        groups,
        videos,
      }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err?.message || '拉取失败' }), { status: 500 });
  }
});
