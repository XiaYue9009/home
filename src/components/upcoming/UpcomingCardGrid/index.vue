<script setup>
import Sortable from 'sortablejs';
import ConfirmDialog from '@/components/lol/ConfirmDialog/index.vue';
import MarkdownEditor from '@/components/editor/MarkdownEditor/index.vue';
import ScrollReveal from '@/components/motion/ScrollReveal/index.vue';
import { useEditStore } from '@/stores/edit.js';
import { useUpcomingStore } from '@/stores/upcoming.js';
import {
  MOTION_CATEGORY,
  MOTION_STAGGER,
  ENTRANCE_POOL,
  pickCycleAnimation,
} from '@/lib/motion/presets.js';

const upcomingStore = useUpcomingStore();
const editStore = useEditStore();
const editorRef = ref(null);
const gridRef = ref(null);

/** 同步触发：'blur' | 'close' | 'both' */
const SYNC_ON = 'both';

const canEdit = computed(() => editStore.canEdit);
const pendingDeleteCard = ref(null);
const deleteConfirmOpen = computed({
  get: () => !!pendingDeleteCard.value,
  set: (open) => {
    if (!open) pendingDeleteCard.value = null;
  },
});
const deleteConfirmMessage = computed(() => {
  const card = pendingDeleteCard.value;
  return card ? `确定删除「${card.title}」吗？此操作不可撤销。` : '';
});

let sortable = null;
let suppressClick = false;

function formatCardTimeParts(iso) {
  const date = new Date(iso);
  return {
    date: date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    }),
    time: date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }),
  };
}

function requestDelete(card, event) {
  event.stopPropagation();
  if (!canEdit.value) return;
  pendingDeleteCard.value = card;
}

async function confirmDelete() {
  const card = pendingDeleteCard.value;
  if (!card) return;
  pendingDeleteCard.value = null;
  await upcomingStore.removeCard(card.id);
}

async function togglePin(card, event) {
  event.stopPropagation();
  if (!canEdit.value || card.done) return;
  await upcomingStore.togglePin(card.id);
}

async function toggleDone(card, event) {
  event.stopPropagation();
  if (!canEdit.value) return;
  await upcomingStore.toggleDone(card.id);
}

function openCard(cardId) {
  if (!canEdit.value || suppressClick) return;
  upcomingStore.openEdit(cardId);
}

function openCompose() {
  if (!canEdit.value) return;
  upcomingStore.openCreate();
}

function destroySortable() {
  sortable?.destroy();
  sortable = null;
}

function readOrderedIds() {
  if (!gridRef.value) return [];
  return [...gridRef.value.querySelectorAll('[data-card-id]')]
    .map((el) => el.getAttribute('data-card-id'))
    .filter(Boolean);
}

function initSortable() {
  destroySortable();
  if (!canEdit.value || !gridRef.value) return;

  sortable = Sortable.create(gridRef.value, {
    animation: 180,
    handle: '.upcoming-card__drag',
    draggable: '.upcoming-grid__item:not([data-group="done"])',
    filter: '.upcoming-grid__compose, .upcoming-grid__item[data-group="done"], .upcoming-card__pin, .upcoming-card__done, .upcoming-card__delete',
    preventOnFilter: false,
    ghostClass: 'upcoming-grid__item--ghost',
    chosenClass: 'upcoming-grid__item--chosen',
    dragClass: 'upcoming-grid__item--drag',
    onMove(evt) {
      const related = evt.related?.closest?.('[data-card-id]') || evt.related;
      if (!related?.getAttribute?.('data-card-id')) return false;

      const fromGroup = evt.dragged.getAttribute('data-group');
      const toGroup = related.getAttribute('data-group');
      if (fromGroup === 'done' || toGroup === 'done') return false;
      return fromGroup === toGroup;
    },
    onStart() {
      suppressClick = true;
    },
    async onEnd() {
      const ids = readOrderedIds();
      await upcomingStore.reorderCards(ids);
      window.setTimeout(() => {
        suppressClick = false;
      }, 0);
    },
  });
}

