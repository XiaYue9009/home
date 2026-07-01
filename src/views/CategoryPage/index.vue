<script setup>
import PostCard from '@/components/post/PostCard/index.vue';
import CategoryIcon from '@/components/CategoryIcon/index.vue';
import LolHeroCard from '@/components/lol/LolHeroCard/index.vue';
import { CATEGORIES } from '@/config/consts';
import { usePostsStore } from '@/stores/posts.js';
import {
  FEATURED_LOL_HERO_IDS,
  FALLBACK_LOL_HEROES,
  fetchLolHero,
} from '@/lib/lol/index.js';

const props = defineProps({
  category: { type: String, required: true },
});

const postsStore = usePostsStore();
const categoryPosts = computed(() => postsStore.byCategory(props.category));
const cat = computed(() => CATEGORIES[props.category]);

const lolHeroes = ref([]);
const lolLoading = ref(props.category === 'lol');

onMounted(async () => {
  if (props.category !== 'lol') return;

  try {
    lolHeroes.value = await Promise.all(FEATURED_LOL_HERO_IDS.map((id) => fetchLolHero(id)));
  } catch {
    lolHeroes.value = FALLBACK_LOL_HEROES;
  } finally {
    lolLoading.value = false;
  }
});
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-12 sm:px-6">
    <header class="mb-10" :class="{ 'lol-page-header': category === 'lol' }">
      <div v-if="category === 'lol'" class="lol-page-header__row">
        <CategoryIcon :category="category" size="lg" />
        <h1 class="font-display text-3xl font-bold" :class="cat.color">{{ cat.label }}</h1>
        <p class="lol-page-header__desc text-muted">
          常玩英雄展示 · 数据与立绘来自
          <a
            href="https://101.qq.com/#/hero"
            target="_blank"
            rel="noopener noreferrer"
            class="text-link"
          >
            英雄联盟攻略中心
          </a>
        </p>
      </div>
      <template v-else>
        <CategoryIcon :category="category" size="lg" />
        <h1 class="mt-3 font-display text-3xl font-bold" :class="cat.color">{{ cat.label }}</h1>
        <p class="mt-2 text-muted">共 {{ categoryPosts.length }} 篇文章</p>
      </template>
    </header>

    <section v-if="category === 'lol'" class="mb-14">
      <h2 class="mb-6 font-display text-xl font-semibold text-heading">我的英雄</h2>
      <p v-if="lolLoading" class="text-muted">加载英雄…</p>
      <div v-else class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <LolHeroCard v-for="hero in lolHeroes" :key="hero.id" :hero="hero" />
      </div>
    </section>

    <section v-if="categoryPosts.length > 0">
      <h2 class="mb-6 font-display text-xl font-semibold text-heading">相关文章</h2>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <PostCard v-for="post in categoryPosts" :key="post.slug" :post="post" />
      </div>
    </section>

    <p v-else-if="category !== 'lol'" class="text-subtle">暂无文章。</p>
  </div>
</template>

<style scoped lang="scss">
.lol-page-header__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem 1.25rem;

  h1 {
    margin: 0;
    white-space: nowrap;
  }
}

.lol-page-header__desc {
  margin: 0;
  font-size: 0.875rem;
  white-space: nowrap;
}

@media (max-width: 767px) {
  .lol-page-header__desc {
    white-space: normal;
    flex: 1 1 100%;
  }
}
</style>
