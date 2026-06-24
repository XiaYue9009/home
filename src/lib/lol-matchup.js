import { DEFAULT_MATCHUP_DIFFICULTY } from '../config/lol-matchup-difficulty.js';
import { MID_HERO_IDS } from '../data/lol-mid-hero-ids.js';
import { getSecondSpellOptions, normalizeCandidateSpellIds } from '../config/lol-matchup-spells.js';
import {
  FLASH_SPELL_ID,
  createDefaultSkillIds,
  normalizeSkillIds,
  parseSkillsText,
} from '../config/lol-summoner-spells.js';
import {
  allRuneIdsFromRow,
  parseItemIds,
  parseRuneIds,
  splitRuneIds,
} from './lol-game-data.js';
import {
  fetchCloudMatchups,
  isCloudSyncEnabled,
  upsertCloudMatchups,
} from './matchup-cloud.js';

export { isCloudSyncEnabled };

const LOL_REFERER = 'https://101.qq.com/';
const HERO_LIST_URL = 'https://game.gtimg.cn/images/lol/act/img/js/heroList/hero_list.js';
const CHAMPION_POSITION_URL =
  'https://lol.qq.com/act/lbp/common/guides/guideschampion_position.js';

let heroListCache = null;
let positionCache = null;

export function lolHeroIcon(alias) {
  return `https://game.gtimg.cn/images/lol/act/img/champion/${alias}.png`;
}

export function matchupStorageKey(heroId) {
  return `moonhome-lol-matchups-${heroId}`;
}

export function matchupMetaKey(heroId) {
  return `moonhome-lol-matchups-meta-${heroId}`;
}

