export const SITE = {
  title: 'MoonHome',
  description: '记录生活趣事、技术笔记与游戏杂谈的个人小站',
  author: 'Moon',
  github: 'https://github.com/XiaYue9009',
};

export const CATEGORIES = {
  life: {
    label: '生活',
    emoji: '🌿',
    color: 'text-emerald-400',
    description: '日常趣事与生活点滴的记录',
  },
  tech: {
    label: '技术',
    emoji: '⚡',
    color: 'text-sky-400',
    description: '技术学习笔记与开发心得',
  },
  travel: {
    label: '旅行',
    emoji: '✈️',
    color: 'text-amber-400',
    description: '抖音收藏夹 · Supabase 持久化 · 地理分组',
  },
  lol: {
    label: 'LOL',
    emoji: '⚔️',
    color: 'text-violet-400',
    description: '英雄对线笔记与常玩英雄展示',
  },
  upcoming: {
    label: '后续优化',
    emoji: '📝',
    color: 'text-rose-400',
    description: '待办事项与后续优化想法的备忘',
  },
  tools: {
    label: '系统工具',
    emoji: '🛠️',
    color: 'text-indigo-400',
    description: '工具能力展示、交互 Demo 与实现说明',
  },
  stack: {
    label: '技术栈',
    emoji: '🧩',
    color: 'text-teal-400',
    description: '项目技术栈',
  },
};

export function formatDate(date) {
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
