<script setup>
import { buildAnimateClasses } from '@/lib/motion/trigger.js';
import { useScrollReveal } from '@/lib/motion/useScrollReveal.js';

const props = defineProps({
  animation: { type: String, default: 'fadeInUp' },
  delay: { type: Number, default: 0 },
  speed: { type: String, default: '' },
  once: { type: Boolean, default: true },
  threshold: { type: Number, default: 0.12 },
  rootMargin: { type: String, default: '0px 0px -6% 0px' },
  tag: { type: String, default: 'div' },
});

const rootRef = ref(null);
const visible = ref(false);

useScrollReveal(rootRef, visible, {
  once: props.once,
  threshold: props.threshold,
  rootMargin: props.rootMargin,
});

const animateClasses = computed(() => {
  if (!visible.value) return [];
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
    :class="[visible ? '' : 'motion-await', ...animateClasses]"
    :style="inlineStyle"
  >
    <slot />
  </component>
</template>
