<script setup>
import HeroMoon from '@/components/home/HeroMoon/index.vue';
import LottieDemo from '@/components/home/LottieDemo/index.vue';
import SiteAbout from '@/components/home/SiteAbout/index.vue';
import PostCard from '@/components/post/PostCard/index.vue';
import CategoryIcon from '@/components/CategoryIcon/index.vue';
import MotionEnter from '@/components/motion/MotionEnter/index.vue';
import ScrollReveal from '@/components/motion/ScrollReveal/index.vue';
import { SITE, CATEGORIES } from '@/config/consts';
import { NAV_CATEGORY_PORTAL } from '@/config/nav.js';
import {
  MOTION_HERO,
  MOTION_HOME,
  MOTION_STAGGER,
  ENTRANCE_POOL,
  pickCycleAnimation,
} from '@/lib/motion/presets.js';
import { triggerAnimate } from '@/lib/motion/trigger.js';
import { usePostsStore } from '@/stores/posts.js';
import PostgradHomeSection from '@/components/postgrad/PostgradHomeSection/index.vue';

const postsStore = usePostsStore();
const latestPosts = computed(() => postsStore.latest(6));
const categoryEntries = computed(() => Object.entries(CATEGORIES));

function pulseCta(event) {
  triggerAnimate(event.currentTarget, 'pulse', { speed: 'faster' });
}
</script>

<template>
  <section class="hero-section relative overflow-hidden">
    <HeroMoon />
    <div class="relative mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
      <MotionEnter
        tag="p"
        class="mb-4 text-sm font-medium uppercase tracking-widest text-accent"
        :animation="MOTION_HERO.badge.animation"
        :delay="MOTION_HERO.badge.delay"
      >
        Personal Site
      </MotionEnter>
      <MotionEnter
        tag="h1"
        class="font-display text-4xl font-bold tracking-tight text-heading sm:text-6xl"
        :animation="MOTION_HERO.title.animation"
        :delay="MOTION_HERO.title.delay"
      >
        {{ SITE.title }}
      </MotionEnter>
      <MotionEnter
        tag="p"
        class="mt-6 max-w-2xl text-lg text-muted"
        :animation="MOTION_HERO.description.animation"
        :delay="MOTION_HERO.description.delay"
      >
        {{ SITE.description }}
      </MotionEnter>
      <MotionEnter
        class="mt-8 flex flex-wrap gap-3"
        :animation="MOTION_HERO.cta.animation"
        :delay="MOTION_HERO.cta.delay"
      >
        <RouterLink
          to="/upcoming"
          class="btn-primary"
          @mouseenter="pulseCta"
        >
          后续优化
        </RouterLink>
      </MotionEnter>
    </div>
  </section>

  <section class="page-shell">
    <ScrollReveal
      tag="h2"
      class="mb-6 font-display text-2xl font-bold text-heading"
      :animation="MOTION_HOME.portalTitle.animation"
      :speed="MOTION_HOME.portalTitle.speed"
    >
      {{ NAV_CATEGORY_PORTAL.sectionLabel }}
    </ScrollReveal>
    <div class="home-category-grid">
      <ScrollReveal
        v-for="([key, cat], index) in categoryEntries"
        :key="key"
        :animation="pickCycleAnimation(index, ENTRANCE_POOL.categoryCard)"
        :delay="index * MOTION_STAGGER.card"
      >
        <RouterLink
          :to="`/${key}`"
          class="home-category-card glass-card"
          :data-category="key"
        >
          <div class="home-category-card__main">
            <span class="home-category-card__icon-wrap">
              <CategoryIcon :category="key" size="md" />
            </span>
            <h3 class="home-category-card__title font-display text-xl font-semibold" :class="cat.color">
              {{ cat.label }}
            </h3>
            <p class="home-category-card__action text-sm text-muted">
              <span>查看全部</span>
              <span class="home-category-card__arrow" aria-hidden="true">→</span>
            </p>
          </div>
          <div class="home-category-card__aside">
            <p class="home-category-card__desc">
              {{ cat.description }}
            </p>
          </div>
        </RouterLink>
      </ScrollReveal>
    </div>
  </section>

  <PostgradHomeSection />

  <section class="page-shell">
    <ScrollReveal :animation="MOTION_HOME.demo.animation">
      <LottieDemo />
    </ScrollReveal>
  </section>

  <section class="page-shell page-shell--section">
    <ScrollReveal
      tag="h2"
      class="mb-6 font-display text-2xl font-bold text-heading"
      :animation="MOTION_HOME.postsTitle.animation"
      :speed="MOTION_HOME.postsTitle.speed"
    >
      最新文章
    </ScrollReveal>
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <ScrollReveal
        v-for="(post, index) in latestPosts"
        :key="post.slug"
        :animation="pickCycleAnimation(index, ENTRANCE_POOL.post)"
        :delay="index * MOTION_STAGGER.post"
      >
        <PostCard :post="post" />
      </ScrollReveal>
    </div>
  </section>

  <ScrollReveal :animation="MOTION_HOME.about.animation">
    <SiteAbout />
  </ScrollReveal>
