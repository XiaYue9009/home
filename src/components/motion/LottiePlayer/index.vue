<script setup>
import { DotLottieVue } from '@lottiefiles/dotlottie-vue';

const props = defineProps({
  src: { type: String, required: true },
  autoplay: { type: Boolean, default: false },
  loop: { type: Boolean, default: true },
  playOnHover: { type: Boolean, default: false },
  speed: { type: Number, default: 1 },
  ariaLabel: { type: String, default: 'Lottie 动画' },
});

const playerRef = ref(null);

function play() {
  playerRef.value?.play?.();
}

function pause() {
  playerRef.value?.pause?.();
}

function stop() {
  playerRef.value?.stop?.();
}

defineExpose({ play, pause, stop, playerRef });
</script>

<template>
  <div class="lottie-player" role="img" :aria-label="ariaLabel">
    <DotLottieVue
      ref="playerRef"
      class="lottie-player__canvas"
      :src="src"
      :autoplay="autoplay"
      :loop="loop"
      :play-on-hover="playOnHover"
      :speed="speed"
      :layout="{ fit: 'contain', align: [0.5, 0.5] }"
      :render-config="{ devicePixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 1 }"
    />
  </div>
</template>

<style scoped lang="scss">
.lottie-player {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: 7rem;

  &__canvas {
    width: 100%;
    height: 100%;
    max-height: 9rem;
  }
}
</style>