watch(
  () => upcomingStore.editorOpen,
  (open) => {
    if (open) nextTick(() => editorRef.value?.focusEditor());
  },
);

watch(
  [
    canEdit,
    () => upcomingStore.cards
      .map((card) => `${card.id}:${card.pinned ? 1 : 0}:${card.done ? 1 : 0}`)
      .join('|'),
  ],
  () => nextTick(() => initSortable()),
  { flush: 'post' },
);

async function persistIfNeeded() {
  if (!canEdit.value) return;
  await upcomingStore.autosaveDraft();
}

async function handleEditorBlur() {
  if (SYNC_ON !== 'blur' && SYNC_ON !== 'both') return;
  await persistIfNeeded();
}

async function handleDialogClose() {
  if (SYNC_ON !== 'close' && SYNC_ON !== 'both') return;
  await persistIfNeeded();
}

onMounted(() => {
  upcomingStore.load();
  nextTick(() => initSortable());
});

onBeforeUnmount(() => {
  destroySortable();
});
</script>

<template>
  <section class="upcoming-grid-wrap">
    <div ref="gridRef" class="upcoming-grid">
      <div class="upcoming-grid__compose">
        <ScrollReveal
          :animation="MOTION_CATEGORY.upcomingCompose.animation"
          :speed="MOTION_CATEGORY.upcomingCompose.speed"
        >
          <button
            type="button"
            class="upcoming-card upcoming-card--compose glass-card"
            :class="{ 'is-disabled': !canEdit }"
            :disabled="!canEdit"
            :title="canEdit ? '新建卡片' : '请先在导航栏解锁编辑'"
            @click="openCompose"
          >
            <span class="upcoming-card__compose-icon" aria-hidden="true">+</span>
            <span class="upcoming-card__compose-label">新建</span>
            <span class="upcoming-card__compose-hint">在此添加优化项</span>
          </button>
        </ScrollReveal>
      </div>

      <div
        v-for="(card, index) in upcomingStore.cards"
        :key="card.id"
        class="upcoming-grid__item"
        :data-card-id="card.id"
        :data-group="card.done ? 'done' : card.pinned ? 'pinned' : 'active'"
      >
        <ScrollReveal
          :animation="pickCycleAnimation(index, ENTRANCE_POOL.upcoming)"
          :delay="(index + 1) * MOTION_STAGGER.card"
        >
          <article
            class="upcoming-card glass-card glass-card-hover"
            :class="{
              'is-disabled': !canEdit,
              'is-pinned': card.pinned && !card.done,
              'is-done': card.done,
            }"
            :title="canEdit ? '编辑卡片' : '请先在导航栏解锁编辑'"
          >
            <div v-if="canEdit" class="upcoming-card__actions">
              <button
                v-if="!card.done"
                type="button"
                class="upcoming-card__drag"
                aria-label="拖拽排序"
                title="拖拽排序"
              >
                <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                  <path
                    d="M5 3.5a1.25 1.25 0 110 2.5 1.25 1.25 0 010-2.5zm6 0a1.25 1.25 0 110 2.5 1.25 1.25 0 010-2.5zM5 6.75a1.25 1.25 0 110 2.5 1.25 1.25 0 010-2.5zm6 0a1.25 1.25 0 110 2.5 1.25 1.25 0 010-2.5zM5 10a1.25 1.25 0 110 2.5 1.25 1.25 0 010-2.5zm6 0a1.25 1.25 0 110 2.5 1.25 1.25 0 010-2.5z"
                    fill="currentColor"
                  />
                </svg>
              </button>
              <button
                v-if="!card.done"
                type="button"
                class="upcoming-card__pin"
                :class="{ 'is-active': card.pinned }"
                :aria-label="card.pinned ? '取消置顶' : '置顶'"
                :title="card.pinned ? '取消置顶' : '置顶'"
                @click="togglePin(card, $event)"
              >
                <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                  <path
                    d="M9.8 1.6l4.6 4.6-1.1 1.1-1.2-.3-2.4 2.4.4 3.3-1.1 1.1-3.2-3.2-2.7 2.7-.9-.9 2.7-2.7-3.2-3.2 1.1-1.1 3.3.4 2.4-2.4-.3-1.2 1.1-1.1z"
                    fill="currentColor"
                  />
                </svg>
              </button>
              <button
                type="button"
                class="upcoming-card__done"
                :class="{ 'is-active': card.done }"
                :aria-label="card.done ? '标为未完成' : '标为已完成'"
                :title="card.done ? '标为未完成' : '标为已完成'"
                @click="toggleDone(card, $event)"
              >
                <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                  <path
                    d="M6.4 11.3L2.9 7.8l1.1-1.1 2.4 2.4 5.1-5.1 1.1 1.1-6.2 6.2z"
                    fill="currentColor"
                  />
                </svg>
              </button>
              <button
                type="button"
                class="upcoming-card__delete"
                aria-label="删除卡片"
                title="删除"
                @click="requestDelete(card, $event)"
              >
                <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                  <path
                    d="M6 2.5h4l.5 1.5H13v1.5H3V4h2.5L6 2.5zm1 3.5v6.5h1.5V6H7zm3 0v6.5H11.5V6H10zM4.5 14.5h7V6.5h-7v8z"
                    fill="currentColor"
                  />
                </svg>
              </button>
            </div>

            <span
              v-else-if="card.done"
              class="upcoming-card__done-badge"
              title="已完成"
            >
              <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                <path
                  d="M6.4 11.3L2.9 7.8l1.1-1.1 2.4 2.4 5.1-5.1 1.1 1.1-6.2 6.2z"
                  fill="currentColor"
                />
              </svg>
            </span>
            <span
              v-else-if="card.pinned"
              class="upcoming-card__pin-badge"
              title="已置顶"
            >
              <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                <path
                  d="M9.8 1.6l4.6 4.6-1.1 1.1-1.2-.3-2.4 2.4.4 3.3-1.1 1.1-3.2-3.2-2.7 2.7-.9-.9 2.7-2.7-3.2-3.2 1.1-1.1 3.3.4 2.4-2.4-.3-1.2 1.1-1.1z"
                  fill="currentColor"
                />
              </svg>
            </span>

            <div
              class="upcoming-card__body"
              :role="canEdit ? 'button' : undefined"
              :tabindex="canEdit ? 0 : undefined"
              @click="openCard(card.id)"
              @keydown.enter="openCard(card.id)"
              @keydown.space.prevent="openCard(card.id)"
            >
              <h3 class="upcoming-card__title">{{ card.title }}</h3>
              <div
                class="upcoming-card__excerpt prose-moon"
                v-html="upcomingStore.cardPreview(card)"
              />
              <time class="upcoming-card__time" :datetime="card.updatedAt">
                <span class="upcoming-card__time-date">{{ formatCardTimeParts(card.updatedAt).date }}</span>
                <span class="upcoming-card__time-clock">{{ formatCardTimeParts(card.updatedAt).time }}</span>
              </time>
            </div>
          </article>
        </ScrollReveal>
      </div>
    </div>

    <ScrollReveal
      v-if="!canEdit"
      tag="p"
      class="upcoming-grid__hint text-subtle"
      :animation="MOTION_CATEGORY.upcomingHint.animation"
      :speed="MOTION_CATEGORY.upcomingHint.speed"
      :delay="(upcomingStore.cards.length + 1) * MOTION_STAGGER.card"
    >
      解锁后可编辑卡片；拖拽排序、置顶、完成与删除仅在解锁后可用。
    </ScrollReveal>

    <ConfirmDialog
      v-model:open="deleteConfirmOpen"
      title="删除卡片"
      :message="deleteConfirmMessage"
      confirm-text="删除"
      danger
      @confirm="confirmDelete"
    />

    <el-dialog
      v-model="upcomingStore.editorOpen"
      class="upcoming-editor-dialog"
      :title="upcomingStore.editorMode === 'create' ? '新建优化项' : upcomingStore.draftTitle"
      width="min(48rem, 92vw)"
      destroy-on-close
      @close="handleDialogClose"
      @closed="upcomingStore.closeEditor()"
    >
      <div class="upcoming-editor-dialog__editor">
        <MarkdownEditor
          ref="editorRef"
          :model-value="upcomingStore.draftContent"
          autofocus
          hide-toolbar
          lock-first-heading
          @update:model-value="upcomingStore.setDraftContent"
          @blur="handleEditorBlur"
        />
      </div>
    </el-dialog>
  </section>
