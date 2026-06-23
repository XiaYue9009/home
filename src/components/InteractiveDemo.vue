<script setup lang="ts">
import { ref } from 'vue';

const count = ref(0);
const hovering = ref(false);

function ripple(event: MouseEvent) {
  const btn = event.currentTarget as HTMLButtonElement;
  const rect = btn.getBoundingClientRect();
  const rippleEl = document.createElement('span');
  const size = Math.max(rect.width, rect.height);
  rippleEl.style.cssText = `
    position: absolute;
    width: ${size}px;
    height: ${size}px;
    left: ${event.clientX - rect.left - size / 2}px;
    top: ${event.clientY - rect.top - size / 2}px;
    background: color-mix(in srgb, var(--color-accent-text) 35%, transparent);
    border-radius: 50%;
    transform: scale(0);
    animation: ripple 0.6s ease-out forwards;
    pointer-events: none;
  `;
  btn.appendChild(rippleEl);
  setTimeout(() => rippleEl.remove(), 600);
}
</script>

<template>
  <div class="glass-card p-6">
    <p class="mb-4 text-sm text-muted">Vue 交互示例 · 点击按钮体验涟漪效果</p>
    <div class="flex items-center gap-4">
      <button
        type="button"
        class="btn-primary relative overflow-hidden px-6 py-3"
        @click="(e) => { count++; ripple(e); }"
        @mouseenter="hovering = true"
        @mouseleave="hovering = false"
        :class="{ 'animate-glow': hovering }"
      >
        点我 +1
      </button>
      <span class="font-display text-2xl font-bold text-accent-soft">{{ count }}</span>
    </div>
  </div>
</template>

<style scoped>
@keyframes ripple {
  to {
    transform: scale(2.5);
    opacity: 0;
  }
}
</style>
