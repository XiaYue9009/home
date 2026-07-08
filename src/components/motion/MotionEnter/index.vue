<script setup>
import { buildAnimateClasses, prefersReducedMotion } from '@/lib/motion/trigger.js';

const props = defineProps({
  animation: { type: String, default: 'fadeInUp' },
  delay: { type: Number, default: 0 },
  speed: { type: String, default: '' },
  tag: { type: String, default: 'div' },
});

const rootRef = ref(null);
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

const inlineStyle = computed(() => {
  if (!props.delay) return undefined;
  return { '--animate-delay': `${props.delay}ms` };
});
</script>

<template>
  <component
    :is="tag"
    ref="rootRef"
    class="motion-animate"
    :class="[active ? '' : 'motion-await', ...animateClasses]"
    :style="inlineStyle"
  >
    <slot />
  </component>
</template>
