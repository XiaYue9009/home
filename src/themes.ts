export const THEMES = {
  nature: { id: 'nature', label: '自然', emoji: '🌿', giscus: 'noborder_light' },
  minimal: { id: 'minimal', label: '简约', emoji: '☀️', giscus: 'light' },
  night: { id: 'night', label: '夜间', emoji: '🌙', giscus: 'dark_dimmed' },
} as const;

export type ThemeId = keyof typeof THEMES;

export const DEFAULT_THEME: ThemeId = 'night';
export const THEME_STORAGE_KEY = 'moonhome-theme';

export const THEME_LIST = Object.values(THEMES);
