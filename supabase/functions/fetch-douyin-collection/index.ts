/**
 * Supabase Edge Function：在服务端携带 DOUYIN_COOKIE 拉取收藏视频。
 * 部署：supabase secrets set DOUYIN_COOKIE=... && supabase functions deploy fetch-douyin-collection
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const COLLECTION_URL = 'https://www.douyin.com/aweme/v1/web/aweme/listcollection/';
const PROFILE_URL = 'https://www.douyin.com/aweme/v1/web/user/profile/self/';
const PAGE_SIZE = 20;
const DEFAULT_MAX = 60;

const COMMON_PARAMS = 'device_platform=webapp&aid=6383&channel=channel_pc_web&pc_client_type=1&version_code=190500&version_name=19.5.0';

function buildHeaders(cookie: string) {
  return {
    Accept: 'application/json, text/plain, */*',
    'Content-Type': 'application/json',
    Cookie: cookie,
    Referer: 'https://www.douyin.com/',
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  };
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

async function fetchJson(url: string, cookie: string, init: RequestInit = {}) {
  const res = await fetch(url, { ...init, headers: { ...buildHeaders(cookie), ...(init.headers || {}) } });
  if (!res.ok) throw new Error(`请求失败 (${res.status})`);
  const data = await res.json();
  if (data?.status_code && data.status_code !== 0) {
    throw new Error(data?.status_msg || `接口错误 (${data.status_code})`);
  }
  return data;
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
    const syncedAt = new Date().toISOString();

    const profileData = await fetchJson(`${PROFILE_URL}?${COMMON_PARAMS}`, cookie);
    const videos = [];
    let cursor = 0;
    let hasMore = 1;

    while (hasMore && videos.length < maxVideos) {
      const count = Math.min(PAGE_SIZE, maxVideos - videos.length);
      const data = await fetchJson(`${COLLECTION_URL}?${COMMON_PARAMS}`, cookie, {
        method: 'POST',
        body: JSON.stringify({
          device_platform: 'webapp',
          aid: '6383',
          channel: 'channel_pc_web',
          pc_client_type: 1,
          version_code: '190500',
          version_name: '19.5.0',
          cursor,
          count,
        }),
      });

      for (const aweme of data?.aweme_list || []) {
        if (videos.length >= maxVideos) break;
        videos.push(normalizeVideo(aweme));
      }

      hasMore = data?.has_more;
      cursor = data?.cursor ?? 0;
      if (!(data?.aweme_list || []).length) break;
    }

    return new Response(
      JSON.stringify({
        account: normalizeAccount(profileData?.user || null, syncedAt),
        videos,
      }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err?.message || '拉取失败' }), { status: 500 });
  }
});
