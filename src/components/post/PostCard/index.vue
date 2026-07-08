<template>
  <RouterLink
    :to="`/posts/${post.slug}`"
    class="glass-card glass-card-hover motion-hover-lift group block p-6 transition"
  >
    <div class="mb-3 flex items-center justify-between gap-2">
      <span
        class="inline-flex items-center gap-1 text-xs font-medium"
        :class="CATEGORIES[post.category].color"
      >
        <span>{{ CATEGORIES[post.category].emoji }}</span>
        <span>{{ CATEGORIES[post.category].label }}</span>
      </span>
      <time :datetime="post.pubDate" class="text-xs text-subtle">
        {{ formatDate(new Date(post.pubDate)) }}
      </time>
    </div>
    <h2
      class="font-display text-lg font-semibold text-heading transition group-hover:text-accent-soft"
    >
      {{ post.title }}
    </h2>
    <p class="mt-2 line-clamp-2 text-sm text-muted">{{ post.description }}</p>
    <ul v-if="post.tags?.length" class="mt-4 flex flex-wrap gap-1.5">
      <li
        v-for="tag in post.tags.slice(0, 3)"
        :key="tag"
        class="tag-pill rounded-md px-2 py-0.5 text-xs"
      >
        #{{ tag }}
      </li>
    </ul>
  </RouterLink>
</template>
<script setup>
import { formatDate, CATEGORIES } from "@/config/consts";

defineProps({
  post: { type: Object, required: true },
});

const category = ref({
  life: { label: "生活", emoji: "🌿", color: "text-emerald-400" },
  tech: { label: "技术", emoji: "⚡", color: "text-sky-400" },
  lol: { label: "LOL", emoji: "⚔️", color: "text-violet-400" },
});
</script>
