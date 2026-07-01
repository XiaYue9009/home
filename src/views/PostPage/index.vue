<script setup>
import GiscusComments from '@/components/post/GiscusComments/index.vue';
import { CATEGORIES, formatDate, SITE } from '@/config/consts';
import { usePostsStore } from '@/stores/posts.js';
import { renderMarkdown } from '@/lib/content/markdown.js';

const props = defineProps({
  slug: { type: String, required: true },
});

const postsStore = usePostsStore();
const post = computed(() => postsStore.bySlug(props.slug));
const cat = computed(() => (post.value ? CATEGORIES[post.value.category] : null));
const html = computed(() => (post.value ? renderMarkdown(post.value.body) : ''));

watch(
  () => post.value?.title,
  (title) => {
    if (title) document.title = `${title} · ${SITE.title}`;
  },
  { immediate: true },
);
</script>

<template>
  <article v-if="post" class="mx-auto max-w-3xl px-4 py-12 sm:px-6">
    <header class="mb-10">
      <RouterLink
        :to="`/${post.category}`"
        class="mb-4 inline-flex items-center gap-1.5 text-sm font-medium"
        :class="cat.color"
      >
        <span>{{ cat.emoji }}</span>
        <span>{{ cat.label }}</span>
      </RouterLink>
      <h1 class="font-display text-3xl font-bold tracking-tight text-heading sm:text-4xl">
        {{ post.title }}
      </h1>
      <p class="mt-3 text-muted">{{ post.description }}</p>
      <time :datetime="post.pubDate" class="mt-4 block text-sm text-subtle">
        {{ formatDate(new Date(post.pubDate)) }}
      </time>
      <ul v-if="post.tags?.length" class="mt-4 flex flex-wrap gap-2">
        <li v-for="tag in post.tags" :key="tag" class="tag-pill rounded-full border border-theme px-3 py-1 text-xs">
          #{{ tag }}
        </li>
      </ul>
    </header>

    <div class="prose-moon" v-html="html" />

    <section class="mt-16 border-t border-theme pt-10">
      <h2 class="mb-6 font-display text-xl font-semibold text-heading">评论</h2>
      <GiscusComments />
    </section>
  </article>

  <div v-else class="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
    <p class="text-muted">文章不存在。</p>
    <RouterLink to="/" class="btn-primary mt-8 inline-flex">返回首页</RouterLink>
  </div>
</template>
