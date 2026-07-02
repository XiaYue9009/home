/**
 * 可选：将抖音收藏写入本地缓存（src/data/travel/videos.js）。
 * 日常开发请直接 pnpm dev，在 /travel 页面实时拉取。
 *
 * 用法：pnpm sync:douyin-collection
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DEFAULT_MAX,
  buildPostBody,
  normalizeAccount,
  normalizeVideo,
} from '../src/lib/travel/douyin-collection.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT_DIR = join(ROOT, 'src/data/travel');
const ENV_FILE = join(ROOT, '.env');
const SCRIPT_NAME = 'scripts/sync-douyin-collection.mjs';

const COLLECTION_URL = 'https://www.douyin.com/aweme/v1/web/aweme/listcollection/';
const PROFILE_URL = 'https://www.douyin.com/aweme/v1/web/user/profile/self/';
const PAGE_SIZE = 20;

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
  const cookie = process.env.DOUYIN_COOKIE?.trim();
  if (!cookie) {
    throw new Error('未配置 DOUYIN_COOKIE。请在 .env 中填入浏览器登录 douyin.com 后的 Cookie。');
  }
  return cookie;
}

function buildHeaders(cookie) {
  return {
    Accept: 'application/json, text/plain, */*',
    'Content-Type': 'application/json',
    Cookie: cookie,
    Referer: 'https://www.douyin.com/',
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  };
}

async function fetchJson(url, cookie, options = {}) {
  const res = await fetch(url, { headers: buildHeaders(cookie), ...options });
  if (!res.ok) throw new Error(`请求失败 (${res.status}) ${url}`);
  const data = await res.json();
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

async function fetchAllCollections(cookie, maxVideos) {
  const videos = [];
  let cursor = 0;
  let hasMore = 1;

  while (hasMore && videos.length < maxVideos) {
    const count = Math.min(PAGE_SIZE, maxVideos - videos.length);
    const url = `${COLLECTION_URL}?${COMMON_PARAMS.toString()}`;
    const data = await fetchJson(url, cookie, {
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

function writeModule(filePath, exportName, value) {
  const json = JSON.stringify(value, null, 2);
  const label = exportName === 'account' ? '账号信息' : '收藏视频列表';
  writeFileSync(
    filePath,
    `/** 抖音${label}（本地缓存），由 ${SCRIPT_NAME} 写入 */\nexport default ${json};\n`,
    'utf8',
  );
}

async function main() {
  loadEnvFile();
  const cookie = requireCookie();
  const maxVideos = Number(process.env.PUBLIC_DOUYIN_MAX_VIDEOS || DEFAULT_MAX) || DEFAULT_MAX;
  const syncedAt = new Date().toISOString();

  console.log('正在拉取抖音账号信息…');
  const profile = await fetchProfile(cookie);

  console.log(`正在拉取收藏视频（listcollection，最多 ${maxVideos} 条）…`);
  const videos = await fetchAllCollections(cookie, maxVideos);
  const account = normalizeAccount(profile, syncedAt);

  writeModule(join(OUT_DIR, 'account.js'), 'account', account);
  writeModule(join(OUT_DIR, 'videos.js'), 'videos', videos);

  console.log(`已写入 ${videos.length} 条收藏缓存 → ${OUT_DIR}`);
  if (account.nickname) {
    console.log(`账号：${account.nickname}${account.uniqueId ? ` (@${account.uniqueId})` : ''}`);
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
