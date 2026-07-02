<script setup>
import { formatDate } from '@/config/consts';

const props = defineProps({
  video: { type: Object, required: true },
});

function formatCount(value) {
  const num = Number(value) || 0;
  if (num >= 10000) return `${(num / 10000).toFixed(1).replace(/\.0$/, '')}万`;
  return String(num);
}
</script>

<template>
  <a
    :href="video.shareUrl"
    target="_blank"
    rel="noopener noreferrer"
    class="travel-video-card glass-card glass-card-hover group block overflow-hidden transition"
  >
    <div class="travel-video-card__cover relative aspect-[9/16] overflow-hidden bg-black/20">
      <img
        v-if="video.cover"
        :src="video.cover"
        :alt="video.title"
        class="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        loading="lazy"
        decoding="async"
      />
      <div v-else class="flex h-full items-center justify-center text-sm text-subtle">暂无封面</div>
      <span class="travel-video-card__badge">收藏</span>
    </div>

    <div class="p-4">
      <h3 class="line-clamp-2 text-sm font-medium leading-snug text-heading">{{ video.title }}</h3>
      <div class="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-subtle">
        <span v-if="video.playCount">▶ {{ formatCount(video.playCount) }}</span>
        <span v-if="video.diggCount">♥ {{ formatCount(video.diggCount) }}</span>
        <time v-if="video.createTime" :datetime="video.createTime">
          {{ formatDate(new Date(video.createTime)) }}
        </time>
      </div>
      <p class="mt-3 text-xs text-accent-soft opacity-0 transition group-hover:opacity-100">
        在抖音中打开 →
      </p>
    </div>
  </a>
</template>

<style scoped lang="scss">
.travel-video-card {
  &__cover {
    max-height: 360px;
  }

  &__badge {
    position: absolute;
    left: 0.75rem;
    top: 0.75rem;
    border-radius: 9999px;
    padding: 0.125rem 0.625rem;
    font-size: 0.6875rem;
    font-weight: 500;
    color: #fff;
    background: rgb(0 0 0 / 55%);
    backdrop-filter: blur(4px);
  }
}
</style>
