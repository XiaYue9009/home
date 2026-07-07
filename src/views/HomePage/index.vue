<script setup>
import HeroMoon from '@/components/home/HeroMoon/index.vue';
import InteractiveDemo from '@/components/home/InteractiveDemo/index.vue';
import SiteAbout from '@/components/home/SiteAbout/index.vue';
import SiteGithub from '@/components/home/SiteGithub/index.vue';
import PostCard from '@/components/post/PostCard/index.vue';
import CategoryIcon from '@/components/CategoryIcon/index.vue';
import { SITE, CATEGORIES } from '@/config/consts';
import { NAV_CATEGORY_PORTAL } from '@/config/nav.js';
import { usePostsStore } from '@/stores/posts.js';

const postsStore = usePostsStore();
const latestPosts = computed(() => postsStore.latest(6));
</script>

<template>
  <section class="hero-section relative overflow-hidden">
    <HeroMoon />
    <div class="relative mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
      <p class="mb-4 text-sm font-medium uppercase tracking-widest text-accent">Personal Site</p>
      <h1 class="font-display text-4xl font-bold tracking-tight text-heading sm:text-6xl">
        {{ SITE.title }}
      </h1>
      <p class="mt-6 max-w-2xl text-lg text-muted">{{ SITE.description }}</p>
      <div class="mt-8 flex flex-wrap gap-3">
        <RouterLink to="/upcoming" class="btn-primary">后续优化</RouterLink>
      </div>
    </div>
  </section>

  <section class="page-shell">
    <h2 class="mb-6 font-display text-2xl font-bold text-heading">{{ NAV_CATEGORY_PORTAL.sectionLabel }}</h2>
    <div class="home-category-grid">
      <RouterLink
        v-for="[key, cat] in Object.entries(CATEGORIES)"
        :key="key"
        :to="`/${key}`"
        class="home-category-card glass-card glass-card-hover group transition"
      >
        <CategoryIcon :category="key" size="md" />
        <h3 class="mt-3 font-display text-xl font-semibold" :class="cat.color">{{ cat.label }}</h3>
        <p class="mt-1 text-sm text-muted group-hover:text-accent-soft">查看全部 →</p>
      </RouterLink>
    </div>
  </section>

  <section class="page-shell">
    <InteractiveDemo />
  </section>

  <section class="page-shell page-shell--section">
    <h2 class="mb-6 font-display text-2xl font-bold text-heading">最新文章</h2>
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <PostCard v-for="post in latestPosts" :key="post.slug" :post="post" />
    </div>
  </section>

  <SiteAbout />
  <SiteGithub />
</template>

<style scoped lang="scss">
.hero-section {
  min-height: 420px;
}

.home-category-grid {
  display: grid;
  width: 100%;
  gap: 1.25rem;
  grid-template-columns: minmax(0, 1fr);

  @media (min-width: 640px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}

.home-category-card {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 9.5rem;
  padding: 1.5rem;

  @media (min-width: 640px) {
    padding: 1.75rem;
  }
}
</style>
