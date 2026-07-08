/** MoonHome 动画预设 — 详见 .agent-memory/animate-style/02-moonhome-presets.md */

export const ANIMATE_PREFIX = 'animate__';

export const MOTION_STAGGER = {
  fast: 60,
  normal: 85,
  slow: 110,
  nav: 55,
  card: 80,
  post: 75,
  hero: 90,
  video: 70,
  tag: 50,
};

/** 列表项轮播使用的入场动画池 */
export const ENTRANCE_POOL = {
  categoryCard: ['fadeInUp', 'zoomIn', 'backInUp', 'fadeInLeft', 'fadeInRight'],
  post: ['fadeInUp', 'fadeInLeft', 'fadeInRight', 'zoomIn'],
  hero: ['backInUp', 'zoomIn', 'fadeInUp', 'backInLeft', 'backInRight'],
  video: ['zoomIn', 'fadeInUp', 'fadeInLeft', 'fadeInRight', 'backInUp'],
  upcoming: ['fadeInUp', 'zoomIn', 'fadeIn'],
};

export function pickCycleAnimation(index, pool) {
  const list = Array.isArray(pool) ? pool : ENTRANCE_POOL[pool] || ENTRANCE_POOL.post;
  return list[index % list.length];
}

export const MOTION_HERO = {
  badge: { animation: 'fadeInDown', delay: 120 },
  title: { animation: 'zoomIn', delay: 280 },
  description: { animation: 'fadeInLeft', delay: 420 },
  cta: { animation: 'backInUp', delay: 560 },
};

export const MOTION_HOME = {
  portalTitle: { animation: 'fadeInLeft', speed: 'fast' },
  demo: { animation: 'flipInX' },
  postsTitle: { animation: 'fadeInRight', speed: 'fast' },
  about: { animation: 'slideInLeft' },
  github: { animation: 'slideInRight', delay: 100 },
};

export const MOTION_CATEGORY = {
  icon: { animation: 'zoomIn' },
  title: { animation: 'fadeInUp', delay: 100 },
  desc: { animation: 'fadeIn', delay: 200, speed: 'fast' },
  sectionTitle: { animation: 'fadeInLeft', speed: 'fast' },
  upcomingCompose: { animation: 'zoomIn', speed: 'fast' },
  upcomingHint: { animation: 'fadeIn', speed: 'fast' },
  empty: { animation: 'fadeIn' },
  loading: { animation: 'pulse', speed: 'slow' },
};

export const MOTION_POST = {
  breadcrumb: { animation: 'fadeInDown', speed: 'fast' },
  title: { animation: 'fadeInUp', delay: 80 },
  description: { animation: 'fadeInLeft', delay: 160 },
  date: { animation: 'fadeIn', delay: 240, speed: 'fast' },
  tags: { animation: 'fadeInUp', delay: 300 },
  body: { animation: 'fadeIn', delay: 120 },
  commentsTitle: { animation: 'slideInUp', speed: 'fast' },
  comments: { animation: 'fadeInUp' },
  notFound: { animation: 'headShake' },
};

export const MOTION_LOL_DETAIL = {
  back: { animation: 'fadeInLeft', speed: 'fast' },
  profile: { animation: 'backInLeft', delay: 80 },
  main: { animation: 'backInRight', delay: 160 },
  panel: { animation: 'fadeInUp', delay: 280 },
  loading: { animation: 'pulse' },
};

export const MOTION_NOT_FOUND = {
  code: { animation: 'bounceIn' },
  title: { animation: 'fadeInUp', delay: 200 },
  desc: { animation: 'fadeIn', delay: 350, speed: 'fast' },
  cta: { animation: 'backInUp', delay: 480 },
};

export const MOTION_LAYOUT = {
  logo: { animation: 'fadeInLeft', speed: 'fast' },
  navItem: { animation: 'fadeInDown', speed: 'faster' },
  footer: { animation: 'fadeInUp' },
  page: { animation: 'fadeIn', speed: 'faster' },
};
