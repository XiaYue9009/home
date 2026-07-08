<script setup>
import { buildAnimateClasses, prefersReducedMotion } from '@/lib/motion/trigger.js';
import { MOTION_LAYOUT } from '@/lib/motion/presets.js';

const props = defineProps({
  animation: { type: String, default: MOTION_LAYOUT.page.animation },
  speed: { type: String, default: MOTION_LAYOUT.page.speed },
});

const active = ref(false);

onMounted(() => {
  if (prefersReducedMotion()) {
    active.value = true;
    return;
  }

  requestAnimationFrame(() => {
    active.value = true;
  });
});

const animateClasses = computed(() => {
  if (!active.value) return [];
  return buildAnimateClasses(props.animation, { speed: props.speed || undefined });
});
</script>

<template>
  <div
    class="motion-page-enter motion-animate"
    :class="[active ? '' : 'motion-await', ...animateClasses]"
  >
    <slot />
  </div>
</template>
