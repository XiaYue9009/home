<script setup>
import PostCard from '@/components/post/PostCard/index.vue';
import CategoryIcon from '@/components/CategoryIcon/index.vue';
import LolHeroCard from '@/components/lol/LolHeroCard/index.vue';
import LolHeroPicker from '@/components/lol/LolHeroPicker/index.vue';
import TravelVideoCard from '@/components/travel/TravelVideoCard/index.vue';
import { CATEGORIES } from '@/config/consts';
import { usePostsStore } from '@/stores/posts.js';
import { useTravelStore } from '@/stores/travel.js';
import { useEditStore } from '@/stores/edit.js';
import { useLolStore } from '@/stores/lol.js';

const props = defineProps({
  category: { type: String, required: true },
});

const postsStore = usePostsStore();
const travelStore = useTravelStore();
const editStore = useEditStore();
const lolStore = useLolStore();
const categoryPosts = computed(() => postsStore.byCategory(props.category));
const cat = computed(() => CATEGORIES[props.category]);

const heroPickerOpen = ref(false);

onMounted(async () => {
  if (props.category === 'travel') {
    await travelStore.load();
    return;
  }

  if (props.category !== 'lol') return;
  await lolStore.loadHeroes();
});

async function handleAddHero(hero) {
  await lolStore.addHero(hero.id);
}
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-12 sm:px-6">
    <header class="mb-10" :class="{ 'category-page-header': category === 'lol' || category === 'travel' }">
      <div v-if="category === 'lol'" class="category-page-header__row">
        <CategoryIcon :category="category" size="lg" />
        <h1 class="font-display text-3xl font-bold" :class="cat.color">{{ cat.label }}</h1>
        <p class="category-page-header__desc text-muted">
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
      <div v-else-if="category === 'travel'" class="category-page-header__row">
        <CategoryIcon :category="category" size="lg" />
        <h1 class="font-display text-3xl font-bold" :class="cat.color">{{ cat.label }}</h1>
        <p class="category-page-header__desc text-muted">
          抖音收藏 ·
          <a
            v-if="travelStore.displayAccount.profileUrl"
            :href="travelStore.displayAccount.profileUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="text-link"
          >
            {{ travelStore.displayAccount.nickname || '我的抖音' }}
          </a>
          <span v-else>实时拉取</span>
          <span v-if="travelStore.displayAccount.syncedAt" class="text-subtle">
            · 更新于 {{ new Date(travelStore.displayAccount.syncedAt).toLocaleDateString('zh-CN') }}
          </span>
        </p>
      </div>
      <template v-else>
        <CategoryIcon :category="category" size="lg" />
        <h1 class="mt-3 font-display text-3xl font-bold" :class="cat.color">{{ cat.label }}</h1>
        <p class="mt-2 text-muted">共 {{ categoryPosts.length }} 篇文章</p>
      </template>
    </header>

    <section v-if="category === 'travel'" class="mb-14">
      <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 class="font-display text-xl font-semibold text-heading">收藏视频</h2>
        <button
          type="button"
          class="btn-ghost text-sm"
          :disabled="travelStore.loading"
          @click="travelStore.load(true)"
        >
          {{ travelStore.loading ? '加载中…' : '刷新' }}
        </button>
      </div>

      <p v-if="travelStore.loading" class="text-muted">正在从抖音加载收藏…</p>

      <div
        v-else-if="travelStore.displayVideos.length"
        class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        <TravelVideoCard
          v-for="video in travelStore.displayVideos"
          :key="video.id"
          :video="video"
        />
      </div>

      <div v-else class="glass-card p-8 text-center">
        <p class="text-muted">暂无收藏视频。</p>
        <p class="mt-2 text-sm text-subtle">
          本地开发请在 .env 配置 <code class="text-accent-soft">DOUYIN_COOKIE</code>，打开
          <code class="text-accent-soft">pnpm dev</code> 后访问本页；线上需部署 Supabase Edge Function
          <code class="text-accent-soft">fetch-douyin-collection</code>。
        </p>
      </div>

      <p v-if="travelStore.error && travelStore.source === 'cache'" class="mt-4 text-sm text-subtle">
        实时加载失败（{{ travelStore.error }}），已显示本地缓存。
      </p>
    </section>

    <section v-if="category === 'lol'" class="mb-14">
      <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 class="font-display text-xl font-semibold text-heading">我的英雄</h2>
        <el-button
          type="primary"
          size="small"
          :disabled="!editStore.canEdit"
          :title="editStore.canEdit ? '新增英雄' : '请先在导航栏解锁编辑'"
          @click="heroPickerOpen = true"
        >
          新增
        </el-button>
      </div>
      <p v-if="lolStore.loading" class="text-muted">加载英雄…</p>
      <div v-else class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <LolHeroCard v-for="hero in lolStore.heroes" :key="hero.id" :hero="hero" />
      </div>
      <LolHeroPicker
        v-model:open="heroPickerOpen"
        title="新增英雄"
        :exclude-ids="lolStore.heroIds"
        @select="handleAddHero"
      />
    </section>

    <section v-if="categoryPosts.length > 0">
      <h2 class="mb-6 font-display text-xl font-semibold text-heading">相关文章</h2>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <PostCard v-for="post in categoryPosts" :key="post.slug" :post="post" />
      </div>
    </section>

    <p v-else-if="category !== 'lol' && category !== 'travel'" class="text-subtle">暂无文章。</p>
  </div>
</template>

<style scoped lang="scss">
.lol-page-header__row,
.category-page-header__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem 1.25rem;

  h1 {
    margin: 0;
    white-space: nowrap;
  }
}

.lol-page-header__desc,
.category-page-header__desc {
  margin: 0;
  font-size: 0.875rem;
  white-space: nowrap;
}

@media (max-width: 767px) {
  .lol-page-header__desc,
  .category-page-header__desc {
    white-space: normal;
    flex: 1 1 100%;
  }
}
</style>
