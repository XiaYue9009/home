<script setup>
import { SITE } from '../../../config/consts';
import ScrollReveal from '@/components/motion/ScrollReveal/index.vue';
import { MOTION_LAYOUT } from '@/lib/motion/presets.js';

const year = new Date().getFullYear();
</script>

<template>
  <ScrollReveal
    tag="footer"
    class="border-t border-theme py-8"
    :animation="MOTION_LAYOUT.footer.animation"
    :threshold="0.05"
    root-margin="0px 0px 0px 0px"
  >
    <div class="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 text-center text-sm text-subtle sm:px-6">
      <p class="text-muted">
        © {{ year }} {{ SITE.title }} · 用
        <a href="https://vitejs.dev" target="_blank" rel="noopener noreferrer" class="text-link">
          Vite
        </a>
        + Vue 构建
      </p>
      <p class="text-xs text-subtle">生活 · 技术 · 游戏</p>
    </div>
  </ScrollReveal>
</template>
