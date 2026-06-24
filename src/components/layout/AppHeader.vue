<script setup>
import { SITE, CATEGORIES } from '../../config/consts';
import ThemeSwitcher from '../ThemeSwitcher.vue';
import WeatherWidget from '../WeatherWidget.vue';
import SiteLogo from './SiteLogo.vue';

const route = useRoute();

const navLinks = [
  { to: '/', label: '首页' },
  ...Object.entries(CATEGORIES).map(([key, val]) => ({
    to: `/${key}`,
    label: val.label,
  })),
  { to: '/about', label: '关于' },
];

function isActive(to) {
  if (to === '/') {
    return route.path === '/' || route.path === '';
  }
  return route.path === to || route.path.startsWith(`${to}/`);
}
</script>

<template>
  <header class="header-bar">
    <div class="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
      <RouterLink to="/" class="group flex shrink-0 items-center gap-2">
        <SiteLogo />
        <span class="font-display text-lg font-bold tracking-tight text-heading">{{ SITE.title }}</span>
      </RouterLink>

      <nav class="hidden items-center gap-1 md:flex">
        <RouterLink
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          class="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition"
          :class="isActive(link.to) ? 'nav-link-active' : 'nav-link'"
        >
          {{ link.label }}
        </RouterLink>
      </nav>

      <div class="group flex items-center gap-2 sm:gap-3">
        <WeatherWidget />
        <ThemeSwitcher />
        <a
          :href="SITE.github"
          target="_blank"
          rel="noopener noreferrer"
          class="btn-ghost hidden sm:inline-flex"
          aria-label="GitHub"
        >
          GitHub
        </a>
      </div>
    </div>
  </header>
</template>
