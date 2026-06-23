<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { DEFAULT_THEME, THEME_LIST, THEME_STORAGE_KEY, type ThemeId } from '../themes';

const current = ref<ThemeId>(DEFAULT_THEME);

function applyTheme(theme: ThemeId) {
  current.value = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  window.dispatchEvent(new CustomEvent('theme-change', { detail: theme }));
}

onMounted(() => {
  const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeId | null;
  const theme = saved && THEME_LIST.some((t) => t.id === saved) ? saved : DEFAULT_THEME;
  applyTheme(theme);
});
</script>

<template>
  <div
    class="flex items-center gap-0.5 rounded-full p-0.5"
    style="background-color: var(--color-glass-bg); border: 1px solid var(--color-border)"
    role="group"
    aria-label="切换主题"
  >
    <button
      v-for="theme in THEME_LIST"
      :key="theme.id"
      type="button"
      class="rounded-full px-2.5 py-1.5 text-xs font-medium transition sm:px-3"
      :class="current === theme.id ? 'nav-link-active shadow-sm' : 'nav-link'"
      :title="theme.label"
      :aria-pressed="current === theme.id"
      @click="applyTheme(theme.id)"
    >
      <span class="sm:mr-1">{{ theme.emoji }}</span>
      <span class="hidden sm:inline">{{ theme.label }}</span>
    </button>
  </div>
</template>
