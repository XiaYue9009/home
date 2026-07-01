/** 展示用胜率/梯度，手工维护；未收录英雄显示占位符。 */
export const LOL_HERO_META = {
  134: { winRate: '51.4%', tier: 'T2' },
  131: { winRate: '50.8%', tier: 'T2' },
  950: { winRate: '49.6%', tier: 'T3' },
};

export function getLolHeroMeta(heroId) {
  return LOL_HERO_META[heroId] ?? { winRate: '—', tier: '—' };
}
