<script setup>
import MotionEnter from '@/components/motion/MotionEnter/index.vue';
import { MOTION_NOT_FOUND } from '@/lib/motion/presets.js';
import { triggerAnimate } from '@/lib/motion/trigger.js';

function hoverSwing(event) {
  triggerAnimate(event.currentTarget, 'swing', { speed: 'faster' });
}
</script>

<template>
  <div class="mx-auto flex max-w-3xl flex-col items-center px-4 py-24 text-center sm:px-6">
    <MotionEnter
      tag="p"
      class="text-6xl font-bold text-accent sm:text-8xl"
      :animation="MOTION_NOT_FOUND.code.animation"
    >
      404
    </MotionEnter>
    <MotionEnter
      tag="h1"
      class="mt-4 font-display text-2xl font-bold text-heading sm:text-3xl"
      :animation="MOTION_NOT_FOUND.title.animation"
      :delay="MOTION_NOT_FOUND.title.delay"
    >
      页面未找到
    </MotionEnter>
    <MotionEnter
      tag="p"
      class="mt-3 max-w-md text-muted"
      :animation="MOTION_NOT_FOUND.desc.animation"
      :delay="MOTION_NOT_FOUND.desc.delay"
      :speed="MOTION_NOT_FOUND.desc.speed"
    >
      您访问的链接可能已失效，或页面已被移除。
    </MotionEnter>
    <MotionEnter
      :animation="MOTION_NOT_FOUND.cta.animation"
      :delay="MOTION_NOT_FOUND.cta.delay"
    >
      <RouterLink
        to="/"
        class="btn-primary mt-8"
        @mouseenter="hoverSwing"
      >
        返回首页
      </RouterLink>
    </MotionEnter>
  </div>
</template>
