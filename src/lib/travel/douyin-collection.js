/** 抖音网页版「收藏」视频（listcollection）拉取与归一化。 */

export const PAGE_SIZE = 20;
export const DEFAULT_MAX = 60;

const COLLECTION_PATH = '/aweme/v1/web/aweme/listcollection/';
const PROFILE_PATH = '/aweme/v1/web/user/profile/self/';

const COMMON_QUERY = {
  device_platform: 'webapp',
  aid: '6383',
  channel: 'channel_pc_web',
  pc_client_type: '1',
  version_code: '190500',
  version_name: '19.5.0',
};

const REQUEST_HEADERS = {
  Accept: 'application/json, text/plain, */*',
  Referer: 'https://www.douyin.com/',
};

export function pickCover(aweme) {
  const candidates = [
    aweme?.video?.cover?.url_list?.[0],
    aweme?.video?.origin_cover?.url_list?.[0],
    aweme?.video?.dynamic_cover?.url_list?.[0],
  ];
  return candidates.find(Boolean) || '';
}

export function normalizeVideo(aweme) {
  const id = String(aweme?.aweme_id || '');
  return {
    id,
    title: (aweme?.desc || '无标题').replace(/\s+/g, ' ').trim(),
    cover: pickCover(aweme),
    author: aweme?.author?.nickname || '',
    diggCount: aweme?.statistics?.digg_count ?? 0,
    playCount: aweme?.statistics?.play_count ?? 0,
    shareUrl:
      aweme?.share_info?.share_url?.split('?')[0] ||
      (id ? `https://www.douyin.com/video/${id}` : ''),
    createTime: aweme?.create_time
      ? new Date(aweme.create_time * 1000).toISOString()
      : null,
  };
}

export function normalizeAccount(user, syncedAt = new Date().toISOString()) {
  const uniqueId = user?.unique_id || user?.short_id || '';
  return {
    nickname: user?.nickname || '',
    uniqueId: String(uniqueId),
    avatar: user?.avatar_168x168?.url_list?.[0] || user?.avatar_thumb?.url_list?.[0] || '',
    profileUrl: uniqueId ? `https://www.douyin.com/user/${uniqueId}` : 'https://www.douyin.com/',
    syncedAt,
  };
}

export function buildPostBody(cursor, count) {
  return {
    device_platform: 'webapp',
    aid: '6383',
    channel: 'channel_pc_web',
    pc_client_type: 1,
    version_code: '190500',
    version_name: '19.5.0',
    cursor,
    count,
  };
}

/** 开发环境走 Vite 代理；生产可配置 PUBLIC_DOUYIN_API_BASE 指向自建代理。 */
export function getDouyinApiBase() {
  if (import.meta.env.DEV) return '/api/douyin';
  const base = import.meta.env.PUBLIC_DOUYIN_API_BASE?.trim();
  return base ? base.replace(/\/$/, '') : '';
}

function buildUrl(path, query = {}) {
  const base = getDouyinApiBase();
  if (!base) return null;
  const params = new URLSearchParams({ ...COMMON_QUERY, ...query });
  return `${base}${path}?${params.toString()}`;
}

async function fetchDouyinJson(url, options = {}) {
  const res = await fetch(url, {
    headers: {
      ...REQUEST_HEADERS,
      ...(options.method === 'POST' ? { 'Content-Type': 'application/json' } : {}),
    },
    ...options,
  });
  if (!res.ok) throw new Error(`抖音接口请求失败 (${res.status})`);
  const data = await res.json();
  if (data?.status_code && data.status_code !== 0) {
    throw new Error(data?.status_msg || `抖音接口错误 (${data.status_code})`);
  }
  return data;
}

async function fetchProfile() {
  const url = buildUrl(PROFILE_PATH);
  if (!url) throw new Error('未配置抖音 API 代理');
  const data = await fetchDouyinJson(url);
  return data?.user || null;
}

async function fetchAllCollections(maxVideos = DEFAULT_MAX) {
  const videos = [];
  let cursor = 0;
  let hasMore = 1;

  while (hasMore && videos.length < maxVideos) {
    const url = buildUrl(COLLECTION_PATH);
    if (!url) throw new Error('未配置抖音 API 代理');

    const count = Math.min(PAGE_SIZE, maxVideos - videos.length);
    const data = await fetchDouyinJson(url, {
      method: 'POST',
      body: JSON.stringify(buildPostBody(cursor, count)),
    });
    const list = data?.aweme_list || [];

    for (const aweme of list) {
      if (videos.length >= maxVideos) break;
      videos.push(normalizeVideo(aweme));
    }

    hasMore = data?.has_more;
    cursor = data?.cursor ?? 0;
    if (!list.length) break;
  }

  return videos;
}

/** 通过浏览器可用的代理拉取收藏视频。 */
export async function fetchDouyinCollection(maxVideos = DEFAULT_MAX) {
  const max = Number(maxVideos) || DEFAULT_MAX;
  const syncedAt = new Date().toISOString();
  const [profile, videos] = await Promise.all([
    fetchProfile(),
    fetchAllCollections(max),
  ]);

  return {
    account: normalizeAccount(profile, syncedAt),
    videos,
    source: 'live',
  };
}

export function canFetchDouyinInBrowser() {
  return !!getDouyinApiBase();
}
