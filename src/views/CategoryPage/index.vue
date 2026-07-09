<script setup>
import PostCard from '@/components/post/PostCard/index.vue';
import CategoryIcon from '@/components/CategoryIcon/index.vue';
import LolHeroCard from '@/components/lol/LolHeroCard/index.vue';
import LolHeroPicker from '@/components/lol/LolHeroPicker/index.vue';
import TravelVideoCard from '@/components/travel/TravelVideoCard/index.vue';
import MotionEnter from '@/components/motion/MotionEnter/index.vue';
import ScrollReveal from '@/components/motion/ScrollReveal/index.vue';
import { CATEGORIES } from '@/config/consts';
import { usePostsStore } from '@/stores/posts.js';
import { useTravelStore } from '@/stores/travel.js';
import { useEditStore } from '@/stores/edit.js';
import { useLolStore } from '@/stores/lol.js';
import UpcomingCardGrid from '@/components/upcoming/UpcomingCardGrid/index.vue';
import SystemToolGrid from '@/components/tools/SystemToolGrid/index.vue';
import StackLinkGrid from '@/components/stack/StackLinkGrid/index.vue';
import {
  MOTION_CATEGORY,
  MOTION_STAGGER,
  ENTRANCE_POOL,
  pickCycleAnimation,
} from '@/lib/motion/presets.js';
import { triggerAnimate } from '@/lib/motion/trigger.js';

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

function refreshPulse(event) {
  if (!travelStore.loading) {
    triggerAnimate(event.currentTarget, 'rubberBand', { speed: 'faster' });
  }
}
</script>