</template>

<style scoped lang="scss">
.hero-section {
  min-height: 420px;
}

.home-category-grid {
  --home-card-desc-width: 8.75rem;

  display: grid;
  width: 100%;
  gap: 1.25rem;
  grid-template-columns: repeat(3, minmax(0, 1fr));

  > :deep(.motion-animate) {
    display: flex;
    min-width: 0;
  }

  > :deep(.motion-animate:not(.motion-await)) .home-category-card__desc {
    animation: home-card-desc-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
    animation-delay: 160ms;
  }
}

.home-category-card {
  --card-accent: var(--color-accent);
  --card-accent-soft: color-mix(in srgb, var(--card-accent) 18%, transparent);

  position: relative;
  display: flex;
  flex-direction: row;
  align-items: stretch;
  gap: 1rem;
  width: 100%;
  min-height: 7.5rem;
  padding: 1.15rem 1.25rem;
  overflow: hidden;
  text-decoration: none;
  border-radius: 1rem;
  isolation: isolate;
  transition:
    box-shadow 0.4s cubic-bezier(0.22, 1, 0.36, 1),
    border-color 0.35s ease,
    background-color 0.35s ease;

  &[data-category='life'] {
    --card-accent: #34d399;
  }

  &[data-category='tech'] {
    --card-accent: #38bdf8;
  }

  &[data-category='travel'] {
    --card-accent: #fbbf24;
  }

  &[data-category='lol'] {
    --card-accent: #a78bfa;
  }

  &[data-category='upcoming'] {
    --card-accent: #fb7185;
  }

  &[data-category='tools'] {
    --card-accent: #6366f1;
  }

  &[data-category='stack'] {
    --card-accent: #2dd4bf;
  }

  &[data-category='postgrad'] {
    --card-accent: #c084fc;
  }

  &__main {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.45rem;
    flex: 1;
    min-width: 0;
  }

  &__aside {
    position: relative;
    z-index: 1;
    display: flex;
    flex: 0 0 var(--home-card-desc-width);
    align-items: center;
    width: var(--home-card-desc-width);
    min-width: var(--home-card-desc-width);
    padding: 0.15rem 0;
  }

  &__desc {
    width: 100%;
    min-height: 2.75rem;
    margin: 0;
    padding: 0.55rem 0.65rem;
    font-size: 0.72rem;
    line-height: 1.6;
    letter-spacing: 0.02em;
    color: var(--color-text-muted);
    text-align: left;
    background: color-mix(in srgb, var(--card-accent) 6%, var(--color-glass-bg));
    border: 1px solid color-mix(in srgb, var(--card-accent) 10%, transparent);
    border-radius: 0.625rem;
    opacity: 0;
    display: -webkit-box;
    overflow: hidden;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    transition:
      color 0.3s ease,
      background-color 0.3s ease,
      border-color 0.3s ease;
  }

  &:hover &__desc {
    color: var(--color-text);
    background: color-mix(in srgb, var(--card-accent) 9%, var(--color-glass-bg));
    border-color: color-mix(in srgb, var(--card-accent) 16%, transparent);
  }

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 2px;
    background: conic-gradient(
      from 0deg at 50% 50%,
      transparent 0deg,
      transparent 232deg,
      color-mix(in srgb, var(--card-accent) 12%, transparent) 258deg,
      color-mix(in srgb, var(--card-accent) 45%, transparent) 278deg,
      var(--card-accent) 292deg,
      color-mix(in srgb, var(--card-accent) 92%, white) 300deg,
      color-mix(in srgb, var(--card-accent) 55%, transparent) 308deg,
      color-mix(in srgb, var(--card-accent) 12%, transparent) 322deg,
      transparent 348deg,
      transparent 360deg
    );
    -webkit-mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    mask-composite: exclude;
    opacity: 0;
    pointer-events: none;
    z-index: 2;
    transition: opacity 0.45s ease;
    will-change: transform;
  }

  &:hover::before {
    opacity: 1;
    animation: home-card-border-spin 3.6s linear infinite;
  }

  &::after {
    content: '';
    position: absolute;
    left: 1.25rem;
    right: 1.25rem;
    bottom: 0;
    height: 2px;
    border-radius: 2px 2px 0 0;
    background: linear-gradient(90deg, var(--card-accent), color-mix(in srgb, var(--card-accent) 55%, white));
    transform: scaleX(0);
    transform-origin: left center;
    transition: transform 0.45s cubic-bezier(0.22, 1, 0.36, 1);
    z-index: 3;
  }

  &:hover {
    border-color: color-mix(in srgb, var(--card-accent) 22%, transparent);
    background-color: color-mix(in srgb, var(--color-glass-bg) 96%, var(--card-accent) 4%);
    box-shadow:
      0 10px 28px -12px color-mix(in srgb, var(--card-accent) 32%, transparent),
      0 0 0 1px color-mix(in srgb, var(--card-accent) 10%, transparent),
      0 0 24px -6px color-mix(in srgb, var(--card-accent) 28%, transparent);

    &::after {
      transform: scaleX(1);
    }
  }

  &:focus-visible {
    outline: 2px solid color-mix(in srgb, var(--card-accent) 55%, transparent);
    outline-offset: 3px;
  }

  &__icon-wrap {
    position: relative;
    z-index: 1;
    display: inline-flex;
    transition: transform 0.45s cubic-bezier(0.22, 1, 0.36, 1);
  }

  &:hover &__icon-wrap {
    transform: translateY(-2px);
  }

  :deep(.category-icon) {
    transition: transform 0.45s cubic-bezier(0.22, 1, 0.36, 1);
  }

  &:hover :deep(.category-icon) {
    transform: scale(1.05);
  }

  &__title {
    position: relative;
    z-index: 1;
    margin: 0;
    line-height: 1.25;
    font-size: 1rem;
  }

  &__action {
    position: relative;
    z-index: 1;
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    margin: auto 0 0;
    padding-top: 0.15rem;
    font-size: 0.75rem;
    letter-spacing: 0.01em;
    transition: color 0.3s ease;
  }

  &:hover &__action {
    color: var(--card-accent);
  }

  &__arrow {
    display: inline-block;
    opacity: 0.55;
    transition:
      transform 0.4s cubic-bezier(0.22, 1, 0.36, 1),
      opacity 0.3s ease;
  }

  &:hover &__arrow {
    opacity: 1;
    transform: translateX(4px);
  }

  @media (min-width: 640px) {
    padding: 1.35rem 1.5rem;
    min-height: 8rem;

    &__desc {
      min-height: 2.95rem;
      font-size: 0.78rem;
      padding: 0.6rem 0.7rem;
    }

    &__action {
      font-size: 0.8125rem;
    }

    &__title {
      font-size: 1.25rem;
    }

    &::after {
      left: 1.5rem;
      right: 1.5rem;
    }
  }
}

@keyframes home-card-desc-in {
  from {
    opacity: 0;
    transform: translateY(6px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes home-card-border-spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .home-category-card {
    &:hover::before {
      animation: none;
      transform: rotate(42deg);
      opacity: 0.75;
    }

    &::after {
      transition: none;
    }

    &:hover::after {
      transform: scaleX(1);
    }

    &:hover &__icon-wrap,
    &:hover :deep(.category-icon),
    &:hover &__arrow {
      transform: none;
    }
  }

  .home-category-grid > :deep(.motion-animate:not(.motion-await)) .home-category-card__desc {
    animation: none;
    opacity: 1;
    transform: none;
  }
}
</style>
