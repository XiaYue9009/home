export const SITE = {
  title: 'MoonHome',
  description: '记录生活趣事、技术笔记与游戏杂谈的个人小站',
  author: 'Moon',
  github: 'https://github.com/XiaYue9009',
} as const;

export const CATEGORIES = {
  life: { label: '生活', emoji: '🌿', color: 'text-emerald-400' },
  tech: { label: '技术', emoji: '⚡', color: 'text-sky-400' },
  gaming: { label: '游戏', emoji: '🎮', color: 'text-violet-400' },
} as const;

export type Category = keyof typeof CATEGORIES;

export function formatDate(date: Date): string {
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
