/** 抖音网页版「我的收藏夹」按关键词拉取与归一化。 */

export const PAGE_SIZE = 20;
export const DEFAULT_MAX = 60;
/** 旅行页默认展示的收藏夹名称关键词（名称包含即匹配）。 */
export const DEFAULT_COLLECTS_KEYWORDS = ['旅游', '美食'];

const COLLECTS_LIST_PATH = '/aweme/v1/web/collects/list/';
const COLLECTS_VIDEO_PATH = '/aweme/v1/web/collects/video/list/';
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

/** 抖音 ID 常超过 Number.MAX_SAFE_INTEGER，解析前转为字符串。 */
export function parseDouyinJson(text) {
  const safe = String(text).replace(
    /"(collects_id|aweme_id|cursor)"\s*:\s*(\d{16,})/g,
    '"$1":"$2"',
  );
  return JSON.parse(safe);
}

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

export function normalizeCollectFolder(item) {
  return {
    id: String(item?.collects_id ?? ''),
    name: String(item?.collects_name || item?.name || '').trim(),
    total: item?.total_number ?? item?.item_count ?? 0,
  };
}

function readPublicEnv(key) {
  try {
    return import.meta.env?.[key];
  } catch {
    return undefined;
  }
}

/** 开发环境走 Vite 代理；生产可配置 PUBLIC_DOUYIN_API_BASE 指向自建代理。 */
export function getDouyinApiBase() {
  if (readPublicEnv('DEV')) return '/api/douyin';
  const base = String(readPublicEnv('PUBLIC_DOUYIN_API_BASE') || '').trim();
  return base ? base.replace(/\/$/, '') : '';
}

/** 解析关键词列表：支持逗号/顿号分隔。 */
export function parseCollectsKeywords(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return [...DEFAULT_COLLECTS_KEYWORDS];
  const list = raw
    .split(/[,，、|]/)
    .map((item) => item.trim())
    .filter(Boolean);
  return list.length ? list : [...DEFAULT_COLLECTS_KEYWORDS];
}

export function getTargetCollectsKeywords() {
  return parseCollectsKeywords(readPublicEnv('PUBLIC_DOUYIN_COLLECTS_KEYWORDS'));
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
  const data = parseDouyinJson(await res.text());
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

/** 分页拉取「我的收藏夹」下全部收藏夹。 */
export async function fetchCollectFolders(fetchJson = fetchDouyinJson, buildListUrl = buildUrl) {
  const folders = [];
  let cursor = '0';
  let hasMore = 1;

  while (hasMore && folders.length < 200) {
    const url = buildListUrl(COLLECTS_LIST_PATH, { cursor, count: String(PAGE_SIZE) });
    if (!url) throw new Error('未配置抖音 API 代理');

    const data = await fetchJson(url);
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

/** 名称包含关键词的收藏夹（按关键词分组，同一夹只归入首次命中的关键词）。 */
export function groupFoldersByKeywords(folders, keywords = DEFAULT_COLLECTS_KEYWORDS) {
  const keys = (keywords?.length ? keywords : DEFAULT_COLLECTS_KEYWORDS).map((k) => String(k).trim()).filter(Boolean);
  const used = new Set();

  return keys.map((keyword) => {
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

/** 拉取指定收藏夹内的视频。 */
export async function fetchCollectFolderVideos(
  collectsId,
  maxVideos = DEFAULT_MAX,
  fetchJson = fetchDouyinJson,
  buildVideoUrl = buildUrl,
) {
  const videos = [];
  let cursor = '0';
  let hasMore = 1;
  const max = Number(maxVideos) || DEFAULT_MAX;

  while (hasMore && videos.length < max) {
    const count = Math.min(PAGE_SIZE, max - videos.length);
    const url = buildVideoUrl(COLLECTS_VIDEO_PATH, {
      cursor,
      count: String(count),
      collects_id: String(collectsId),
    });
    if (!url) throw new Error('未配置抖音 API 代理');

    const data = await fetchJson(url);
    const list = data?.aweme_list || [];

    for (const aweme of list) {
      if (videos.length >= max) break;
      videos.push(normalizeVideo(aweme));
    }

    hasMore = data?.has_more;
    cursor = String(data?.cursor ?? 0);
    if (!list.length) break;
  }

  return videos;
}

async function mapPool(items, concurrency, mapper) {
  const results = new Array(items.length);
  let next = 0;

  async function worker() {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await mapper(items[index], index);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) || 1 }, () => worker());
  await Promise.all(workers);
  return results;
}

/**
 * 通过浏览器可用的代理，按关键词拉取「我的收藏夹」中匹配的收藏夹视频。
 * 默认关键词：旅游、美食；可用 PUBLIC_DOUYIN_COLLECTS_KEYWORDS 覆盖。
 */
export async function fetchDouyinCollection(
  maxVideos = DEFAULT_MAX,
  keywords = getTargetCollectsKeywords(),
) {
  const max = Number(maxVideos) || DEFAULT_MAX;
  const syncedAt = new Date().toISOString();
  const keywordList = parseCollectsKeywords(
    Array.isArray(keywords) ? keywords.join(',') : keywords,
  );

  const [profile, allFolders] = await Promise.all([fetchProfile(), fetchCollectFolders()]);
  const grouped = groupFoldersByKeywords(allFolders, keywordList);
  const matchedCount = grouped.reduce((sum, g) => sum + g.folders.length, 0);

  if (!matchedCount) {
    const names = allFolders.map((f) => f.name).filter(Boolean);
    const hint = names.length ? `现有：${names.slice(0, 8).join('、')}` : '当前账号下暂无收藏夹';
    throw new Error(`未找到名称含「${keywordList.join(' / ')}」的收藏夹。${hint}`);
  }

  const groups = [];
  for (const group of grouped) {
    const foldersWithVideos = await mapPool(group.folders, 3, async (folder) => {
      const videos = await fetchCollectFolderVideos(folder.id, max);
      return { ...folder, videos };
    });
    groups.push({
      keyword: group.keyword,
      label: group.label,
      folders: foldersWithVideos,
    });
  }

  const videos = groups.flatMap((g) => g.folders.flatMap((f) => f.videos));

  return {
    account: normalizeAccount(profile, syncedAt),
    groups,
    videos,
    source: 'live',
  };
}

export function canFetchDouyinInBrowser() {
  return !!getDouyinApiBase();
}
