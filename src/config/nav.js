import { CATEGORIES } from './consts.js';

/** 导航栏一级入口（始终展示）
 * 仅保留核心入口；后续新增分类/模块（如技术栈）走首页分类卡进入，不要往这里加。
 */
export const NAV_PRIMARY_ENTRIES = [
  { type: 'home', to: '/', label: '首页' },
  { type: 'category', key: 'travel' },
  { type: 'category', key: 'lol' },
  { type: 'category', key: 'upcoming' },
  { type: 'category', key: 'tools' },
];

/**
 * 首页分类入口组（categoryPortal / 分类入口）
 * - 对外展示：sectionLabel
 * - 对内语义：categoryPortal（后续文档或代码可称「分类」「入口」）
 */
export const NAV_CATEGORY_PORTAL = {
  sectionLabel: '你想要了解',
  categoryKeys: ['life', 'tech'],
};

export function resolveNavCategoryLink(key) {
  const cat = CATEGORIES[key];
  if (!cat) return null;

  return {
    key,
    to: `/${key}`,
    label: cat.label,
  };
}

export function buildPrimaryNavLinks() {
  return NAV_PRIMARY_ENTRIES.map((entry) => {
    if (entry.type === 'home') {
      return { key: 'home', to: entry.to, label: entry.label };
    }

    return resolveNavCategoryLink(entry.key);
  }).filter(Boolean);
}

export function buildCategoryPortalLinks() {
  return NAV_CATEGORY_PORTAL.categoryKeys.map(resolveNavCategoryLink).filter(Boolean);
}

export function isNavLinkActive(routePath, to) {
  if (to === '/') {
    return routePath === '/' || routePath === '';
  }

  return routePath === to || routePath.startsWith(`${to}/`);
}

export function isCategoryPortalActive(routePath, portalLinks = buildCategoryPortalLinks()) {
  return portalLinks.some((link) => isNavLinkActive(routePath, link.to));
}
