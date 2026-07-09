/**
 * 可选：将抖音「旅游 / 美食」等关键词收藏夹写入本地缓存。
 * 日常开发请直接 pnpm dev，在 /travel 页面实时拉取。
 *
 * 用法：pnpm sync:douyin-collection
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DEFAULT_COLLECTS_KEYWORDS,
  DEFAULT_MAX,
  PAGE_SIZE,
  groupFoldersByKeywords,
  normalizeAccount,
  normalizeCollectFolder,
  normalizeVideo,
  parseCollectsKeywords,
  parseDouyinJson,
} from '../src/lib/travel/douyin-collection.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT_DIR = join(ROOT, 'src/data/travel');
const ENV_FILE = join(ROOT, '.env');
const SCRIPT_NAME = 'scripts/sync-douyin-collection.mjs';

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
  if (!cookie) {
    throw new Error('未配置 DOUYIN_COOKIE。请在 .env 中填入浏览器登录 douyin.com 后的 Cookie。');
  }
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

async function fetchJson(url, cookie, options = {}) {
  const res = await fetch(url, { headers: buildHeaders(cookie), ...options });
  if (!res.ok) throw new Error(`请求失败 (${res.status}) ${url}`);
  const data = parseDouyinJson(await res.text());
  if (data?.status_code && data.status_code !== 0) {
    throw new Error(data?.status_msg || `接口错误 status_code=${data.status_code}`);
  }
  return data;
}

async function fetchProfile(cookie) {
  const url = `${PROFILE_URL}?${COMMON_PARAMS.toString()}`;
  const data = await fetchJson(url, cookie);
  return data?.user || null;
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

async function fetchCollectFolderVideos(cookie, collectsId, maxVideos) {
  const videos = [];
  let cursor = '0';
  let hasMore = 1;

  while (hasMore && videos.length < maxVideos) {
    const count = Math.min(PAGE_SIZE, maxVideos - videos.length);
    const params = new URLSearchParams(COMMON_PARAMS);
    params.set('cursor', cursor);
    params.set('count', String(count));
    params.set('collects_id', String(collectsId));
    const data = await fetchJson(`${COLLECTS_VIDEO_URL}?${params}`, cookie);
    const list = data?.aweme_list || [];

    for (const aweme of list) {
      if (videos.length >= maxVideos) break;
      videos.push(normalizeVideo(aweme));
    }

    hasMore = data?.has_more;
    cursor = String(data?.cursor ?? 0);
    if (!list.length) break;
  }

  return videos;
}

function writeModule(filePath, exportName, value) {
  const json = JSON.stringify(value, null, 2);
  const labels = {
    account: '账号信息',
    groups: '收藏夹分组',
    videos: '收藏夹视频列表',
  };
  writeFileSync(
    filePath,
    `/** 抖音${labels[exportName] || exportName}（本地缓存），由 ${SCRIPT_NAME} 写入 */\nexport default ${json};\n`,
    'utf8',
  );
}

async function main() {
  loadEnvFile();
  const cookie = requireCookie();
  const maxVideos =
    Number(process.env.PUBLIC_DOUYIN_MAX_VIDEOS || process.env.DOUYIN_MAX_VIDEOS || DEFAULT_MAX) ||
    DEFAULT_MAX;
  const keywords = parseCollectsKeywords(
    process.env.PUBLIC_DOUYIN_COLLECTS_KEYWORDS ||
      process.env.DOUYIN_COLLECTS_KEYWORDS ||
      DEFAULT_COLLECTS_KEYWORDS.join(','),
  );
  const syncedAt = new Date().toISOString();

  console.log('正在拉取抖音账号信息…');
  const profile = await fetchProfile(cookie);

  console.log(`正在按关键词匹配收藏夹：${keywords.join(' / ')}…`);
  const allFolders = await fetchCollectFolders(cookie);
  const grouped = groupFoldersByKeywords(allFolders, keywords);
  const matchedCount = grouped.reduce((sum, g) => sum + g.folders.length, 0);
  if (!matchedCount) {
    const names = allFolders.map((f) => f.name).filter(Boolean);
    throw new Error(
      `未找到名称含「${keywords.join(' / ')}」的收藏夹。${names.length ? `现有：${names.join('、')}` : '当前账号下暂无收藏夹'}`,
    );
  }

  const groups = [];
  for (const group of grouped) {
    console.log(`「${group.keyword}」匹配 ${group.folders.length} 个收藏夹`);
    const foldersWithVideos = [];
    for (const folder of group.folders) {
      console.log(`  拉取「${folder.name}」…`);
      const videos = await fetchCollectFolderVideos(cookie, folder.id, maxVideos);
      foldersWithVideos.push({ ...folder, videos });
    }
    groups.push({
      keyword: group.keyword,
      label: group.label,
      folders: foldersWithVideos,
    });
  }

  const videos = groups.flatMap((g) => g.folders.flatMap((f) => f.videos));
  const account = normalizeAccount(profile, syncedAt);

  writeModule(join(OUT_DIR, 'account.js'), 'account', account);
  writeModule(join(OUT_DIR, 'groups.js'), 'groups', groups);
  writeModule(join(OUT_DIR, 'videos.js'), 'videos', videos);

  console.log(`已写入 ${groups.length} 组 / ${videos.length} 条缓存 → ${OUT_DIR}`);
  if (account.nickname) {
    console.log(`账号：${account.nickname}${account.uniqueId ? ` (@${account.uniqueId})` : ''}`);
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
