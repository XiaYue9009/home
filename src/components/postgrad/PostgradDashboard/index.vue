<script setup>
import {
  POSTGRAD_TARGET,
  POSTGRAD_STRATEGY,
  POSTGRAD_EXTERNAL_LINKS,
  POSTGRAD_APPLY_MENUS,
  POSTGRAD_APPLY_PANELS,
  POSTGRAD_SUBJECTS,
  POSTGRAD_SCHEDULE,
  POSTGRAD_MATERIALS,
} from '@/config/postgrad.js';
import { getOfficialPanelHtml, getOfficialPanelMeta } from '@/lib/postgrad/official-content.js';
import { postgradApplyFitActive } from '@/lib/postgrad/apply-fit.js';

const POSTGRAD_TABS = [
  { key: 'overview', label: '概览', icon: '🎯' },
  { key: 'apply', label: '报名', icon: '📝' },
  { key: 'subjects', label: '科目', icon: '📚' },
  { key: 'schedule', label: '计划', icon: '📅' },
];

const tabs = POSTGRAD_TABS;

const activeTab = ref('overview');
const activeApplyPanel = ref('requirements');
const activeSubjectCode = ref(POSTGRAD_SUBJECTS[0]?.code ?? '101');
const floatOpen = ref(false);
const tabBarRef = ref(null);
const applyMainRef = ref(null);

const activeApplyContent = computed(() => POSTGRAD_APPLY_PANELS[activeApplyPanel.value]);
const activeApplyHtml = computed(() => getOfficialPanelHtml(activeApplyPanel.value));
const activeApplyMeta = computed(() => getOfficialPanelMeta(activeApplyPanel.value));

const activeSubject = computed(
  () => POSTGRAD_SUBJECTS.find((item) => item.code === activeSubjectCode.value) ?? POSTGRAD_SUBJECTS[0],
);

const activeSubjectMaterials = computed(() =>
  POSTGRAD_MATERIALS.filter((item) => item.subjectCode === activeSubjectCode.value),
);

function switchSubject(code) {
  activeSubjectCode.value = code;
}

watch(
  activeTab,
  (tab) => {
    postgradApplyFitActive.value = tab === 'apply';
    if (tab === 'apply') {
      refreshApplyScroll();
    }
  },
  { immediate: true },
);

