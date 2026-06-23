/** 常用召唤师技能（图标来自腾讯官网 spell CDN） */
export const FLASH_SPELL_ID = '4';

export const LOL_SUMMONER_SPELLS = [
  { id: '4', key: 'SummonerFlash', name: '闪现', aliases: ['Flash'] },
  { id: '14', key: 'SummonerDot', name: '点燃', aliases: ['Ignite', '引燃'] },
  { id: '3', key: 'SummonerExhaust', name: '虚弱', aliases: ['Exhaust'] },
  { id: '21', key: 'SummonerBarrier', name: '屏障', aliases: ['Barrier'] },
  { id: '7', key: 'SummonerHeal', name: '治疗', aliases: ['Heal', '治疗术'] },
  { id: '6', key: 'SummonerHaste', name: '疾跑', aliases: ['Ghost', '幽灵疾步'] },
  { id: '12', key: 'SummonerTeleport', name: '传送', aliases: ['Teleport'] },
  { id: '1', key: 'SummonerBoost', name: '净化', aliases: ['Cleanse'] },
  { id: '11', key: 'SummonerSmite', name: '惩戒', aliases: ['Smite'] },
  { id: '13', key: 'SummonerMana', name: '清晰术', aliases: ['Clarity'] },
];

const SPELL_ICON_BASE = 'https://game.gtimg.cn/images/lol/act/img/spell';

export function summonerSpellIcon(spellId) {
  const spell = getSummonerSpell(spellId);
  if (!spell?.key) return '';
  return `${SPELL_ICON_BASE}/${spell.key}.png`;
}

export function getSummonerSpell(spellId) {
  return LOL_SUMMONER_SPELLS.find((spell) => spell.id === spellId);
}

export function parseSkillsText(text = '') {
  if (!text) return [];

  return text
    .split(/[,，、\s]+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((label) => {
      const spell = LOL_SUMMONER_SPELLS.find(
        (item) => item.name === label || item.aliases?.includes(label),
      );
      return spell?.id;
    })
    .filter(Boolean);
}

/** 固定两项：闪现 + 可选第二项（需在 allowedSecond 内） */
export function normalizeSkillIds(ids = [], legacyText = '', allowedSecond = null) {
  const pool =
    allowedSecond?.length
      ? allowedSecond
      : LOL_SUMMONER_SPELLS.filter((spell) => spell.id !== FLASH_SPELL_ID).map((spell) => spell.id);

  const parsed = ids.length ? [...ids] : parseSkillsText(legacyText);
  const second = parsed.find((id) => id !== FLASH_SPELL_ID && pool.includes(id));

  return second ? [FLASH_SPELL_ID, second] : [FLASH_SPELL_ID];
}

export function createDefaultSkillIds() {
  return [FLASH_SPELL_ID];
}

export function secondSkillId(row) {
  const skills = normalizeSkillIds(row.skillIds);
  return skills[1] || '';
}
