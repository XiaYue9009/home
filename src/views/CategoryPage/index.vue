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
import PostgradDashboard from '@/components/postgrad/PostgradDashboard/index.vue';
import { postgradApplyFitActive } from '@/lib/postgrad/apply-fit.js';
import {
  MOTION_CATEGORY,
  MOTION_STAGGER,
  ENTRANCE_POOL,
  pickCycleAnimation,
} from '@/lib/motion/presets.js';

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

function handleGeoFilterChange(key, event) {
  const value = event?.target?.value || '';
  if (key === 'province') {
    travelStore.setGeoFilter({ province: value, city: '', district: '', placeName: '' });
    return;
  }
  if (key === 'city') {
    travelStore.setGeoFilter({ city: value, district: '', placeName: '' });
    return;
  }
  if (key === 'district') {
    travelStore.setGeoFilter({ district: value, placeName: '' });
    return;
  }
  travelStore.setGeoFilter({ [key]: value });
}

const filteredCityOptions = computed(() => {
  const { province } = travelStore.geoFilter;
  if (!province) return travelStore.geoOptions.cities;
  return travelStore.allVideos
    .filter((video) => video.province === province && video.city)
    .map((video) => video.city)
    .filter((value, index, arr) => arr.indexOf(value) === index)
    .sort((a, b) => a.localeCompare(b, 'zh-CN'));
});

const filteredPlaceOptions = computed(() => {
  const { province, city } = travelStore.geoFilter;
  return travelStore.allVideos
    .filter((video) => {
      if (province && video.province !== province) return false;
      if (city && video.city !== city) return false;
      return Boolean(video.placeName);
    })
    .map((video) => video.placeName)
    .filter((value, index, arr) => arr.indexOf(value) === index)
    .sort((a, b) => a.localeCompare(b, 'zh-CN'));
});
</script>