function switchTab(key) {
  activeTab.value = key;
  floatOpen.value = false;
  tabBarRef.value?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function switchApplyPanel(key) {
  activeApplyPanel.value = key;
  nextTick(() => {
    applyMainRef.value?.setScrollTop(0);
    applyMainRef.value?.update?.();
  });
}

function refreshApplyScroll() {
  nextTick(() => {
    applyMainRef.value?.update?.();
  });
}

function onFloatToggle() {
  floatOpen.value = !floatOpen.value;
}

function onDocClick(event) {
  if (!event.target.closest('.postgrad-float')) {
    floatOpen.value = false;
  }
}

onMounted(() => {
  document.addEventListener('click', onDocClick);
});

onUnmounted(() => {
  document.removeEventListener('click', onDocClick);
  postgradApplyFitActive.value = false;
});
</script>

<template>
  <div class="postgrad-dashboard" :class="{ 'postgrad-dashboard--apply-fixed': activeTab === 'apply' }">
    <nav
      ref="tabBarRef"
      class="postgrad-tabs glass-card"
      aria-label="考研模块导航"
    >
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        class="postgrad-tabs__btn"
        :class="{ 'postgrad-tabs__btn--active': activeTab === tab.key }"
        :aria-selected="activeTab === tab.key"
        @click="switchTab(tab.key)"
      >
        <span class="postgrad-tabs__icon" aria-hidden="true">{{ tab.icon }}</span>
        <span class="postgrad-tabs__label">{{ tab.label }}</span>
      </button>
    </nav>

    <div class="postgrad-panel">
      <section v-show="activeTab === 'overview'" class="postgrad-panel__section">
        <article class="postgrad-strategy glass-card">
          <div class="postgrad-strategy__badge">备考策略</div>
          <h2 class="postgrad-strategy__title font-display text-xl font-semibold text-heading">
            {{ POSTGRAD_STRATEGY.headline }}
          </h2>
          <p class="postgrad-strategy__summary text-sm text-muted">
            {{ POSTGRAD_STRATEGY.summary }}
          </p>
          <div class="postgrad-strategy__phases">
            <article
              v-for="phase in POSTGRAD_STRATEGY.phases"
              :key="phase.key"
              class="postgrad-strategy__phase"
              :style="{ '--phase-accent': phase.accent }"
            >
              <div class="postgrad-strategy__phase-head">
                <span class="postgrad-strategy__phase-label">{{ phase.label }}</span>
                <span class="postgrad-strategy__phase-period">{{ phase.period }}</span>
              </div>
              <p class="postgrad-strategy__phase-goal">目标：{{ phase.goal }}</p>
              <ul class="postgrad-strategy__phase-list">
                <li v-for="(item, idx) in phase.items" :key="idx">{{ item }}</li>
              </ul>
            </article>
          </div>
        </article>

        <section class="postgrad-section">
          <h2 class="postgrad-section__title font-display text-xl font-semibold text-heading">
            目标院校
          </h2>
          <article class="postgrad-target glass-card">
            <div class="postgrad-target__grid">
              <div class="postgrad-target__item">
                <span class="postgrad-target__label">院校</span>
                <span class="postgrad-target__value">{{ POSTGRAD_TARGET.university }}</span>
              </div>
              <div class="postgrad-target__item">
                <span class="postgrad-target__label">学院</span>
                <span class="postgrad-target__value">{{ POSTGRAD_TARGET.college }}</span>
              </div>
              <div class="postgrad-target__item">
                <span class="postgrad-target__label">专业</span>
                <span class="postgrad-target__value">
                  {{ POSTGRAD_TARGET.majorCode }} {{ POSTGRAD_TARGET.majorName }}
                </span>
              </div>
              <div class="postgrad-target__item">
                <span class="postgrad-target__label">类型</span>
                <span class="postgrad-target__value">{{ POSTGRAD_TARGET.degreeType }}</span>
              </div>
              <div class="postgrad-target__item">
                <span class="postgrad-target__label">校区</span>
                <span class="postgrad-target__value">{{ POSTGRAD_TARGET.campus }}</span>
              </div>
              <div class="postgrad-target__item">
                <span class="postgrad-target__label">招生</span>
                <span class="postgrad-target__value">{{ POSTGRAD_TARGET.enrollment }}</span>
              </div>
              <div class="postgrad-target__item">
                <span class="postgrad-target__label">分数线</span>
                <span class="postgrad-target__value">{{ POSTGRAD_TARGET.scoreLine }}</span>
              </div>
              <div class="postgrad-target__item">
                <span class="postgrad-target__label">目标分数</span>
                <span class="postgrad-target__value postgrad-target__value--accent">
                  {{ POSTGRAD_TARGET.goalScore }}
                </span>
              </div>
            </div>
          </article>
        </section>
      </section>

      <section v-show="activeTab === 'apply'" class="postgrad-panel__section postgrad-apply">
        <div class="postgrad-apply__layout">
          <aside class="postgrad-apply__sidebar">
            <div class="postgrad-apply__sidebar-group">
              <div class="postgrad-apply__sidebar-head">
                <h2 class="postgrad-apply__sidebar-title font-display text-base font-semibold text-heading">
                  官方入口
                </h2>
                <p class="postgrad-apply__sidebar-hint text-xs text-subtle">外部链接</p>
              </div>
              <nav class="postgrad-apply__nav" aria-label="官方外部链接">
                <a
                  v-for="(link, index) in POSTGRAD_EXTERNAL_LINKS"
                  :key="link.key"
                  :href="link.href"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="postgrad-apply__nav-item postgrad-apply__nav-item--external glass-card"
                  :style="{ '--item-accent': link.accent }"
                >
                  <span class="postgrad-apply__nav-index" aria-hidden="true">
                    {{ String(index + 1).padStart(2, '0') }}
                  </span>
                  <span class="postgrad-apply__nav-icon" aria-hidden="true">{{ link.emoji }}</span>
                  <span class="postgrad-apply__nav-body">
                    <span class="postgrad-apply__nav-label">{{ link.label }}</span>
                    <span class="postgrad-apply__nav-desc">{{ link.description }}</span>
                  </span>
                  <span class="postgrad-apply__nav-arrow" aria-hidden="true">↗</span>
                </a>
              </nav>
            </div>

            <div class="postgrad-apply__sidebar-group">
              <div class="postgrad-apply__sidebar-head">
                <h2 class="postgrad-apply__sidebar-title font-display text-base font-semibold text-heading">
                  资料查阅
                </h2>
                <p class="postgrad-apply__sidebar-hint text-xs text-subtle">点击切换主体内容</p>
              </div>
              <nav class="postgrad-apply__nav" aria-label="报名资料菜单">
                <button
                  v-for="(menu, index) in POSTGRAD_APPLY_MENUS"
                  :key="menu.key"
                  type="button"
                  class="postgrad-apply__nav-item postgrad-apply__nav-item--panel glass-card"
                  :class="{ 'postgrad-apply__nav-item--active': activeApplyPanel === menu.key }"
                  :style="{ '--item-accent': menu.accent }"
                  :aria-current="activeApplyPanel === menu.key ? 'page' : undefined"
                  @click="switchApplyPanel(menu.key)"
                >
                  <span class="postgrad-apply__nav-index" aria-hidden="true">
                    {{ String(index + 3).padStart(2, '0') }}
                  </span>
                  <span class="postgrad-apply__nav-icon" aria-hidden="true">{{ menu.emoji }}</span>
                  <span class="postgrad-apply__nav-body">
                    <span class="postgrad-apply__nav-label">{{ menu.label }}</span>
                    <span class="postgrad-apply__nav-desc">{{ menu.description }}</span>
                  </span>
                </button>
              </nav>
            </div>
          </aside>

          <el-scrollbar ref="applyMainRef" class="postgrad-apply__main glass-card" always>
            <article v-if="activeApplyContent" :key="activeApplyPanel" class="postgrad-apply-panel">
              <header class="postgrad-apply-panel__head">
                <h2 class="postgrad-apply-panel__title font-display text-xl font-semibold text-heading">
                  {{ activeApplyContent.title }}
                </h2>
                <p v-if="activeApplyMeta?.publishedAt" class="postgrad-apply-panel__meta text-xs text-subtle">
                  发布时间：{{ activeApplyMeta.publishedAt }}
                </p>
              </header>
              <div
                class="postgrad-apply-panel__html v-news-content"
                v-html="activeApplyHtml"
              />
              <footer v-if="activeApplyMeta" class="postgrad-apply-panel__source">
                <p class="postgrad-apply-panel__source-line text-xs text-subtle">
                  原文：
                  <a
                    :href="activeApplyMeta.url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-link"
                  >
                    {{ activeApplyMeta.label }}
                  </a>
                </p>
                <p class="postgrad-apply-panel__source-line text-xs text-subtle">
                  原网址：
                  <a
                    :href="activeApplyMeta.url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="postgrad-apply-panel__source-url text-link"
                  >
                    {{ activeApplyMeta.url }}
                  </a>
                </p>
              </footer>
            </article>
          </el-scrollbar>
        </div>
      </section>

      <section v-show="activeTab === 'subjects'" class="postgrad-panel__section postgrad-study">
        <div class="postgrad-study__layout">
          <aside class="postgrad-study__sidebar">
            <div class="postgrad-study__sidebar-head">
              <h2 class="postgrad-study__sidebar-title font-display text-base font-semibold text-heading">
                初试科目
              </h2>
            </div>
            <nav class="postgrad-study__nav" aria-label="科目菜单">
              <button
                v-for="subject in POSTGRAD_SUBJECTS"
                :key="subject.code"
                type="button"
                class="postgrad-study__nav-item glass-card"
                :class="{ 'postgrad-study__nav-item--active': activeSubjectCode === subject.code }"
                :style="{ '--item-accent': subject.accent }"
                :aria-current="activeSubjectCode === subject.code ? 'page' : undefined"
                @click="switchSubject(subject.code)"
              >
                <span class="postgrad-study__nav-icon" aria-hidden="true">{{ subject.emoji }}</span>
                <span class="postgrad-study__nav-body">
                  <span class="postgrad-study__nav-code">{{ subject.code }}</span>
                  <span class="postgrad-study__nav-label">{{ subject.name }}</span>
                </span>
              </button>
            </nav>
          </aside>

          <div v-if="activeSubject" class="postgrad-study__main glass-card">
            <header class="postgrad-study__head">
              <div class="postgrad-study__head-top">
                <span class="postgrad-study__code" :style="{ color: activeSubject.accent }">
                  {{ activeSubject.code }}
                </span>
                <span class="postgrad-study__score text-xs text-subtle">
                  {{ activeSubject.score }} 分 · {{ activeSubject.duration }}
                </span>
              </div>
              <h2 class="postgrad-study__title font-display text-xl font-semibold text-heading">
                {{ activeSubject.name }}
              </h2>
              <p class="postgrad-study__note text-sm text-muted">{{ activeSubject.note }}</p>
              <div v-if="activeSubject.modules" class="postgrad-study__modules">
                <span
                  v-for="mod in activeSubject.modules"
                  :key="mod"
                  class="postgrad-study__module"
                  :style="{ '--item-accent': activeSubject.accent }"
                >
                  {{ mod }}
                </span>
              </div>
            </header>

            <section class="postgrad-study__materials">
              <h3 class="postgrad-study__materials-title font-display text-base font-semibold text-heading">
                推荐资料
              </h3>
              <div v-if="activeSubjectMaterials.length" class="postgrad-study__material-list">
                <article
                  v-for="material in activeSubjectMaterials"
                  :key="material.key"
                  class="postgrad-study__material"
                >
                  <span class="postgrad-study__material-icon" aria-hidden="true">{{ material.emoji }}</span>
                  <div class="postgrad-study__material-body">
                    <h4 class="postgrad-study__material-label font-display text-base font-semibold text-heading">
                      {{ material.label }}
                    </h4>
                    <p class="postgrad-study__material-desc text-sm text-muted">
                      {{ material.description }}
                    </p>
                    <div class="postgrad-study__material-tags">
                      <span
                        v-for="tag in material.tags"
                        :key="tag"
                        class="postgrad-study__material-tag"
                        :style="{ '--item-accent': activeSubject.accent }"
                      >
                        {{ tag }}
                      </span>
                    </div>
                  </div>
                </article>
              </div>
              <p v-else class="postgrad-study__empty text-sm text-subtle">暂无该科目资料，后续补充。</p>
            </section>
          </div>
        </div>
      </section>

      <section v-show="activeTab === 'schedule'" class="postgrad-panel__section">
        <section class="postgrad-section">
          <h2 class="postgrad-section__title font-display text-xl font-semibold text-heading">
            周期计划
          </h2>
          <div class="postgrad-schedule">
            <article
              v-for="item in POSTGRAD_SCHEDULE"
              :key="item.period"
              class="postgrad-schedule__item glass-card"
            >
              <div class="postgrad-schedule__meta">
                <time class="postgrad-schedule__period">{{ item.period }}</time>
                <span class="postgrad-schedule__phase">{{ item.phase }}</span>
              </div>
              <h3 class="postgrad-schedule__focus font-display text-base font-semibold text-heading">
                {{ item.focus }}
              </h3>
              <ul class="postgrad-schedule__tasks">
                <li v-for="(task, idx) in item.tasks" :key="idx">{{ task }}</li>
              </ul>
            </article>
          </div>
        </section>
      </section>
    </div>

    <Teleport to="body">
      <div class="postgrad-float" :class="{ 'postgrad-float--open': floatOpen }">
        <div v-if="floatOpen" class="postgrad-float__menu glass-card">
          <button
            v-for="tab in tabs"
            :key="`float-${tab.key}`"
            type="button"
            class="postgrad-float__item"
            :class="{ 'postgrad-float__item--active': activeTab === tab.key }"
            @click="switchTab(tab.key)"
          >
            <span aria-hidden="true">{{ tab.icon }}</span>
            <span>{{ tab.label }}</span>
          </button>
        </div>
        <button
          type="button"
          class="postgrad-float__toggle glass-card"
          :aria-expanded="floatOpen"
          aria-label="切换考研模块"
          @click="onFloatToggle"
        >
          <span class="postgrad-float__toggle-icon" aria-hidden="true">🎓</span>
          <span class="postgrad-float__toggle-label">{{ tabs.find((t) => t.key === activeTab)?.label }}</span>
        </button>
      </div>
    </Teleport>
  </div>
</template>

<style scoped lang="scss">
.postgrad-dashboard {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;

  &--apply-fixed {
    flex: 1;
    gap: 0.45rem;
    min-height: 0;
    overflow: hidden;

    .postgrad-tabs {
      position: static;
      flex-shrink: 0;
      padding: 0.28rem;
      gap: 0.25rem;

      .postgrad-tabs__btn {
        padding: 0.28rem 0.55rem;
        font-size: 0.75rem;
      }

      .postgrad-tabs__icon {
        font-size: 0.8rem;
      }
    }

    .postgrad-panel {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      overflow: hidden;
    }

    .postgrad-panel__section.postgrad-apply {
      display: flex;
      flex: 1;
      flex-direction: column;
      min-height: 0;
      overflow: hidden;
      gap: 0;
    }

    .postgrad-apply__layout {
      flex: 1;
      min-height: 0;
      height: 100%;
      overflow: hidden;
    }
  }
}

.postgrad-tabs {
  position: sticky;
  top: 4.5rem;
  z-index: 20;
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  padding: 0.45rem;
  border-radius: 1rem;

  &__btn {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.45rem 0.85rem;
    font-size: 0.8125rem;
    color: var(--color-text-muted);
    background: transparent;
    border: 1px solid transparent;
    border-radius: 9999px;
    cursor: pointer;
    transition:
      color 0.25s ease,
      background-color 0.25s ease,
      border-color 0.25s ease;

    &:hover {
      color: var(--color-heading);
      background: rgb(255 255 255 / 6%);
    }

    &--active {
      color: #c084fc;
      font-weight: 600;
      background: color-mix(in srgb, #c084fc 12%, transparent);
      border-color: color-mix(in srgb, #c084fc 22%, transparent);
    }
  }

  &__icon {
    font-size: 0.95rem;
    line-height: 1;
  }
}

.postgrad-panel {
  min-height: 12rem;

  &__section {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    animation: postgrad-tab-in 0.28s ease;
  }
}

.postgrad-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;

  &__title {
    margin: 0;
  }
}

.postgrad-strategy {
  padding: 1.5rem 1.75rem;
  border-left: 3px solid #c084fc;

  &__badge {
    display: inline-block;
    margin-bottom: 0.5rem;
    padding: 0.2rem 0.6rem;
    font-size: 0.75rem;
    font-weight: 500;
    color: #c084fc;
    background: color-mix(in srgb, #c084fc 12%, transparent);
    border-radius: 9999px;
  }

  &__title {
    margin: 0 0 0.5rem;
  }

  &__summary {
    margin: 0 0 1.25rem;
    line-height: 1.65;
  }

  &__phases {
    display: grid;
    gap: 1rem;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  &__phase {
    padding: 1rem 1.15rem;
    border-radius: 0.75rem;
    background: color-mix(in srgb, var(--phase-accent) 6%, var(--color-glass-bg));
    border: 1px solid color-mix(in srgb, var(--phase-accent) 14%, transparent);
  }

  &__phase-head {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.5rem 0.75rem;
    margin-bottom: 0.35rem;
  }

  &__phase-label {
    font-weight: 600;
    color: var(--phase-accent);
  }

  &__phase-period {
    font-size: 0.8125rem;
    color: var(--color-text-muted);
  }

  &__phase-goal {
    margin: 0 0 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-heading);
  }

  &__phase-list {
    margin: 0;
    padding-left: 1.15rem;
    font-size: 0.8125rem;
    line-height: 1.6;
    color: var(--color-text-muted);

    li + li {
      margin-top: 0.25rem;
    }
  }
}

.postgrad-apply {
  &__layout {
    display: grid;
    grid-template-columns: 13rem minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr);
    gap: 0.85rem;
    align-items: stretch;
    min-height: 0;

    > * {
      min-height: 0;
      max-height: 100%;
    }
  }

  &__sidebar {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    min-height: 0;
    overflow: hidden;
    flex-shrink: 0;
  }

  &__sidebar-head {
    padding: 0;
    flex-shrink: 0;
  }

  &__sidebar-title {
    margin: 0;
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  &__sidebar-hint {
    display: none;
  }

  &__nav {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    min-height: 0;
  }

  &__nav-item {
    position: relative;
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 0.4rem 0.5rem;
    padding: 0.5rem 0.55rem;
    text-decoration: none;
    border-radius: 0.85rem;
    border: 1px solid color-mix(in srgb, var(--item-accent) 14%, transparent);
    background: color-mix(in srgb, var(--item-accent) 4%, var(--color-glass-bg));
    overflow: hidden;
    transition:
      background-color 0.25s ease,
      border-color 0.25s ease,
      box-shadow 0.25s ease,
      transform 0.25s ease;

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0.55rem;
      bottom: 0.55rem;
      width: 3px;
      border-radius: 0 3px 3px 0;
      background: var(--item-accent);
      opacity: 0.55;
      transition: opacity 0.25s ease;
    }

    &:hover {
      background: color-mix(in srgb, var(--item-accent) 10%, var(--color-glass-bg));
      border-color: color-mix(in srgb, var(--item-accent) 28%, transparent);
      box-shadow: 0 8px 20px -12px color-mix(in srgb, var(--item-accent) 35%, transparent);
      transform: translateX(3px);

      &::before {
        opacity: 1;
      }
    }
  }

  &__nav-index {
    display: none;
  }

  &__nav-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.5rem;
    height: 1.5rem;
    font-size: 0.875rem;
    line-height: 1;
    border-radius: 0.45rem;
    background: color-mix(in srgb, var(--item-accent) 14%, transparent);
    border: 1px solid color-mix(in srgb, var(--item-accent) 20%, transparent);
  }

  &__nav-body {
    display: flex;
    flex-direction: column;
    gap: 0;
    min-width: 0;
  }

  &__nav-label {
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--color-heading);
    line-height: 1.3;
  }

  &__nav-desc {
    display: none;
  }

  &__nav-arrow {
    align-self: start;
    margin-top: 0.15rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.35rem;
    height: 1.35rem;
    font-size: 0.7rem;
    color: var(--item-accent);
    background: color-mix(in srgb, var(--item-accent) 10%, transparent);
    border-radius: 9999px;
    opacity: 0.85;
    transition: opacity 0.2s ease, transform 0.2s ease, background-color 0.2s ease;
  }

  &__nav-item:hover &__nav-arrow {
    opacity: 1;
    background: color-mix(in srgb, var(--item-accent) 18%, transparent);
    transform: translate(1px, -1px);
  }

  &__sidebar-group {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    flex-shrink: 0;

    & + & {
      padding-top: 0.3rem;
      border-top: 1px solid rgb(255 255 255 / 8%);
    }
  }

  &__nav-item--panel {
    grid-template-columns: auto 1fr;
    width: 100%;
    text-align: left;
    cursor: pointer;
    font: inherit;
    color: inherit;
  }

  &__nav-item--external {
    grid-template-columns: auto 1fr auto;
  }

  &__nav-item--active {
    background: color-mix(in srgb, var(--item-accent) 14%, var(--color-glass-bg));
    border-color: color-mix(in srgb, var(--item-accent) 32%, transparent);
    box-shadow: 0 6px 16px -12px color-mix(in srgb, var(--item-accent) 35%, transparent);

    &::before {
      opacity: 1;
    }
  }

  &__main {
    min-width: 0;
    min-height: 0;
    height: 100%;
    max-height: 100%;
    overflow: hidden;
    border-radius: 1rem;

    :deep(.el-scrollbar) {
      height: 100%;
      max-height: 100%;
    }

    :deep(.el-scrollbar__wrap) {
      height: 100% !important;
      max-height: 100% !important;
      overscroll-behavior: contain;
      border-radius: inherit;
    }

    :deep(.el-scrollbar__view) {
      padding-right: 0.15rem;
    }

    :deep(.el-scrollbar__bar.is-vertical) {
      right: 2px;
      width: 6px;
    }

    :deep(.el-scrollbar__thumb) {
      border-radius: 9999px;
      background: color-mix(in srgb, #c084fc 45%, transparent);
      opacity: 0.85;
    }
  }
}

.postgrad-apply-panel {
  padding: 0.9rem 1rem;
  background: transparent;
  border: none;
  animation: postgrad-tab-in 0.28s ease;

  &__head {
    margin-bottom: 0.65rem;
    padding-bottom: 0.55rem;
    border-bottom: 1px solid rgb(255 255 255 / 8%);
  }

  &__title {
    margin: 0;
    font-size: 1.05rem;
  }

  &__meta {
    margin: 0.2rem 0 0;
  }

  &__html {
    font-size: 0.875rem;
    line-height: 1.75;
    color: var(--color-text-muted);

    :deep(p) {
      margin: 0 0 0.75rem;
    }

    :deep(strong) {
      color: var(--color-heading);
    }

    :deep(a) {
      color: #c084fc;
      text-decoration: underline;
      text-underline-offset: 2px;
      word-break: break-all;

      &:hover {
        opacity: 0.85;
      }
    }

    :deep(img) {
      display: block;
      max-width: 100%;
      height: auto;
      margin: 0.5rem auto;
      border-radius: 0.65rem;
      border: 1px solid rgb(255 255 255 / 10%);
    }

    :deep(table) {
      width: 100%;
      margin: 0.75rem 0 1rem;
      border-collapse: collapse;
      font-size: 0.8125rem;
      overflow-x: auto;
      display: block;
    }

    :deep(td),
    :deep(th) {
      padding: 0.55rem 0.65rem;
      border: 1px solid rgb(255 255 255 / 12%);
      vertical-align: top;
      color: var(--color-text-muted);
    }

    :deep(td strong),
    :deep(th strong),
    :deep(td p strong) {
      color: var(--color-heading);
    }

    :deep(tr:first-child td) {
      background: color-mix(in srgb, #c084fc 8%, transparent);
    }
  }

  &__source {
    margin: 1.15rem 0 0;
    padding-top: 0.85rem;
    border-top: 1px solid rgb(255 255 255 / 8%);
  }

  &__source-line {
    margin: 0;

    & + & {
      margin-top: 0.35rem;
    }
  }

  &__source-url {
    word-break: break-all;
  }

  &__html :deep(a) {
    color: var(--color-link, #c084fc);
    text-decoration: underline;
    text-underline-offset: 0.15em;
  }
}

.postgrad-target {
  padding: 1.25rem 1.5rem;

  &__grid {
    display: grid;
    gap: 0.85rem 1.5rem;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  &__item {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  &__label {
    font-size: 0.75rem;
    color: var(--color-text-muted);
  }

  &__value {
    font-size: 0.9375rem;
    color: var(--color-heading);

    &--accent {
      color: #c084fc;
      font-weight: 600;
    }
  }
}

.postgrad-target {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.postgrad-study {
  &__layout {
    display: grid;
    grid-template-columns: 13rem minmax(0, 1fr);
    gap: 0.85rem;
    align-items: start;
  }

  &__sidebar {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  &__sidebar-head {
    padding: 0 0.1rem;
  }

  &__sidebar-title {
    margin: 0;
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  &__nav {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  &__nav-item {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    gap: 0.45rem;
    width: 100%;
    padding: 0.55rem 0.6rem;
    text-align: left;
    font: inherit;
    color: inherit;
    cursor: pointer;
    border-radius: 0.85rem;
    border: 1px solid color-mix(in srgb, var(--item-accent) 14%, transparent);
    background: color-mix(in srgb, var(--item-accent) 4%, var(--color-glass-bg));
    transition:
      background-color 0.25s ease,
      border-color 0.25s ease,
      transform 0.25s ease;

    &:hover {
      background: color-mix(in srgb, var(--item-accent) 10%, var(--color-glass-bg));
      border-color: color-mix(in srgb, var(--item-accent) 28%, transparent);
      transform: translateX(3px);
    }

    &--active {
      background: color-mix(in srgb, var(--item-accent) 14%, var(--color-glass-bg));
      border-color: color-mix(in srgb, var(--item-accent) 32%, transparent);
    }
  }

  &__nav-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.5rem;
    height: 1.5rem;
    font-size: 0.875rem;
    line-height: 1;
    border-radius: 0.45rem;
    background: color-mix(in srgb, var(--item-accent) 14%, transparent);
    border: 1px solid color-mix(in srgb, var(--item-accent) 20%, transparent);
  }

  &__nav-body {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    min-width: 0;
  }

  &__nav-code {
    font-size: 0.7rem;
    font-weight: 700;
    color: var(--item-accent);
  }

  &__nav-label {
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--color-heading);
    line-height: 1.3;
  }

  &__main {
    min-width: 0;
    padding: 1rem 1.1rem;
    border-radius: 1rem;
    animation: postgrad-tab-in 0.28s ease;
  }

  &__head {
    margin-bottom: 1rem;
    padding-bottom: 0.85rem;
    border-bottom: 1px solid rgb(255 255 255 / 8%);
  }

  &__head-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    margin-bottom: 0.35rem;
  }

  &__code {
    font-size: 0.875rem;
    font-weight: 700;
  }

  &__title {
    margin: 0 0 0.4rem;
  }

  &__note {
    margin: 0;
    line-height: 1.6;
  }

  &__modules {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    margin-top: 0.65rem;
  }

  &__module {
    padding: 0.15rem 0.5rem;
    font-size: 0.75rem;
    color: var(--item-accent);
    background: color-mix(in srgb, var(--item-accent) 10%, transparent);
    border-radius: 9999px;
  }

  &__materials-title {
    margin: 0 0 0.7rem;
  }

  &__material-list {
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
  }

  &__material {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 0.7rem;
    padding: 0.8rem 0.85rem;
    border-radius: 0.85rem;
    border: 1px solid rgb(255 255 255 / 8%);
    background: rgb(255 255 255 / 3%);
  }

  &__material-icon {
    font-size: 1.35rem;
    line-height: 1;
  }

  &__material-label {
    margin: 0 0 0.25rem;
  }

  &__material-desc {
    margin: 0;
    line-height: 1.5;
  }

  &__material-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    margin-top: 0.45rem;
  }

  &__material-tag {
    padding: 0.15rem 0.5rem;
    font-size: 0.75rem;
    color: var(--item-accent);
    background: color-mix(in srgb, var(--item-accent) 10%, transparent);
    border-radius: 9999px;
  }

  &__empty {
    margin: 0;
  }
}

.postgrad-schedule {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.postgrad-schedule__item {
  padding: 1.15rem 1.35rem;
}

.postgrad-schedule__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 0.75rem;
  margin-bottom: 0.35rem;
}

.postgrad-schedule__period {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #c084fc;
}

.postgrad-schedule__phase {
  font-size: 0.75rem;
  padding: 0.15rem 0.5rem;
  color: var(--color-text-muted);
  background: rgb(255 255 255 / 6%);
  border-radius: 9999px;
}

.postgrad-schedule__focus {
  margin: 0 0 0.5rem;
}

.postgrad-schedule__tasks {
  margin: 0;
  padding-left: 1.15rem;
  font-size: 0.8125rem;
  line-height: 1.6;
  color: var(--color-text-muted);

  li + li {
    margin-top: 0.25rem;
  }
}


@keyframes postgrad-tab-in {
  from {
    opacity: 0;
    transform: translateY(6px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 1023px) {
  .postgrad-tabs {
    top: 3.75rem;
  }

  .postgrad-apply__layout,
  .postgrad-study__layout {
    grid-template-columns: 11rem minmax(0, 1fr);
  }
}

@media (max-width: 767px) {
  .postgrad-apply__layout {
    grid-template-columns: 1fr;
    grid-template-rows: auto minmax(0, 1fr);
    gap: 0.55rem;
  }

  .postgrad-apply__sidebar {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 0.35rem;
    overflow: auto;
    max-height: 38%;
    flex-shrink: 0;
  }

  .postgrad-apply__sidebar-group {
    flex: 1 1 100%;

    & + & {
      padding-top: 0;
      border-top: none;
    }
  }

  .postgrad-apply__nav {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.35rem;
  }

  .postgrad-apply__nav-item {
    &:hover {
      transform: translateY(-2px);
    }
  }

  .postgrad-apply__main {
    min-height: 0;
  }

  .postgrad-study__layout {
    grid-template-columns: 1fr;
    gap: 0.55rem;
  }

  .postgrad-study__nav {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.35rem;
  }

  .postgrad-study__nav-item:hover {
    transform: translateY(-2px);
  }
}

@media (max-width: 639px) {
  .postgrad-strategy__phases,
  .postgrad-target__grid {
    grid-template-columns: 1fr;
  }

  .postgrad-tabs__label {
    font-size: 0.75rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .postgrad-panel__section {
    animation: none;
  }

  .postgrad-apply__nav-item:hover,
  .postgrad-study__nav-item:hover {
    transform: none;
  }
}
</style>

<style lang="scss">
.postgrad-float {
  position: fixed;
  right: 1.25rem;
  bottom: 1.5rem;
  z-index: 60;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.65rem;

  &__menu {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    min-width: 7.5rem;
    padding: 0.45rem;
    border-radius: 0.85rem;
    box-shadow: 0 12px 32px -12px rgb(0 0 0 / 35%);
  }

  &__item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
    padding: 0.5rem 0.65rem;
    font-size: 0.8125rem;
    color: var(--color-text-muted);
    text-align: left;
    background: transparent;
    border: none;
    border-radius: 0.55rem;
    cursor: pointer;
    transition: background-color 0.2s ease, color 0.2s ease;

    &:hover {
      color: var(--color-heading);
      background: rgb(255 255 255 / 6%);
    }

    &--active {
      color: #c084fc;
      font-weight: 600;
      background: color-mix(in srgb, #c084fc 12%, transparent);
    }
  }

  &__toggle {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.65rem 0.95rem;
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--color-heading);
    border: 1px solid color-mix(in srgb, #c084fc 25%, transparent);
    border-radius: 9999px;
    cursor: pointer;
    box-shadow:
      0 10px 28px -10px color-mix(in srgb, #c084fc 35%, transparent),
      0 0 0 1px color-mix(in srgb, #c084fc 8%, transparent);
    transition:
      transform 0.3s ease,
      box-shadow 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow:
        0 14px 32px -10px color-mix(in srgb, #c084fc 42%, transparent),
        0 0 0 1px color-mix(in srgb, #c084fc 14%, transparent);
    }
  }

  &__toggle-icon {
    font-size: 1.1rem;
    line-height: 1;
  }

  &__toggle-label {
    white-space: nowrap;
  }
}

@media (max-width: 639px) {
  .postgrad-float {
    right: 1rem;
    bottom: 1rem;
  }

  .postgrad-float__toggle-label {
    display: none;
  }

  .postgrad-float__toggle {
    width: 2.75rem;
    height: 2.75rem;
    padding: 0;
    justify-content: center;
    border-radius: 50%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .postgrad-float__toggle:hover {
    transform: none;
  }
}
</style>
