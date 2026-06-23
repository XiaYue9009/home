import { FEATURED_LOL_DISPLAY_SKIN_IDS } from '../config/lol.js';

/** 首页 LOL 栏目展示的英雄（顺序即展示顺序） */
export const FEATURED_LOL_HERO_IDS = ['134', '131', '950'];

const ROLE_LABELS = {
  mage: '法师',
  fighter: '战士',
  assassin: '刺客',
  tank: '坦克',
  marksman: '射手',
  support: '辅助',
};

export function formatLolRoles(roles = []) {
  return roles.map((role) => ROLE_LABELS[role] || role).join(' · ');
}

export function lolHeroDetailUrl(heroId) {
  return `https://101.qq.com/#/hero-detail?heroid=${heroId}&datatype=5v5`;
}

export function lolHeroPagePath(heroId) {
  const base = import.meta.env.BASE_URL;
  return `${base}lol/${heroId}`;
}

const SPELL_ORDER = ['passive', 'q', 'w', 'e', 'r'];

function sortSpells(spells = []) {
  return [...spells].sort(
    (a, b) => SPELL_ORDER.indexOf(a.spellKey) - SPELL_ORDER.indexOf(b.spellKey),
  );
}

function difficultyBars(value, max = 10, segments = 3) {
  const score = Number.parseInt(value, 10) || 0;
  const filled = Math.min(segments, Math.max(0, Math.round((score / max) * segments)));
  return { filled, segments };
}

const LOL_REFERER = 'https://101.qq.com/';

function pickHeroSkins(skins, heroId) {
  const avatarSkin = skins.find((item) => item.isBase === '1') || skins[0];
  const displaySkinId = FEATURED_LOL_DISPLAY_SKIN_IDS[heroId];
  const displaySkin = displaySkinId
    ? skins.find((item) => item.skinId === displaySkinId)
    : null;

  return {
    avatarSkin,
    displaySkin: displaySkin || avatarSkin,
  };
}

function skinDisplayImage(skin) {
  return skin?.loadingImg || skin?.mainImg || skin?.iconImg || '';
}

export async function fetchLolHeroDetail(heroId) {
  const res = await fetch(
    `https://game.gtimg.cn/images/lol/act/img/js/hero/${heroId}.js`,
    { headers: { Referer: LOL_REFERER } },
  );
  if (!res.ok) throw new Error(`英雄 ${heroId} 数据获取失败`);

  const data = await res.json();
  const hero = data.hero;
  const skins = Object.values(data.skins || {});
  const { avatarSkin, displaySkin } = pickHeroSkins(skins, heroId);
  const difficulty = difficultyBars(hero.difficulty);

  return {
    id: hero.heroId,
    name: hero.title,
    fullName: hero.name,
    title: hero.title,
    alias: hero.alias,
    roles: hero.roles || [],
    roleLabel: formatLolRoles(hero.roles),
    shortBio: hero.shortBio || '',
    difficulty,
    attack: hero.attack,
    defense: hero.defense,
    magic: hero.magic,
    icon: avatarSkin?.iconImg || '',
    splash: skinDisplayImage(displaySkin) || hero.palmHeroHeadImg || avatarSkin?.iconImg || '',
    mainImg: displaySkin?.mainImg || displaySkin?.loadingImg || '',
    palmImg: hero.palmHeroHeadImg || '',
    spells: sortSpells(data.spells || []).map((spell) => ({
      key: spell.spellKey,
      name: spell.name,
      icon: spell.abilityIconPath,
      description: spell.dynamicDescription || spell.description,
    })),
    officialUrl: lolHeroDetailUrl(heroId),
    pagePath: lolHeroPagePath(heroId),
  };
}

export async function fetchLolHero(heroId) {
  const res = await fetch(
    `https://game.gtimg.cn/images/lol/act/img/js/hero/${heroId}.js`,
    { headers: { Referer: LOL_REFERER } },
  );
  if (!res.ok) throw new Error(`英雄 ${heroId} 数据获取失败`);

  const data = await res.json();
  const skins = Object.values(data.skins || {});
  const { avatarSkin, displaySkin } = pickHeroSkins(skins, heroId);

  return {
    id: data.hero.heroId,
    name: data.hero.title,
    fullName: data.hero.name,
    title: data.hero.title,
    alias: data.hero.alias,
    roles: data.hero.roles || [],
    roleLabel: formatLolRoles(data.hero.roles),
    icon: avatarSkin?.iconImg || '',
    image: skinDisplayImage(displaySkin),
    detailUrl: lolHeroPagePath(heroId),
    officialUrl: lolHeroDetailUrl(heroId),
  };
}

export async function fetchFeaturedLolHeroes() {
  return Promise.all(FEATURED_LOL_HERO_IDS.map((id) => fetchLolHero(id)));
}

/** 构建失败时的静态兜底（图片 URL 来自官方 CDN） */
export const FALLBACK_LOL_HEROES = [
  {
    id: '134',
    name: '辛德拉',
    fullName: '暗黑元首',
    title: '辛德拉',
    alias: 'Syndra',
    roles: ['mage'],
    roleLabel: '法师',
    icon: 'https://game.gtimg.cn/images/lol/act/img/skin/small_66062b25-6352-4727-b23f-7c05e1c2ebc8.jpg',
    image: 'https://game.gtimg.cn/images/lol/act/img/skinloading/9474561b-b124-4cbc-88ab-e508a6b164d3.jpg',
    detailUrl: lolHeroPagePath('134'),
    officialUrl: lolHeroDetailUrl('134'),
  },
  {
    id: '131',
    name: '黛安娜',
    fullName: '皎月女神',
    title: '黛安娜',
    alias: 'Diana',
    roles: ['fighter', 'assassin'],
    roleLabel: '战士 · 刺客',
    icon: 'https://game.gtimg.cn/images/lol/act/img/skin/small_39fd48d9-3895-4b2f-858b-02b5243c788c.jpg',
    image: 'https://game.gtimg.cn/images/lol/act/img/skinloading/c5939738-eda6-4ae5-a1bd-129b5ffbc54f.jpg',
    detailUrl: lolHeroPagePath('131'),
    officialUrl: lolHeroDetailUrl('131'),
  },
  {
    id: '950',
    name: '纳亚菲利',
    fullName: '百裂冥犬',
    title: '纳亚菲利',
    alias: 'Naafiri',
    roles: ['assassin', 'fighter'],
    roleLabel: '刺客 · 战士',
    icon: 'https://game.gtimg.cn/images/lol/act/img/skin/small_b83cd9bc-39e6-4f38-9288-61842ebf575b.jpg',
    image: 'https://game.gtimg.cn/images/lol/act/img/skinloading/54a832e8-d5bd-4ec4-b803-6367f90c1124.jpg',
    detailUrl: lolHeroPagePath('950'),
    officialUrl: lolHeroDetailUrl('950'),
  },
];

export async function getFeaturedLolHeroes() {
  try {
    return await fetchFeaturedLolHeroes();
  } catch {
    return FALLBACK_LOL_HEROES;
  }
}
