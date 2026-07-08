<script setup>
import GiscusComments from '@/components/post/GiscusComments/index.vue';
import MotionEnter from '@/components/motion/MotionEnter/index.vue';
import ScrollReveal from '@/components/motion/ScrollReveal/index.vue';
import { CATEGORIES, formatDate, SITE } from '@/config/consts';
import { usePostsStore } from '@/stores/posts.js';
import { renderMarkdown } from '@/lib/content/markdown.js';
import { MOTION_POST, MOTION_STAGGER } from '@/lib/motion/presets.js';

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
      <MotionEnter
        :animation="MOTION_POST.breadcrumb.animation"
        :speed="MOTION_POST.breadcrumb.speed"
      >
        <RouterLink
          :to="`/${post.category}`"
          class="mb-4 inline-flex items-center gap-1.5 text-sm font-medium"
          :class="cat.color"
        >
          <span>{{ cat.emoji }}</span>
          <span>{{ cat.label }}</span>
        </RouterLink>
      </MotionEnter>
      <MotionEnter
        tag="h1"
        class="font-display text-3xl font-bold tracking-tight text-heading sm:text-4xl"
        :animation="MOTION_POST.title.animation"
        :delay="MOTION_POST.title.delay"
      >
        {{ post.title }}
      </MotionEnter>
      <MotionEnter
        tag="p"
        class="mt-3 text-muted"
        :animation="MOTION_POST.description.animation"
        :delay="MOTION_POST.description.delay"
      >
        {{ post.description }}
      </MotionEnter>
      <MotionEnter
        tag="time"
        class="mt-4 block text-sm text-subtle"
        :datetime="post.pubDate"
        :animation="MOTION_POST.date.animation"
        :delay="MOTION_POST.date.delay"
        :speed="MOTION_POST.date.speed"
      >
        {{ formatDate(new Date(post.pubDate)) }}
      </MotionEnter>
      <ul v-if="post.tags?.length" class="mt-4 flex flex-wrap gap-2">
        <MotionEnter
          v-for="(tag, index) in post.tags"
          :key="tag"
          tag="li"
          class="tag-pill rounded-full border border-theme px-3 py-1 text-xs"
          :animation="MOTION_POST.tags.animation"
          :delay="MOTION_POST.tags.delay + index * MOTION_STAGGER.tag"
        >
          #{{ tag }}
        </MotionEnter>
      </ul>
    </header>

    <ScrollReveal
      class="prose-moon"
      :animation="MOTION_POST.body.animation"
      :delay="MOTION_POST.body.delay"
    >
      <div v-html="html" />
    </ScrollReveal>

    <section class="mt-16 border-t border-theme pt-10">
      <ScrollReveal
        tag="h2"
        class="mb-6 font-display text-xl font-semibold text-heading"
        :animation="MOTION_POST.commentsTitle.animation"
        :speed="MOTION_POST.commentsTitle.speed"
      >
        评论
      </ScrollReveal>
      <ScrollReveal :animation="MOTION_POST.comments.animation">
        <GiscusComments />
      </ScrollReveal>
    </section>
  </article>

  <div v-else class="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
    <MotionEnter
      tag="p"
      class="text-muted"
      :animation="MOTION_POST.notFound.animation"
    >
      文章不存在。
    </MotionEnter>
    <MotionEnter animation="backInUp" :delay="200">
      <RouterLink to="/" class="btn-primary mt-8 inline-flex">返回首页</RouterLink>
    </MotionEnter>
  </div>
</template>
