<script setup>
import MotionEnter from '@/components/motion/MotionEnter/index.vue';
import ScrollReveal from '@/components/motion/ScrollReveal/index.vue';
import { CATEGORIES, SITE } from '@/config/consts';
import { getStackLink, getStackGroupLabel } from '@/config/stack.js';
import { MOTION_POST, MOTION_STAGGER } from '@/lib/motion/presets.js';

const props = defineProps({
  stackKey: { type: String, required: true },
});

const stackCat = CATEGORIES.stack;
const item = computed(() => getStackLink(props.stackKey));
const groupLabel = computed(() => (item.value ? getStackGroupLabel(item.value.group) : ''));

watch(
  () => item.value?.label,
  (label) => {
    document.title = label ? `${label} · ${stackCat.label} · ${SITE.title}` : SITE.title;
  },
  { immediate: true },
);
</script>

<template>
  <div v-if="item" class="page-shell page-shell--stack-detail">
    <header class="stack-detail-header mb-10">
      <MotionEnter
        :animation="MOTION_POST.breadcrumb.animation"
        :speed="MOTION_POST.breadcrumb.speed"
      >
        <RouterLink to="/stack" class="stack-detail-back text-sm font-medium" :class="stackCat.color">
          <span>{{ stackCat.emoji }}</span>
          <span>{{ stackCat.label }}</span>
        </RouterLink>
      </MotionEnter>

      <MotionEnter
        class="stack-detail-title-row"
        :animation="MOTION_POST.title.animation"
        :delay="MOTION_POST.title.delay"
      >
        <span class="stack-detail-emoji" aria-hidden="true">{{ item.emoji }}</span>
        <h1 class="font-display text-3xl font-bold tracking-tight text-heading sm:text-4xl">
          {{ item.label }}
        </h1>
      </MotionEnter>

      <MotionEnter
        tag="p"
        class="mt-3 text-muted"
        :animation="MOTION_POST.description.animation"
        :delay="MOTION_POST.description.delay"
      >
        {{ item.role }}
        <span v-if="groupLabel" class="text-subtle"> · {{ groupLabel }}</span>
      </MotionEnter>

      <MotionEnter
        class="mt-5"
        animation="fadeInUp"
        :delay="360"
      >
        <a
          :href="item.href"
          target="_blank"
          rel="noopener noreferrer"
          class="btn-ghost text-sm"
          :style="{ '--card-accent': item.accent }"
        >
          打开官网 ↗
        </a>
      </MotionEnter>
    </header>

    <ScrollReveal
      class="stack-detail-section glass-card"
      :animation="MOTION_POST.body.animation"
      :delay="MOTION_POST.body.delay"
    >
      <h2 class="stack-detail-section__title font-display text-xl font-semibold text-heading">
        在本项目中的作用
      </h2>
      <p class="stack-detail-section__lead text-muted">{{ item.summary }}</p>
      <ul class="stack-detail-list">
        <li v-for="(usage, index) in item.usages" :key="`usage-${index}`">
          {{ usage }}
        </li>
      </ul>
    </ScrollReveal>

    <ScrollReveal
      class="stack-detail-section glass-card"
      :animation="MOTION_POST.body.animation"
      :delay="MOTION_POST.body.delay + 80"
    >
      <h2 class="stack-detail-section__title font-display text-xl font-semibold text-heading">
        本地连接与接入
      </h2>
      <ol class="stack-detail-list stack-detail-list--ordered">
        <li v-for="(step, index) in item.setup" :key="`setup-${index}`">
          {{ step }}
        </li>
      </ol>
    </ScrollReveal>

    <ScrollReveal
      v-if="item.relatedPaths?.length"
      class="stack-detail-section glass-card"
      :animation="MOTION_POST.body.animation"
      :delay="MOTION_POST.body.delay + 160"
    >
      <h2 class="stack-detail-section__title font-display text-xl font-semibold text-heading">
        相关代码
      </h2>
      <ul class="stack-detail-paths">
        <MotionEnter
          v-for="(path, index) in item.relatedPaths"
          :key="path"
          tag="li"
          :animation="MOTION_POST.tags.animation"
          :delay="MOTION_POST.tags.delay + index * MOTION_STAGGER.tag"
        >
          <code>{{ path }}</code>
        </MotionEnter>
      </ul>
    </ScrollReveal>
  </div>

  <div v-else class="page-shell mx-auto max-w-3xl py-24 text-center">
    <MotionEnter tag="p" class="text-muted" :animation="MOTION_POST.notFound.animation">
      未找到该技术栈条目。
    </MotionEnter>
    <MotionEnter animation="backInUp" :delay="200">
      <RouterLink to="/stack" class="btn-primary mt-8 inline-flex">返回技术栈</RouterLink>
    </MotionEnter>
  </div>
</template>

<style scoped lang="scss">
.stack-detail-back {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 1rem;
  text-decoration: none;

  &:hover {
    opacity: 0.85;
  }
}

.stack-detail-title-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;

  h1 {
    margin: 0;
    min-width: 0;
  }
}

.stack-detail-emoji {
  flex-shrink: 0;
  font-size: 2.25rem;
  line-height: 1;
}

.stack-detail-section {
  margin-bottom: 1.25rem;
  padding: 1.35rem 1.5rem;
  border-radius: 1rem;

  &__title {
    margin: 0 0 0.75rem;
  }

  &__lead {
    margin: 0 0 1rem;
    line-height: 1.65;
  }
}

.stack-detail-list {
  margin: 0;
  padding-left: 1.15rem;
  color: var(--color-text-muted);
  line-height: 1.7;

  li + li {
    margin-top: 0.45rem;
  }

  &--ordered {
    list-style: decimal;
  }
}

.stack-detail-paths {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  margin: 0;
  padding: 0;
  list-style: none;

  code {
    display: inline-block;
    padding: 0.2rem 0.5rem;
    border-radius: 0.4rem;
    font-size: 0.8125rem;
    color: var(--color-accent-soft, var(--color-text-heading));
    background: color-mix(in srgb, var(--color-glass-bg) 70%, transparent);
    border: 1px solid color-mix(in srgb, var(--color-border, currentColor) 35%, transparent);
  }
}
</style>
