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
  orderRuneLoadout,
  runeStyleFromIds,
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

let heroListCache = null;

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

function sameIdList(a = [], b = []) {
  return a.length === b.length && a.every((id, index) => id === b[index]);
}

/** 是否为有实质内容的记录（空占位行不同步到云端/本地缓存） */
export function isMatchupRowStored(row = {}) {
  const hasLoadout =
    row.primaryRuneIds?.length || row.secondaryRuneIds?.length || row.itemIds?.length;

  if (!row.enemyId) {
    return Boolean(row.tips?.trim() || hasLoadout);
  }

  if (row.tips?.trim()) return true;
  if (row.difficulty && row.difficulty !== DEFAULT_MATCHUP_DIFFICULTY) return true;
  if (hasLoadout) return true;
  if (!sameIdList(row.skillIds, createDefaultSkillIds())) return true;
  if (!sameIdList(row.candidateSpellIds, normalizeCandidateSpellIds([], row.enemyId))) return true;

  return false;
}

/** 精简存储：去掉空占位行与可推导字段 */
export function compactRowsForStorage(rows = []) {
  return rows.filter(isMatchupRowStored).map((row) => ({
    id: row.id,
    enemyId: row.enemyId || '',
    candidateSpellIds: [...(row.candidateSpellIds || [])],
    skillIds: [...(row.skillIds || [])],
    primaryRuneIds: [...(row.primaryRuneIds || [])],
    secondaryRuneIds: [...(row.secondaryRuneIds || [])],
    itemIds: [...(row.itemIds || [])],
    difficulty: row.difficulty || DEFAULT_MATCHUP_DIFFICULTY,
    tips: row.tips || '',
  }));
}

/** 从云端 / 本地缓存 / 静态默认数据中选择最新的一份（只读，不写入云端） */
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
      saveStoredMatchups(heroId, compactRowsForStorage(cloud.rows));
      saveMatchupMeta(heroId, { updatedAt: cloud.updatedAt, source: 'cloud' });
      return cloud.rows;
    }

    if (hasLocalRows) return localRows;
    return fallbackRows;
  } catch {
    return localRows?.length ? localRows : fallbackRows;
  }
}

/** 写入本地缓存，并同步到云端（仅保存有内容的记录） */
export async function persistMatchups(heroId, rows) {
  const stored = compactRowsForStorage(rows);
  const updatedAt = new Date().toISOString();
  saveStoredMatchups(heroId, stored);
  saveMatchupMeta(heroId, { updatedAt, source: 'local' });

  if (!isCloudSyncEnabled()) {
    return { ok: true, cloud: false };
  }

  try {
    const syncedAt = await upsertCloudMatchups(heroId, stored);
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

function sortMidHeroIds(ids, heroes = []) {
  const byId = new Map(heroes.map((hero) => [hero.id, hero]));
  return [...ids].sort((a, b) => {
    const nameA = byId.get(a)?.name || '';
    const nameB = byId.get(b)?.name || '';
    return nameA.localeCompare(nameB, 'zh-CN');
  });
}

export async function fetchMidHeroIds() {
  let heroes = [];
  try {
    heroes = await fetchLolHeroList();
  } catch {
    heroes = [];
  }

  return sortMidHeroIds(MID_HERO_IDS, heroes);
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
  let { primaryRuneIds, secondaryRuneIds } = normalizeRunes(row, catalogs.runes || []);
  ({ primaryRuneIds, secondaryRuneIds } = orderRuneLoadout(
    primaryRuneIds,
    secondaryRuneIds,
    catalogs.runes || [],
  ));

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
    if (!raw) return null;
    return compactRowsForStorage(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveStoredMatchups(heroId, rows) {
  if (typeof localStorage === 'undefined') return;

  localStorage.setItem(matchupStorageKey(heroId), JSON.stringify(rows));
}

export { allRuneIdsFromRow, FLASH_SPELL_ID, createDefaultSkillIds, normalizeSkillIds };
