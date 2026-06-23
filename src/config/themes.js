export const THEMES = {
  nature: { id: 'nature', label: '自然', emoji: '🌿', giscus: 'noborder_light' },
  minimal: { id: 'minimal', label: '简约', emoji: '☀️', giscus: 'light' },
  night: { id: 'night', label: '夜间', emoji: '🌙', giscus: 'dark_dimmed' },
};

export const DEFAULT_THEME = 'nature';
export const THEME_STORAGE_KEY = 'moonhome-theme';
export const THEME_LIST = Object.values(THEMES);