</template>

<style scoped lang="scss">
.upcoming-grid-wrap {
  width: 100%;
}

.upcoming-grid {
  display: grid;
  width: 100%;
  gap: 1.25rem;
  grid-template-columns: minmax(0, 1fr);

  > .upcoming-grid__compose,
  > .upcoming-grid__item {
    display: flex;
    min-width: 0;
  }

  :deep(.motion-animate) {
    display: flex;
    min-width: 0;
    width: 100%;
  }

  @media (min-width: 640px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.upcoming-grid__item {
  &--ghost .upcoming-card {
    opacity: 0.35;
  }

  &--chosen .upcoming-card {
    box-shadow:
      0 16px 36px -12px color-mix(in srgb, var(--color-accent) 28%, transparent),
      0 0 0 1px color-mix(in srgb, var(--color-accent) 16%, transparent);
  }

  &--drag {
    opacity: 1;
  }
}

.upcoming-grid__hint {
  margin: 1rem 0 0;
  font-size: 0.875rem;
}

.upcoming-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 0.5rem;
  width: 100%;
  min-height: 9.5rem;
  aspect-ratio: 1;
  padding: 1.25rem;
  text-align: left;
  cursor: default;
  border: none;
  font: inherit;
  color: inherit;
  overflow: hidden;
  transition:
    transform 0.34s cubic-bezier(0.22, 1, 0.36, 1),
    border-color 0.3s ease,
    box-shadow 0.34s ease,
    background-color 0.3s ease;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 0;
    background: linear-gradient(
      135deg,
      color-mix(in srgb, var(--color-accent) 12%, transparent) 0%,
      transparent 55%
    );
    opacity: 0;
    transition: opacity 0.35s ease;
    pointer-events: none;
  }

  &:not(.is-disabled):hover {
    transform: translateY(-5px);
    border-color: color-mix(in srgb, var(--color-accent) 34%, var(--color-glass-border));
    box-shadow:
      0 14px 32px -10px color-mix(in srgb, var(--color-accent) 24%, transparent),
      0 0 0 1px color-mix(in srgb, var(--color-accent) 10%, transparent);

    &::after {
      opacity: 1;
    }
  }

  &:not(.is-disabled):focus-visible {
    outline: 2px solid color-mix(in srgb, var(--color-accent) 50%, transparent);
    outline-offset: 3px;
  }

  &.is-disabled {
    cursor: default;
    opacity: 0.92;
  }

  &.is-pinned {
    border-color: color-mix(in srgb, var(--color-accent) 34%, var(--color-glass-border));
  }

  &.is-done {
    opacity: 0.7;
    border-style: dashed;
    border-color: color-mix(in srgb, var(--color-text-muted) 42%, var(--color-glass-border));
    background: color-mix(in srgb, var(--color-glass-bg) 88%, var(--color-text-muted) 12%);
    box-shadow: none;
  }

  &.is-done:not(.is-disabled):hover {
    transform: none;
    border-color: color-mix(in srgb, var(--color-text-muted) 52%, var(--color-glass-border));
    box-shadow: none;

    &::after {
      opacity: 0;
    }
  }

  &.is-done &__title {
    color: var(--color-text-muted);
  }

  &.is-done &__excerpt,
  &.is-done &__time {
    color: var(--color-text-muted);
    opacity: 0.78;
  }

  &__pin-badge,
  &__done-badge,
  &__compose-icon,
  &__compose-label,
  &__compose-hint,
  &__body,
  &__title,
  &__excerpt,
  &__time {
    position: relative;
    z-index: 1;
  }

  &__body {
    display: flex;
    flex: 1;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
    width: 100%;
    min-height: 0;
    cursor: inherit;

    &:focus-visible {
      outline: none;
    }
  }

  &:not(.is-disabled) &__body {
    cursor: pointer;
  }

  &__actions {
    position: absolute;
    top: 0.65rem;
    right: 0.65rem;
    z-index: 6;
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    opacity: 0.72;
    transition: opacity 0.2s ease;
  }

  &:hover &__actions,
  &:focus-within &__actions {
    opacity: 1;
  }

  &__drag,
  &__pin,
  &__done,
  &__delete {
    position: relative;
    z-index: 1;
    display: inline-flex;
    flex: 0 0 1.85rem;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    width: 1.85rem;
    height: 1.85rem;
    min-width: 1.85rem;
    min-height: 1.85rem;
    max-width: 1.85rem;
    max-height: 1.85rem;
    padding: 0;
    border: none;
    border-radius: 9999px;
    background: color-mix(in srgb, var(--color-glass-bg) 92%, var(--color-heading) 8%);
    color: var(--color-text-subtle);
    cursor: pointer;
    pointer-events: auto;
    transition:
      color 0.2s ease,
      background-color 0.2s ease;

    svg {
      display: block;
      width: 0.95rem;
      height: 0.95rem;
      flex: 0 0 0.95rem;
      pointer-events: none;
    }
  }

  &__drag {
    cursor: grab;

    &:active {
      cursor: grabbing;
    }

    &:hover {
      color: var(--color-heading);
      background: color-mix(in srgb, var(--color-heading) 8%, transparent);
    }
  }

  &__pin {
    &:hover {
      color: var(--color-accent);
      background: color-mix(in srgb, var(--color-accent) 12%, transparent);
    }

    &.is-active {
      color: var(--color-accent-text);
      background: var(--color-accent);
    }
  }

  &__done {
    &:hover {
      color: #5f8a66;
      background: color-mix(in srgb, #6b8f71 14%, transparent);
    }

    &.is-active {
      color: #f7faf7;
      background: #6b8f71;
    }
  }

  &__delete:hover {
    color: #e06c75;
    background: color-mix(in srgb, #e06c75 12%, transparent);
  }

  &__pin-badge,
  &__done-badge {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    z-index: 6;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.85rem;
    height: 1.85rem;
    border-radius: 9999px;
    pointer-events: none;

    svg {
      width: 0.95rem;
      height: 0.95rem;
    }
  }

  &__pin-badge {
    color: var(--color-accent-text);
    background: var(--color-accent);
  }

  &__done-badge {
    color: #f7faf7;
    background: #6b8f71;
  }

  &--compose {
    align-items: center;
    justify-content: center;
    border: 1px dashed color-mix(in srgb, var(--color-accent) 45%, var(--color-border));
    background: color-mix(in srgb, var(--color-accent) 4%, var(--color-glass-bg));

    &::after {
      background: radial-gradient(
        circle at 50% 40%,
        color-mix(in srgb, var(--color-accent) 16%, transparent) 0%,
        transparent 68%
      );
    }
  }

  &:not(.is-disabled).upcoming-card--compose:hover {
    border-style: solid;
    background: color-mix(in srgb, var(--color-accent) 9%, var(--color-glass-bg));
  }

  &__compose-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 9999px;
    background: color-mix(in srgb, var(--color-accent) 14%, transparent);
    color: var(--color-accent-soft);
    font-size: 1.75rem;
    line-height: 1;
    transition:
      transform 0.42s cubic-bezier(0.22, 1, 0.36, 1),
      background-color 0.3s ease,
      color 0.3s ease,
      box-shadow 0.35s ease;
  }

  &:not(.is-disabled):hover &__compose-icon {
    transform: scale(1.12) rotate(90deg);
    background: color-mix(in srgb, var(--color-accent) 24%, transparent);
    color: var(--color-accent);
    box-shadow: 0 6px 18px -4px color-mix(in srgb, var(--color-accent) 35%, transparent);
  }

  &__compose-label {
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-heading);
    transition: color 0.3s ease, transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
  }

  &:not(.is-disabled):hover &__compose-label {
    color: var(--color-accent-soft);
    transform: translateY(-2px);
  }

  &__compose-hint {
    font-size: 0.8125rem;
    color: var(--color-text-muted);
    transition: color 0.3s ease, opacity 0.3s ease;
  }

  &:not(.is-disabled):hover &__compose-hint {
    color: var(--color-text-subtle);
    opacity: 0.92;
  }

  &__title {
    margin: 0;
    width: 100%;
    padding-right: 7.25rem;
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-heading);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    transition: color 0.3s ease, transform 0.32s cubic-bezier(0.22, 1, 0.36, 1);
  }

  &:not(.is-disabled):hover &__title {
    color: var(--color-accent-soft);
    transform: translateX(4px);
  }

  &__excerpt {
    flex: 1;
    margin: 0;
    width: 100%;
    min-height: 0;
    overflow: hidden;
    font-size: 0.8125rem;
    line-height: 1.5;
    color: var(--color-text-muted);
    mask-image: linear-gradient(to bottom, #000 72%, transparent 100%);

    :deep(p),
    :deep(ul),
    :deep(ol),
    :deep(h1),
    :deep(h2),
    :deep(h3),
    :deep(h4),
    :deep(blockquote),
    :deep(pre) {
      margin-top: 0.35em;
      margin-bottom: 0.35em;
    }

    :deep(h1),
    :deep(h2),
    :deep(h3),
    :deep(h4) {
      font-size: 0.875rem;
      line-height: 1.35;
    }

    :deep(ul),
    :deep(ol) {
      padding-left: 1.15em;
    }

    :deep(li) {
      margin: 0.15em 0;
    }

    :deep(p:first-child),
    :deep(ul:first-child),
    :deep(ol:first-child),
    :deep(h1:first-child),
    :deep(h2:first-child),
    :deep(h3:first-child) {
      margin-top: 0;
    }

    :deep(.upcoming-card-preview__empty) {
      margin: 0;
      color: var(--color-text-muted);
    }

    :deep(img) {
      display: none;
    }
  }

  &__time {
    display: inline-flex;
    align-items: baseline;
    gap: 0.625rem;
    margin-top: auto;
    font-size: 0.8125rem;
    color: var(--color-text-muted);
    transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
  }

  &:not(.is-disabled):hover &__time {
    transform: translateY(-2px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .upcoming-card {
    transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;

    &:not(.is-disabled):hover {
      transform: none;
    }

    &:not(.is-disabled):hover &__compose-icon,
    &:not(.is-disabled):hover &__compose-label,
    &:not(.is-disabled):hover &__title,
    &:not(.is-disabled):hover &__time {
      transform: none;
    }
  }
}

.upcoming-editor-dialog {
  &__editor {
    :deep(.markdown-editor) {
      min-height: 20rem;
    }
  }
}
</style>

<style lang="scss">
.upcoming-editor-dialog {
  .el-dialog__footer {
    display: none;
  }
}
</style>