<template>
  <div class="page-shell page-shell--category">
    <header
      class="mb-10"
      :class="{ 'category-page-header': category === 'lol' || category === 'travel' || category === 'upcoming' || category === 'tools' || category === 'stack' }"
    >
      <div v-if="category === 'lol'" class="category-page-header__row">
        <MotionEnter :animation="MOTION_CATEGORY.icon.animation">
          <CategoryIcon :category="category" size="lg" />
        </MotionEnter>
        <MotionEnter
          tag="h1"
          class="font-display text-3xl font-bold"
          :class="cat.color"
          :animation="MOTION_CATEGORY.title.animation"
          :delay="MOTION_CATEGORY.title.delay"
        >
          {{ cat.label }}
        </MotionEnter>
        <MotionEnter
          tag="p"
          class="category-page-header__desc text-muted"
          :animation="MOTION_CATEGORY.desc.animation"
          :delay="MOTION_CATEGORY.desc.delay"
          :speed="MOTION_CATEGORY.desc.speed"
        >
          常玩英雄展示 · 数据与立绘来自
          <a
            href="https://101.qq.com/#/hero"
            target="_blank"
            rel="noopener noreferrer"
            class="text-link"
          >
            英雄联盟攻略中心
          </a>
        </MotionEnter>
      </div>
      <div v-else-if="category === 'travel'" class="category-page-header__row">
        <MotionEnter :animation="MOTION_CATEGORY.icon.animation">
          <CategoryIcon :category="category" size="lg" />
        </MotionEnter>
        <MotionEnter
          tag="h1"
          class="font-display text-3xl font-bold"
          :class="cat.color"
          :animation="MOTION_CATEGORY.title.animation"
          :delay="MOTION_CATEGORY.title.delay"
        >
          {{ cat.label }}
        </MotionEnter>
        <MotionEnter
          tag="p"
          class="category-page-header__desc text-muted"
          :animation="MOTION_CATEGORY.desc.animation"
          :delay="MOTION_CATEGORY.desc.delay"
          :speed="MOTION_CATEGORY.desc.speed"
        >
          抖音收藏夹 · {{ travelStore.collectsKeywords.join(' / ') }} ·
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
        </MotionEnter>
      </div>
      <div v-else-if="category === 'upcoming'" class="category-page-header__row">
        <MotionEnter :animation="MOTION_CATEGORY.icon.animation">
          <CategoryIcon :category="category" size="lg" />
        </MotionEnter>
        <MotionEnter
          tag="h1"
          class="font-display text-3xl font-bold"
          :class="cat.color"
          :animation="MOTION_CATEGORY.title.animation"
          :delay="MOTION_CATEGORY.title.delay"
        >
          {{ cat.label }}
        </MotionEnter>
        <MotionEnter
          tag="p"
          class="category-page-header__desc text-muted"
          :animation="MOTION_CATEGORY.desc.animation"
          :delay="MOTION_CATEGORY.desc.delay"
          :speed="MOTION_CATEGORY.desc.speed"
        >
          富文本编辑 · Typora 风格快捷键 · Ctrl+/ 切换 Markdown
        </MotionEnter>
      </div>
      <div v-else-if="category === 'tools'" class="category-page-header__row">
        <MotionEnter :animation="MOTION_CATEGORY.icon.animation">
          <CategoryIcon :category="category" size="lg" />
        </MotionEnter>
        <MotionEnter
          tag="h1"
          class="font-display text-3xl font-bold"
          :class="cat.color"
          :animation="MOTION_CATEGORY.title.animation"
          :delay="MOTION_CATEGORY.title.delay"
        >
          {{ cat.label }}
        </MotionEnter>
        <MotionEnter
          tag="p"
          class="category-page-header__desc text-muted"
          :animation="MOTION_CATEGORY.desc.animation"
          :delay="MOTION_CATEGORY.desc.delay"
          :speed="MOTION_CATEGORY.desc.speed"
        >
          站内工具能力展示 · 点击卡片查看 Demo、功能点与实现思路
        </MotionEnter>
      </div>
      <div v-else-if="category === 'stack'" class="category-page-header__row">
        <MotionEnter :animation="MOTION_CATEGORY.icon.animation">
          <CategoryIcon :category="category" size="lg" />
        </MotionEnter>
        <MotionEnter
          tag="h1"
          class="font-display text-3xl font-bold"
          :class="cat.color"
          :animation="MOTION_CATEGORY.title.animation"
          :delay="MOTION_CATEGORY.title.delay"
        >
          {{ cat.label }}
        </MotionEnter>
        <MotionEnter
          tag="p"
          class="category-page-header__desc text-muted"
          :animation="MOTION_CATEGORY.desc.animation"
          :delay="MOTION_CATEGORY.desc.delay"
          :speed="MOTION_CATEGORY.desc.speed"
        >
          项目技术栈选用
        </MotionEnter>
      </div>
      <template v-else>
        <MotionEnter :animation="MOTION_CATEGORY.icon.animation">
          <CategoryIcon :category="category" size="lg" />
        </MotionEnter>
        <MotionEnter
          tag="h1"
          class="mt-3 font-display text-3xl font-bold"
          :class="cat.color"
          :animation="MOTION_CATEGORY.title.animation"
          :delay="MOTION_CATEGORY.title.delay"
        >
          {{ cat.label }}
        </MotionEnter>
        <MotionEnter
          tag="p"
          class="mt-2 text-muted"
          :animation="MOTION_CATEGORY.desc.animation"
          :delay="MOTION_CATEGORY.desc.delay"
          :speed="MOTION_CATEGORY.desc.speed"
        >
          共 {{ categoryPosts.length }} 篇文章
        </MotionEnter>
      </template>
    </header>

    <section v-if="category === 'upcoming'" class="mb-14">
      <UpcomingCardGrid />
    </section>

    <section v-if="category === 'tools'" class="mb-14">
      <SystemToolGrid />
    </section>

    <section v-if="category === 'stack'" class="mb-14">
      <StackLinkGrid />
    </section>

    <section v-if="category === 'travel'" class="mb-14">
      <ScrollReveal
        class="mb-6 flex flex-wrap items-center justify-between gap-3"
        :animation="MOTION_CATEGORY.sectionTitle.animation"
        :speed="MOTION_CATEGORY.sectionTitle.speed"
      >
        <h2 class="font-display text-xl font-semibold text-heading">收藏夹</h2>
        <button
          type="button"
          class="btn-ghost text-sm"
          :disabled="travelStore.loading"
          @click="travelStore.load(true)"
          @mouseenter="refreshPulse"
        >
          {{ travelStore.loading ? '加载中…' : '刷新' }}
        </button>
      </ScrollReveal>

      <MotionEnter
        v-if="travelStore.loading"
        tag="p"
        class="text-muted"
        :animation="MOTION_CATEGORY.loading.animation"
        :speed="MOTION_CATEGORY.loading.speed"
      >
        正在从抖音加载「{{ travelStore.collectsKeywords.join(' / ') }}」收藏夹…
      </MotionEnter>

      <template v-else-if="travelStore.hasDisplayContent">
        <div
          v-for="group in travelStore.displayGroups"
          :key="group.keyword"
          class="travel-group mb-12 last:mb-0"
        >
          <ScrollReveal
            class="mb-5"
            :animation="MOTION_CATEGORY.sectionTitle.animation"
            :speed="MOTION_CATEGORY.sectionTitle.speed"
          >
            <h3 class="font-display text-lg font-semibold text-heading">
              {{ group.label }}
              <span class="ml-2 text-sm font-normal text-subtle">
                {{ group.folders.reduce((sum, f) => sum + (f.videos?.length || 0), 0) }} 条
              </span>
            </h3>
          </ScrollReveal>

          <div
            v-if="!group.folders.length"
            class="rounded-lg border border-dashed border-white/10 px-4 py-6 text-sm text-subtle"
          >
            暂无名称含「{{ group.keyword }}」的收藏夹
          </div>

          <div v-else class="space-y-10">
            <div v-for="folder in group.folders" :key="folder.id">
              <ScrollReveal
                class="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1"
                :animation="MOTION_CATEGORY.sectionTitle.animation"
                :speed="MOTION_CATEGORY.sectionTitle.speed"
              >
                <h4 class="text-base font-medium text-heading">{{ folder.name }}</h4>
                <span class="text-xs text-subtle">{{ folder.videos?.length || 0 }} 条视频</span>
              </ScrollReveal>

              <div
                v-if="folder.videos?.length"
                class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              >
                <ScrollReveal
                  v-for="(video, index) in folder.videos"
                  :key="`${folder.id}-${video.id}`"
                  :animation="pickCycleAnimation(index, ENTRANCE_POOL.video)"
                  :delay="index * MOTION_STAGGER.video"
                >
                  <TravelVideoCard :video="video" />
                </ScrollReveal>
              </div>
              <p v-else class="text-sm text-subtle">该收藏夹暂无视频</p>
            </div>
          </div>
        </div>
      </template>

      <ScrollReveal v-else :animation="MOTION_CATEGORY.empty.animation">
        <div class="glass-card p-8 text-center">
          <p class="text-muted">暂无收藏夹视频。</p>
          <p class="mt-2 text-sm text-subtle">
            默认读取名称含「{{ travelStore.collectsKeywords.join(' / ') }}」的收藏夹。本地开发请在 .env 配置
            <code class="text-accent-soft">DOUYIN_COOKIE</code>，打开
            <code class="text-accent-soft">pnpm dev</code> 后访问本页；线上需部署 Supabase Edge Function
            <code class="text-accent-soft">fetch-douyin-collection</code>。
          </p>
        </div>
      </ScrollReveal>

      <p v-if="travelStore.error && travelStore.source === 'cache'" class="mt-4 text-sm text-subtle">
        实时加载失败（{{ travelStore.error }}），已显示本地缓存。
      </p>
    </section>

    <section v-if="category === 'lol'" class="mb-14">
      <ScrollReveal
        class="mb-6 flex flex-wrap items-center justify-between gap-3"
        :animation="MOTION_CATEGORY.sectionTitle.animation"
        :speed="MOTION_CATEGORY.sectionTitle.speed"
      >
        <h2 class="font-display text-xl font-semibold text-heading">我的英雄</h2>
        <el-button
          class="lol-section-add-btn"
          type="primary"
          size="small"
          :disabled="!editStore.canEdit"
          :title="editStore.canEdit ? '新增英雄' : '请先在导航栏解锁编辑'"
          @click="heroPickerOpen = true"
        >
          新增
        </el-button>
      </ScrollReveal>
      <MotionEnter
        v-if="lolStore.loading"
        tag="p"
        class="text-muted"
        :animation="MOTION_CATEGORY.loading.animation"
        :speed="MOTION_CATEGORY.loading.speed"
      >
        加载英雄…
      </MotionEnter>
      <div v-else class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <ScrollReveal
          v-for="(hero, index) in lolStore.heroes"
          :key="hero.id"
          :animation="pickCycleAnimation(index, ENTRANCE_POOL.hero)"
          :delay="index * MOTION_STAGGER.hero"
        >
          <LolHeroCard :hero="hero" />
        </ScrollReveal>
      </div>
      <LolHeroPicker
        v-model:open="heroPickerOpen"
        title="新增英雄"
        :exclude-ids="lolStore.heroIds"
        @select="handleAddHero"
      />
    </section>

    <section v-if="categoryPosts.length > 0">
      <ScrollReveal
        tag="h2"
        class="mb-6 font-display text-xl font-semibold text-heading"
        :animation="MOTION_CATEGORY.sectionTitle.animation"
        :speed="MOTION_CATEGORY.sectionTitle.speed"
      >
        相关文章
      </ScrollReveal>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ScrollReveal
          v-for="(post, index) in categoryPosts"
          :key="post.slug"
          :animation="pickCycleAnimation(index, ENTRANCE_POOL.post)"
          :delay="index * MOTION_STAGGER.post"
        >
          <PostCard :post="post" />
        </ScrollReveal>
      </div>
    </section>

    <MotionEnter
      v-else-if="category !== 'lol' && category !== 'travel' && category !== 'upcoming' && category !== 'tools' && category !== 'stack'"
      tag="p"
      class="text-subtle"
      animation="fadeIn"
      speed="fast"
    >
      暂无文章。
    </MotionEnter>
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

:deep(.lol-section-add-btn) {
  transition:
    transform 0.32s cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 0.32s ease;

  &:not(.is-disabled):hover {
    transform: translateY(-2px) scale(1.03);
    box-shadow: 0 8px 20px -6px color-mix(in srgb, var(--color-accent) 35%, transparent);
  }
}

@media (prefers-reduced-motion: reduce) {
  :deep(.lol-section-add-btn:not(.is-disabled):hover) {
    transform: none;
  }
}
</style>
