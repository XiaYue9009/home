/**
 * 可选：从抖音增量同步到 Supabase（travel_videos）。
 * 用法：pnpm sync:douyin-collection
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DEFAULT_COLLECTS_FOLDERS,
  DEFAULT_MAX,
  groupFoldersByKeywords,
  normalizeAccount,
  normalizeCollectFolder,
  normalizeVideo,
  parseCollectsFolderNames,
  parseDouyinJson,
  PAGE_SIZE,
} from '../src/lib/travel/douyin-collection.js';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const ENV_FILE = join(ROOT, '.env');

const COLLECTS_LIST_URL = 'https://www.douyin.com/aweme/v1/web/collects/list/';
const COLLECTS_VIDEO_URL = 'https://www.douyin.com/aweme/v1/web/collects/video/list/';
const PROFILE_URL = 'https://www.douyin.com/aweme/v1/web/user/profile/self/';

const COMMON_PARAMS = new URLSearchParams({
  device_platform: 'webapp',
  aid: '6383',
  channel: 'channel_pc_web',
  pc_client_type: '1',
  version_code: '190500',
  version_name: '19.5.0',
});

function loadEnvFile() {
  try {
    const text = readFileSync(ENV_FILE, 'utf8');
    for (const line of text.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {
    // .env 可选
  }
}

function requireCookie() {
  let cookie = process.env.DOUYIN_COOKIE?.trim();
  if (!cookie) throw new Error('未配置 DOUYIN_COOKIE');
  if (
    (cookie.startsWith("'") && cookie.endsWith("'")) ||
    (cookie.startsWith('"') && cookie.endsWith('"'))
  ) {
    cookie = cookie.slice(1, -1);
  }
  return cookie;
}

function buildHeaders(cookie) {
  return {
    Accept: 'application/json, text/plain, */*',
    Cookie: cookie,
    Referer: 'https://www.douyin.com/',
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  };
}

async function fetchJson(url, cookie) {
  const res = await fetch(url, { headers: buildHeaders(cookie) });
  if (!res.ok) throw new Error(`请求失败 (${res.status})`);
  const data = parseDouyinJson(await res.text());
  if (data?.status_code && data.status_code !== 0) {
    throw new Error(data?.status_msg || `接口错误 status_code=${data.status_code}`);
  }
  return data;
}

async function fetchCollectFolders(cookie) {
  const folders = [];
  let cursor = '0';
  let hasMore = 1;
  while (hasMore && folders.length < 200) {
    const params = new URLSearchParams(COMMON_PARAMS);
    params.set('cursor', cursor);
    params.set('count', String(PAGE_SIZE));
    const data = await fetchJson(`${COLLECTS_LIST_URL}?${params}`, cookie);
    for (const item of data?.collects_list || []) {
      const folder = normalizeCollectFolder(item);
      if (folder.id) folders.push(folder);
    }
    hasMore = data?.has_more;
    cursor = String(data?.cursor ?? 0);
    if (!(data?.collects_list || []).length) break;
  }
  return folders;
}

async function fetchCollectFolderVideos(cookie, folder, maxVideos) {
  const videos = [];
  let cursor = '0';
  let hasMore = 1;
  while (hasMore && videos.length < maxVideos) {
    const count = Math.min(PAGE_SIZE, maxVideos - videos.length);
    const params = new URLSearchParams(COMMON_PARAMS);
    params.set('cursor', cursor);
    params.set('count', String(count));
    params.set('collects_id', folder.id);
    const data = await fetchJson(`${COLLECTS_VIDEO_URL}?${params}`, cookie);
    for (const aweme of data?.aweme_list || []) {
      if (videos.length >= maxVideos) break;
      videos.push(
        normalizeVideo(aweme, {
          id: folder.id,
          name: folder.name,
          category: folder.category,
        }),
      );
    }
    hasMore = data?.has_more;
    cursor = String(data?.cursor ?? 0);
    if (!(data?.aweme_list || []).length) break;
  }
  return videos;
}

function videoToDbRow(video) {
  return {
    id: String(video.id || ''),
    title: video.title || '',
    cover: video.cover || '',
    author: video.author || '',
    share_url: video.shareUrl || '',
    digg_count: Number(video.diggCount) || 0,
    play_count: Number(video.playCount) || 0,
    create_time: video.createTime || null,
    folder_id: video.folderId || '',
    folder_name: video.folderName || '',
    category: video.category || '',
    province: video.province || '',
    city: video.city || '',
    district: video.district || '',
    place_name: video.placeName || '',
    geo_label: video.geoLabel || '',
    poi_name: video.poiName || '',
    topics: Array.isArray(video.topics) ? video.topics : [],
  };
}

async function appendVideosToSupabase(videos, account) {
  const url = process.env.PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) throw new Error('未配置 PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_ANON_KEY');

  const supabase = createClient(url, key);
  const { data, error } = await supabase.rpc('append_travel_videos', {
    body: {
      videos: videos.map(videoToDbRow),
      account,
      sync_type: 'manual',
    },
  });
  if (error) throw error;
  return data;
}

async function main() {
  loadEnvFile();
  const cookie = requireCookie();
  const maxVideos =
    Number(process.env.PUBLIC_DOUYIN_MAX_VIDEOS || process.env.DOUYIN_MAX_VIDEOS || DEFAULT_MAX) ||
    DEFAULT_MAX;
  const folderNames = parseCollectsFolderNames(
    process.env.PUBLIC_DOUYIN_COLLECTS_FOLDERS ||
      process.env.PUBLIC_DOUYIN_COLLECTS_KEYWORDS ||
      DEFAULT_COLLECTS_FOLDERS.join(','),
  );

  const profileData = await fetchJson(`${PROFILE_URL}?${COMMON_PARAMS}`, cookie);
  const account = normalizeAccount(profileData?.user || null, new Date().toISOString());
  const allFolders = await fetchCollectFolders(cookie);
  const grouped = groupFoldersByKeywords(allFolders, folderNames);
  const videos = [];

  for (const group of grouped) {
    for (const folder of group.folders) {
      console.log(`拉取「${folder.name}」…`);
      const list = await fetchCollectFolderVideos(cookie, { ...folder, category: group.keyword }, maxVideos);
      videos.push(...list);
    }
  }

  if (!videos.length) {
    throw new Error(`未从指定收藏夹拉取到视频：${folderNames.join(' / ')}`);
  }

  const result = await appendVideosToSupabase(videos, account);

  console.log(
    `增量写入完成：新增 ${result?.inserted ?? 0}，跳过 ${result?.skipped ?? 0}，库内 ${result?.total ?? 0}`,
  );
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