export function loadMatchupMeta(heroId) {
  if (typeof localStorage === 'undefined') return null;

  try {
    const raw = localStorage.getItem(matchupMetaKey(heroId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveMatchupMeta(heroId, meta) {
  if (typeof localStorage === 'undefined') return;

  localStorage.setItem(matchupMetaKey(heroId), JSON.stringify(meta));
}

function parseUpdatedAt(value = '') {
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : 0;
}

/** 从云端 / 本地缓存 / 静态默认数据中选择最新的一份 */
export async function resolveMatchupSource(heroId, fallbackRows = []) {
  const localRows = loadStoredMatchups(heroId);
  const localUpdated = parseUpdatedAt(loadMatchupMeta(heroId)?.updatedAt);

  if (!isCloudSyncEnabled()) {
    return localRows?.length ? localRows : fallbackRows;
  }

  try {
    const cloud = await fetchCloudMatchups(heroId);
    const cloudUpdated = parseUpdatedAt(cloud?.updatedAt);
    const hasCloudRows = Array.isArray(cloud?.rows) && cloud.rows.length > 0;
    const hasLocalRows = Array.isArray(localRows) && localRows.length > 0;

    if (hasCloudRows && (!hasLocalRows || cloudUpdated >= localUpdated)) {
      saveStoredMatchups(heroId, cloud.rows);
      saveMatchupMeta(heroId, { updatedAt: cloud.updatedAt, source: 'cloud' });
      return cloud.rows;
    }

    const source = hasLocalRows ? localRows : fallbackRows;
    if (source.length && (!hasCloudRows || localUpdated > cloudUpdated)) {
      const syncedAt = await upsertCloudMatchups(heroId, source);
      saveMatchupMeta(heroId, { updatedAt: syncedAt, source: 'cloud' });
    }

    return source;
  } catch {
    return localRows?.length ? localRows : fallbackRows;
  }
}

/** 写入本地缓存，并同步到云端 */
export async function persistMatchups(heroId, rows) {
  const updatedAt = new Date().toISOString();
  saveStoredMatchups(heroId, rows);
  saveMatchupMeta(heroId, { updatedAt, source: 'local' });

  if (!isCloudSyncEnabled()) {
    return { ok: true, cloud: false };
  }

  try {
    const syncedAt = await upsertCloudMatchups(heroId, rows);
    saveMatchupMeta(heroId, { updatedAt: syncedAt, source: 'cloud' });
    return { ok: true, cloud: true };
  } catch (error) {
    return { ok: false, cloud: true, error };
  }
}

export async function fetchLolHeroList() {
  if (heroListCache) return heroListCache;

  const res = await fetch(HERO_LIST_URL, { headers: { Referer: LOL_REFERER } });
  if (!res.ok) throw new Error('英雄列表获取失败');

  const data = await res.json();
  heroListCache = data.hero.map((hero) => ({
    id: hero.heroId,
    name: hero.title,
    fullName: hero.name,
    alias: hero.alias,
    icon: lolHeroIcon(hero.alias),
    keywords: hero.keywords || '',
  }));

  return heroListCache;
}

function parseChampionPositionScript(text = '') {
  const start = text.indexOf('{');
  const end = text.indexOf('};');
  if (start < 0 || end < 0) throw new Error('分路数据解析失败');
  return JSON.parse(text.slice(start, end + 1)).list;
}

export async function fetchChampionPositions() {
  if (positionCache) return positionCache;

  const res = await fetch(CHAMPION_POSITION_URL, { headers: { Referer: LOL_REFERER } });
  if (!res.ok) throw new Error('分路数据获取失败');

  positionCache = parseChampionPositionScript(await res.text());
  return positionCache;
}

function sortMidHeroIds(ids, heroes = []) {
  const byId = new Map(heroes.map((hero) => [hero.id, hero]));
  return [...ids].sort((a, b) => {
    const nameA = byId.get(a)?.name || '';
    const nameB = byId.get(b)?.name || '';
    return nameA.localeCompare(nameB, 'zh-CN');
  });
}

export async function fetchMidHeroIds() {
  let ids = MID_HERO_IDS;

  try {
    const [heroes, positions] = await Promise.all([fetchLolHeroList(), fetchChampionPositions()]);
    const dynamic = heroes
      .filter((hero) => positions[hero.id]?.mid !== undefined)
      .map((hero) => hero.id);

    if (dynamic.length >= MID_HERO_IDS.length - 3) ids = dynamic;
    return sortMidHeroIds(ids, heroes);
  } catch {
    const heroes = await fetchLolHeroList().catch(() => []);
    return sortMidHeroIds(ids, heroes);
  }
}

export function sortMatchupRowsByHeroName(rows = [], heroLookup) {
  return [...rows].sort((a, b) => {
    const nameA = heroLookup.byId.get(a.enemyId)?.name || a.enemyName || '';
    const nameB = heroLookup.byId.get(b.enemyId)?.name || b.enemyName || '';
    return nameA.localeCompare(nameB, 'zh-CN');
  });
}

export function createEmptyMatchupRow(enemyId = '', heroLookup) {
  const hero = enemyId ? heroLookup.byId.get(enemyId) : null;

  return {
    id: createRowId(),
    enemyId: enemyId || '',
    enemyName: hero?.name || '',
    candidateSpellIds: normalizeCandidateSpellIds([], enemyId),
    skillIds: createDefaultSkillIds(),
    primaryRuneIds: [],
    secondaryRuneIds: [],
    itemIds: [],
    difficulty: DEFAULT_MATCHUP_DIFFICULTY,
    tips: '',
  };
}

export function mergeMidMatchupRows(rows = [], { pageHeroId, midHeroIds, heroLookup }) {
  const byEnemyId = new Map();
  const extras = [];

  for (const row of rows) {
    if (row.enemyId) {
      if (!byEnemyId.has(row.enemyId)) byEnemyId.set(row.enemyId, row);
      else extras.push(row);
    } else {
      extras.push(row);
    }
  }

  for (const enemyId of midHeroIds) {
    if (enemyId === pageHeroId || byEnemyId.has(enemyId)) continue;
    byEnemyId.set(enemyId, createEmptyMatchupRow(enemyId, heroLookup));
  }

  return sortMatchupRowsByHeroName([...byEnemyId.values(), ...extras], heroLookup);
}

export function buildHeroLookup(heroes = []) {
  const byId = new Map();
  const byLabel = new Map();

  for (const hero of heroes) {
    byId.set(hero.id, hero);
    byLabel.set(hero.name, hero);
    byLabel.set(hero.fullName, hero);
  }

  return { byId, byLabel };
}

export function createRowId() {
  return `row-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeRunes(row, catalog) {
  if (row.primaryRuneIds || row.secondaryRuneIds) {
    return {
      primaryRuneIds: [...(row.primaryRuneIds || [])],
      secondaryRuneIds: [...(row.secondaryRuneIds || [])],
    };
  }

  const legacyIds = row.runeIds?.length
    ? [...row.runeIds]
    : parseRuneIds(row.runes, catalog);

  return splitRuneIds(legacyIds, catalog);
}

export function normalizeMatchupRow(row, lookup, catalogs = {}) {
  const enemyHero = row.enemyId
    ? lookup.byId.get(row.enemyId)
    : lookup.byLabel.get(row.enemy) || lookup.byLabel.get(row.enemyName);

  const enemyId = enemyHero?.id || row.enemyId || '';
  const { primaryRuneIds, secondaryRuneIds } = normalizeRunes(row, catalogs.runes || []);

  const itemIds = row.itemIds?.length
    ? [...row.itemIds]
    : parseItemIds(row.items, catalogs.items || []);

  const candidateSpellIds = row.candidateSpellIds?.length
    ? normalizeCandidateSpellIds(row.candidateSpellIds, enemyId)
    : normalizeCandidateSpellIds(
        parseSkillsText(row.skills).filter((id) => id !== FLASH_SPELL_ID),
        enemyId,
      );

  return {
    id: row.id || createRowId(),
    enemyId,
    enemyName: enemyHero?.name || row.enemyName || row.enemy || '',
    candidateSpellIds,
    skillIds: normalizeSkillIds(row.skillIds, row.skills, candidateSpellIds),
    primaryRuneIds,
    secondaryRuneIds,
    itemIds,
    difficulty: row.difficulty || DEFAULT_MATCHUP_DIFFICULTY,
    tips: row.tips || '',
  };
}

export function normalizeMatchups(rows = [], lookup, catalogs = {}) {
  return rows.map((row) => normalizeMatchupRow(row, lookup, catalogs));
}

export function loadStoredMatchups(heroId) {
  if (typeof localStorage === 'undefined') return null;

  try {
    const raw = localStorage.getItem(matchupStorageKey(heroId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveStoredMatchups(heroId, rows) {
  if (typeof localStorage === 'undefined') return;

  localStorage.setItem(matchupStorageKey(heroId), JSON.stringify(rows));
}

export { allRuneIdsFromRow, FLASH_SPELL_ID, createDefaultSkillIds, normalizeSkillIds };
