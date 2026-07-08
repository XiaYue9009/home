<script setup>
import LottiePlayer from '@/components/motion/LottiePlayer/index.vue';
import { LOTTIE_DEMOS } from '@/lib/lottie/demos.js';

const speedMap = ref(
  Object.fromEntries(
    LOTTIE_DEMOS.filter((d) => d.controls === 'speed').map((d) => [d.id, d.defaultSpeed ?? 1]),
  ),
);

const playerRefs = ref({});

function setPlayerRef(id, el) {
  if (el) playerRefs.value[id] = el;
}

function playOnce(id) {
  const player = playerRefs.value[id];
  player?.stop?.();
  player?.play?.();
}
</script>

<template>
  <section class="lottie-demo glass-card p-6 sm:p-8">
    <header class="lottie-demo__header">
      <div>
        <p class="lottie-demo__eyebrow text-sm text-muted">LottieFiles · dotLottie</p>
        <h2 class="font-display text-xl font-bold text-heading sm:text-2xl">矢量动画 Demo</h2>
        <p class="mt-2 max-w-2xl text-sm text-muted">
          基于
          <a
            href="https://lottiefiles.com/what-is-lottie"
            target="_blank"
            rel="noopener noreferrer"
            class="text-link"
          >Lottie</a>
          格式 — 体积小、可缩放、支持交互。可在
          <a
            href="https://app.lottiefiles.com/"
            target="_blank"
            rel="noopener noreferrer"
            class="text-link"
          >LottieFiles 编辑器</a>
          创作后导出 JSON / .lottie 使用。
        </p>
      </div>
    </header>

    <div class="lottie-demo__grid">
      <article
        v-for="demo in LOTTIE_DEMOS"
        :key="demo.id"
        class="lottie-demo__card"
      >
        <div class="lottie-demo__stage">
          <LottiePlayer
            :ref="(el) => setPlayerRef(demo.id, el)"
            :src="demo.src"
            :autoplay="demo.autoplay"
            :loop="demo.loop"
            :play-on-hover="demo.playOnHover"
            :speed="speedMap[demo.id] ?? 1"
            :aria-label="demo.title"
          />
        </div>

        <div class="lottie-demo__meta">
          <h3 class="font-display text-base font-semibold text-heading">{{ demo.title }}</h3>
          <p class="mt-1 text-xs text-muted">{{ demo.description }}</p>

          <button
            v-if="demo.controls === 'play-once'"
            type="button"
            class="btn-primary mt-3 text-xs"
            @click="playOnce(demo.id)"
          >
            播放成功动画
          </button>

          <label
            v-else-if="demo.controls === 'speed'"
            class="lottie-demo__speed mt-3"
          >
            <span class="text-xs text-subtle">速度 {{ speedMap[demo.id]?.toFixed(1) }}x</span>
            <input
              v-model.number="speedMap[demo.id]"
              type="range"
              min="0.25"
              max="2.5"
              step="0.25"
            />
          </label>

          <p v-else-if="demo.playOnHover" class="mt-3 text-xs text-accent-soft">
            将鼠标移入上方区域
          </p>
          <p v-else-if="demo.autoplay && demo.loop" class="mt-3 text-xs text-subtle">
            自动循环播放中
          </p>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped lang="scss">
.lottie-demo {
  &__header {
    margin-bottom: 1.5rem;
  }

  &__eyebrow {
    margin-bottom: 0.35rem;
    letter-spacing: 0.06em;
  }

  &__grid {
    display: grid;
    gap: 1rem;
    grid-template-columns: minmax(0, 1fr);

    @media (min-width: 640px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  &__card {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1rem;
    border-radius: 1rem;
    border: 1px solid var(--color-glass-border);
    background: color-mix(in srgb, var(--color-glass-bg) 92%, var(--color-accent) 8%);
    transition: border-color 0.3s ease, box-shadow 0.3s ease;

    &:hover {
      border-color: color-mix(in srgb, var(--color-accent) 24%, var(--color-glass-border));
      box-shadow: 0 8px 24px -12px color-mix(in srgb, var(--color-accent) 18%, transparent);
    }
  }

  &__stage {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 8.5rem;
    border-radius: 0.75rem;
    background: color-mix(in srgb, var(--color-bg) 55%, transparent);
    border: 1px dashed color-mix(in srgb, var(--color-border) 80%, transparent);
  }

  &__speed {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;

    input[type='range'] {
      width: 100%;
      accent-color: var(--color-accent);
    }
  }
}
</style>