<template>
  <div
    class="page-shell page-shell--category"
    :class="{ 'page-shell--postgrad-fit': category === 'postgrad' && postgradApplyFitActive }"
  >
    <header
      class="category-page-header"
      :class="category === 'postgrad' && postgradApplyFitActive ? 'category-page-header--postgrad' : 'mb-3'"
    >
      <div v-if="category === 'lol'" class="category-page-header__row">
        <MotionEnter :animation="MOTION_CATEGORY.icon.animation">
          <CategoryIcon :category="category" size="lg" />
        </MotionEnter>
        <MotionEnter
          tag="h1"
          class="font-display text-2xl font-bold"
          :class="cat.color"
          :animation="MOTION_CATEGORY.title.animation"
          :delay="MOTION_CATEGORY.title.delay"
        >
          {{ cat.label }}
        </MotionEnter>
        <MotionEnter
          tag="p"
          class="category-page-header__desc category-page-header__desc--compact text-muted"
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
          class="font-display text-2xl font-bold"
          :class="cat.color"
          :animation="MOTION_CATEGORY.title.animation"
          :delay="MOTION_CATEGORY.title.delay"
        >
          {{ cat.label }}
        </MotionEnter>
        <MotionEnter
          tag="p"
          class="category-page-header__desc category-page-header__desc--compact text-muted"
          :animation="MOTION_CATEGORY.desc.animation"
          :delay="MOTION_CATEGORY.desc.delay"
          :speed="MOTION_CATEGORY.desc.speed"
        >
          旅行足迹与视频收藏，内容待补充。
        </MotionEnter>
      </div>
      <div v-else-if="category === 'upcoming'" class="category-page-header__row">
        <MotionEnter :animation="MOTION_CATEGORY.icon.animation">
          <CategoryIcon :category="category" size="lg" />
        </MotionEnter>
        <MotionEnter
          tag="h1"
          class="font-display text-2xl font-bold"
          :class="cat.color"
          :animation="MOTION_CATEGORY.title.animation"
          :delay="MOTION_CATEGORY.title.delay"
        >
          {{ cat.label }}
        </MotionEnter>
        <MotionEnter
          tag="p"
          class="category-page-header__desc category-page-header__desc--compact text-muted"
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
          class="font-display text-2xl font-bold"
          :class="cat.color"
          :animation="MOTION_CATEGORY.title.animation"
          :delay="MOTION_CATEGORY.title.delay"
        >
          {{ cat.label }}
        </MotionEnter>
        <MotionEnter
          tag="p"
          class="category-page-header__desc category-page-header__desc--compact text-muted"
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
          class="font-display text-2xl font-bold"
          :class="cat.color"
          :animation="MOTION_CATEGORY.title.animation"
          :delay="MOTION_CATEGORY.title.delay"
        >
          {{ cat.label }}
        </MotionEnter>
        <MotionEnter
          tag="p"
          class="category-page-header__desc category-page-header__desc--compact text-muted"
          :animation="MOTION_CATEGORY.desc.animation"
          :delay="MOTION_CATEGORY.desc.delay"
          :speed="MOTION_CATEGORY.desc.speed"
        >
          项目技术栈选用
        </MotionEnter>
      </div>
      <div v-else-if="category === 'postgrad'" class="category-page-header__row">
        <MotionEnter :animation="MOTION_CATEGORY.icon.animation">
          <CategoryIcon :category="category" size="lg" />
        </MotionEnter>
        <MotionEnter
          tag="h1"
          class="font-display text-2xl font-bold"
          :class="cat.color"
          :animation="MOTION_CATEGORY.title.animation"
          :delay="MOTION_CATEGORY.title.delay"
        >
          {{ cat.label }}
        </MotionEnter>
        <MotionEnter
          tag="p"
          class="category-page-header__desc category-page-header__desc--compact text-muted"
          :animation="MOTION_CATEGORY.desc.animation"
          :delay="MOTION_CATEGORY.desc.delay"
          :speed="MOTION_CATEGORY.desc.speed"
        >
          青岛科技大学 · 计算机科学与技术 · 今年体验参考，明年全力上岸
        </MotionEnter>
      </div>
      <div v-else class="category-page-header__row">
        <MotionEnter :animation="MOTION_CATEGORY.icon.animation">
          <CategoryIcon :category="category" size="lg" />
        </MotionEnter>
        <MotionEnter
          tag="h1"
          class="font-display text-2xl font-bold"
          :class="cat.color"
          :animation="MOTION_CATEGORY.title.animation"
          :delay="MOTION_CATEGORY.title.delay"
        >
          {{ cat.label }}
        </MotionEnter>
        <MotionEnter
          tag="p"
          class="category-page-header__desc category-page-header__desc--compact text-muted"
          :animation="MOTION_CATEGORY.desc.animation"
          :delay="MOTION_CATEGORY.desc.delay"
          :speed="MOTION_CATEGORY.desc.speed"
        >
          共 {{ categoryPosts.length }} 篇文章
        </MotionEnter>
      </div>
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

    <section
      v-if="category === 'postgrad'"
      class="postgrad-page-section"
      :class="{ 'postgrad-page-section--fit': postgradApplyFitActive }"
    >
      <PostgradDashboard />
    </section>

    <section v-if="category === 'travel'" class="mb-14">
      <ScrollReveal
        class="mb-6 flex flex-wrap items-center gap-3"
        :animation="MOTION_CATEGORY.sectionTitle.animation"
        :speed="MOTION_CATEGORY.sectionTitle.speed"
      >
        <h2 class="font-display text-xl font-semibold text-heading">收藏夹</h2>
        <div class="travel-view-toggle flex gap-1 rounded-full bg-white/5 p-1">
            <button
              type="button"
              class="travel-view-toggle__btn"
              :class="{ 'travel-view-toggle__btn--active': travelStore.viewMode === 'folder' }"
              @click="travelStore.setViewMode('folder')"
            >
              收藏夹
            </button>
            <button
              type="button"
              class="travel-view-toggle__btn"
              :class="{ 'travel-view-toggle__btn--active': travelStore.viewMode === 'geo' }"
              @click="travelStore.setViewMode('geo')"
            >
            地理分组
          </button>
        </div>
      </ScrollReveal>

      <ScrollReveal
        v-if="travelStore.viewMode === 'folder'"
        class="mb-6 flex flex-wrap gap-3"
        :animation="MOTION_CATEGORY.sectionTitle.animation"
        :speed="MOTION_CATEGORY.sectionTitle.speed"
      >
        <label class="travel-geo-filter">
          <span>省份</span>
          <select
            :value="travelStore.geoFilter.province"
            class="travel-geo-filter__select"
            @change="handleGeoFilterChange('province', $event)"
          >
            <option value="">全部</option>
            <option v-for="item in travelStore.geoOptions.provinces" :key="item" :value="item">
              {{ item }}
            </option>
          </select>
        </label>
        <label class="travel-geo-filter">
          <span>城市</span>
          <select
            :value="travelStore.geoFilter.city"
            class="travel-geo-filter__select"
            @change="handleGeoFilterChange('city', $event)"
          >
            <option value="">全部</option>
            <option v-for="item in filteredCityOptions" :key="item" :value="item">{{ item }}</option>
          </select>
        </label>
        <label class="travel-geo-filter">
          <span>具体地名</span>
          <select
            :value="travelStore.geoFilter.placeName"
            class="travel-geo-filter__select"
            @change="handleGeoFilterChange('placeName', $event)"
          >
            <option value="">全部</option>
            <option v-for="item in filteredPlaceOptions" :key="item" :value="item">{{ item }}</option>
          </select>
        </label>
        <button type="button" class="btn-ghost text-sm" @click="travelStore.resetGeoFilter()">
          清除筛选
        </button>
      </ScrollReveal>

      <MotionEnter
        v-if="travelStore.loading"
        tag="p"
        class="text-muted"
        :animation="MOTION_CATEGORY.loading.animation"
        :speed="MOTION_CATEGORY.loading.speed"
      >
        正在加载旅行视频…
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
            暂无{{ travelStore.viewMode === 'geo' ? '地理' : '收藏夹' }}数据
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
              <p v-else class="text-sm text-subtle">该分组暂无视频</p>
            </div>
          </div>
        </div>
      </template>

      <ScrollReveal v-else :animation="MOTION_CATEGORY.empty.animation">
        <div class="glass-card p-8 text-center">
          <p class="text-muted">暂无旅行视频。</p>
          <p class="mt-2 text-sm text-subtle">旅行模块内容已清空，后续可在本地数据或 Supabase 中重新添加。</p>
        </div>
      </ScrollReveal>

      <p v-if="travelStore.error && travelStore.source === 'cache'" class="mt-4 text-sm text-subtle">
        加载失败（{{ travelStore.error }}），已显示本地缓存。
      </p>
      <p v-else-if="travelStore.error" class="mt-4 text-sm text-subtle">{{ travelStore.error }}</p>
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

    <section v-if="categoryPosts.length > 0 && category !== 'postgrad'">
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
      v-else-if="category !== 'lol' && category !== 'travel' && category !== 'upcoming' && category !== 'tools' && category !== 'stack' && category !== 'postgrad'"
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

.travel-view-toggle__btn {
  border-radius: 9999px;
  padding: 0.25rem 0.75rem;
  font-size: 0.8125rem;
  color: var(--color-muted, #94a3b8);
  transition: background-color 0.2s ease, color 0.2s ease;

  &--active {
    background: rgb(255 255 255 / 12%);
    color: var(--color-heading, #f8fafc);
  }
}

.travel-geo-filter {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  color: var(--color-muted, #94a3b8);

  &__select {
    min-width: 7rem;
    border-radius: 0.5rem;
    border: 1px solid rgb(255 255 255 / 10%);
    background: rgb(0 0 0 / 20%);
    padding: 0.375rem 0.625rem;
    color: var(--color-heading, #f8fafc);
  }
}

.category-page-header {
  gap: 0.5rem 0.85rem;
}

.category-page-header__desc--compact {
  font-size: 0.75rem;
  line-height: 1.45;
}

.page-shell--postgrad-fit {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  padding-top: 0.85rem;
  padding-bottom: 0.35rem;
}

.category-page-header--postgrad {
  flex-shrink: 0;
  margin-bottom: 0.55rem;
}

.postgrad-page-section {
  margin-bottom: 0;

  &--fit {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
  }
}
</style>
