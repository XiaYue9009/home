import { FLASH_SPELL_ID, LOL_SUMMONER_SPELLS } from './summoner-spells.js';

/** 第二召唤师技能候选（闪现固定为第一项） */
export const DEFAULT_SECOND_SPELL_IDS = ['3', '21', '6', '12'];

export const MAX_SECOND_SPELL_CANDIDATES = 4;

const VALID_SECOND_SPELL_IDS = new Set(
  LOL_SUMMONER_SPELLS.filter((spell) => spell.id !== FLASH_SPELL_ID).map((spell) => spell.id),
);

/** 候选技能展示顺序（与官方技能列表一致，不含闪现） */
export const SECOND_SPELL_DISPLAY_ORDER = LOL_SUMMONER_SPELLS.filter(
  (spell) => spell.id !== FLASH_SPELL_ID,
).map((spell) => spell.id);

const SECOND_SPELL_ORDER_INDEX = new Map(
  SECOND_SPELL_DISPLAY_ORDER.map((id, index) => [id, index]),
);

function sortCandidateSpellIds(ids) {
  return [...ids].sort(
    (a, b) =>
      (SECOND_SPELL_ORDER_INDEX.get(a) ?? Number.MAX_SAFE_INTEGER) -
      (SECOND_SPELL_ORDER_INDEX.get(b) ?? Number.MAX_SAFE_INTEGER),
  );
}

export function normalizeCandidateSpellIds(ids = [], enemyId = '') {
  const defaults = getSecondSpellOptions(enemyId);
  const source = ids?.length ? ids : defaults;

  return sortCandidateSpellIds(
    source
      .filter((id) => id !== FLASH_SPELL_ID && VALID_SECOND_SPELL_IDS.has(id))
      .filter((id, index, list) => list.indexOf(id) === index)
      .slice(0, MAX_SECOND_SPELL_CANDIDATES),
  );
}

/** 按对线英雄定制第二技能池，未配置则用默认四项 */
export const ENEMY_SECOND_SPELL_OVERRIDES = {
  157: DEFAULT_SECOND_SPELL_IDS,
};

export function getSecondSpellOptions(enemyId = '') {
  if (!enemyId) return [...DEFAULT_SECOND_SPELL_IDS];
  return ENEMY_SECOND_SPELL_OVERRIDES[enemyId] || [...DEFAULT_SECOND_SPELL_IDS];
}

export function getSelectableSecondSpells() {
  return LOL_SUMMONER_SPELLS.filter((spell) => spell.id !== FLASH_SPELL_ID);
}

export function getSecondSpellOptionsForRow(row, lookup) {
  const enemyId = row.enemyId || lookup?.byLabel?.get(row.enemyName)?.id || '';
  return normalizeCandidateSpellIds(row.candidateSpellIds, enemyId);
}
