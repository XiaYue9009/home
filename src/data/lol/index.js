/**
 * LOL 模块静态数据
 * - hero-meta.js     展示用胜率/梯度（手工维护）
 * - mid-hero-ids.js  中单英雄 ID，由 `pnpm sync:lol-mid` 生成
 * - matchups/        各英雄对线表，按 heroId 分文件维护
 */
export { getLolHeroMeta, LOL_HERO_META } from './hero-meta.js';
export { MID_HERO_IDS } from './mid-hero-ids.js';
export { getLolMatchups, getLolMatchupEditorPath } from './matchups/index.js';
