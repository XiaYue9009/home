<script setup>
import HeroMoon from '@/components/home/HeroMoon/index.vue';
import InteractiveDemo from '@/components/home/InteractiveDemo/index.vue';
import PostCard from '@/components/post/PostCard/index.vue';
import CategoryIcon from '@/components/CategoryIcon/index.vue';
import { SITE, CATEGORIES } from '@/config/consts';
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
        <RouterLink to="/tech" class="btn-primary">浏览技术贴</RouterLink>
        <RouterLink to="/about" class="btn-ghost">关于本站</RouterLink>
      </div>
    </div>
  </section>

  <section class="mx-auto max-w-6xl px-4 py-12 sm:px-6">
    <h2 class="mb-6 font-display text-2xl font-bold text-heading">分类</h2>
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <RouterLink
        v-for="[key, cat] in Object.entries(CATEGORIES)"
        :key="key"
        :to="`/${key}`"
        class="glass-card glass-card-hover group p-6 transition"
      >
        <CategoryIcon :category="key" size="md" />
        <h3 class="mt-3 font-display text-xl font-semibold" :class="cat.color">{{ cat.label }}</h3>
        <p class="mt-1 text-sm text-muted group-hover:text-accent-soft">查看全部 →</p>
      </RouterLink>
    </div>
  </section>

  <section class="mx-auto max-w-6xl px-4 py-12 sm:px-6">
    <InteractiveDemo />
  </section>

  <section class="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
    <h2 class="mb-6 font-display text-2xl font-bold text-heading">最新文章</h2>
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <PostCard v-for="post in latestPosts" :key="post.slug" :post="post" />
    </div>
  </section>
</template>

<style scoped>
.hero-section {
  min-height: 420px;
}
</style>
