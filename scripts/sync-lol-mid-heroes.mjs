/**
 * 构建时在 Node 拉取官方分路数据，写入 src/data/lol/mid-hero-ids.js。
 * 浏览器无法跨域 fetch lol.qq.com，因此不在客户端请求该接口。
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_FILE = join(__dirname, '../src/data/lol/mid-hero-ids.js');

const LOL_REFERER = 'https://101.qq.com/';
const HERO_LIST_URL = 'https://game.gtimg.cn/images/lol/act/img/js/heroList/hero_list.js';
const CHAMPION_POSITION_URL =
  'https://lol.qq.com/act/lbp/common/guides/guideschampion_position.js';

function parseChampionPositionScript(text = '') {
  const start = text.indexOf('{');
  const end = text.indexOf('};');
  if (start < 0 || end < 0) throw new Error('分路数据解析失败');
  return JSON.parse(text.slice(start, end + 1)).list;
}

function sortMidHeroIds(ids, heroes = []) {
  const byId = new Map(heroes.map((hero) => [hero.id, hero]));
  return [...ids].sort((a, b) => {
    const nameA = byId.get(a)?.name || '';
    const nameB = byId.get(b)?.name || '';
    return nameA.localeCompare(nameB, 'zh-CN');
  });
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: { Referer: LOL_REFERER } });
  if (!res.ok) throw new Error(`请求失败 ${url} (${res.status})`);
  return res;
}

async function main() {
  const [heroRes, positionRes] = await Promise.all([
    fetchJson(HERO_LIST_URL),
    fetchJson(CHAMPION_POSITION_URL),
  ]);

  const heroData = await heroRes.json();
  const positions = parseChampionPositionScript(await positionRes.text());

  const heroes = heroData.hero.map((hero) => ({
    id: hero.heroId,
    name: hero.title,
  }));

  const midIds = heroes
    .filter((hero) => positions[hero.id]?.mid !== undefined)
    .map((hero) => hero.id);

  if (midIds.length < 40) {
    throw new Error(`中单英雄数量异常 (${midIds.length})，已中止写入`);
  }

  const sorted = sortMidHeroIds(midIds, heroes);
  const body = sorted.map((id) => `  '${id}',`).join('\n');

  writeFileSync(
    OUT_FILE,
    `/**
 * 官方分路数据中的中单英雄 ID（guideschampion_position.js · mid）
 * 由 \`pnpm sync:lol-mid\` 生成，避免浏览器 CORS
 */
export const MID_HERO_IDS = [
${body}
];
`,
    'utf8',
  );

  console.log(`已写入 ${sorted.length} 个中单英雄 → ${OUT_FILE}`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
