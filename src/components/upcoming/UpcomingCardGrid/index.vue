<script setup>
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

let saveTimer = null;

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

function openCard(cardId) {
  if (!canEdit.value) return;
  upcomingStore.openEdit(cardId);
}

function openCompose() {
  if (!canEdit.value) return;
  upcomingStore.openCreate();
}

function scheduleAutosave() {
  if (!upcomingStore.editorOpen || !canEdit.value) return;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    upcomingStore.autosaveDraft();
  }, 400);
}

watch(
  () => upcomingStore.draftContent,
  () => scheduleAutosave(),
);

watch(
  () => upcomingStore.editorOpen,
  (open) => {
    if (!open) {
      clearTimeout(saveTimer);
      return;
    }
    nextTick(() => editorRef.value?.focusEditor());
  },
);

async function handleDialogClose() {
  clearTimeout(saveTimer);
  await upcomingStore.autosaveDraft();
}

onMounted(() => {
  upcomingStore.load();
});

onBeforeUnmount(() => {
  clearTimeout(saveTimer);
});
</script>

<template>
  <section class="upcoming-grid-wrap">
    <div class="upcoming-grid">
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

      <ScrollReveal
        v-for="(card, index) in upcomingStore.cards"
        :key="card.id"
        :animation="pickCycleAnimation(index, ENTRANCE_POOL.upcoming)"
        :delay="(index + 1) * MOTION_STAGGER.card"
      >
        <article
          class="upcoming-card glass-card glass-card-hover"
          :class="{ 'is-disabled': !canEdit }"
          :role="canEdit ? 'button' : undefined"
          :tabindex="canEdit ? 0 : undefined"
          :title="canEdit ? '编辑卡片' : '请先在导航栏解锁编辑'"
          @click="openCard(card.id)"
          @keydown.enter="openCard(card.id)"
          @keydown.space.prevent="openCard(card.id)"
        >
          <button
            v-if="canEdit"
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
          <h3 class="upcoming-card__title">{{ card.title }}</h3>
          <p class="upcoming-card__excerpt">{{ upcomingStore.cardPreview(card) }}</p>
          <time class="upcoming-card__time" :datetime="card.updatedAt">
            <span class="upcoming-card__time-date">{{ formatCardTimeParts(card.updatedAt).date }}</span>
            <span class="upcoming-card__time-clock">{{ formatCardTimeParts(card.updatedAt).time }}</span>
          </time>
        </article>
      </ScrollReveal>
    </div>

    <ScrollReveal
      v-if="!canEdit"
      tag="p"
      class="upcoming-grid__hint text-subtle"
      :animation="MOTION_CATEGORY.upcomingHint.animation"
      :speed="MOTION_CATEGORY.upcomingHint.speed"
      :delay="(upcomingStore.cards.length + 1) * MOTION_STAGGER.card"
    >
      解锁后可编辑卡片；点击默认卡片新增，点击已有卡片修改。
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

  > :deep(.motion-animate) {
    display: flex;
    min-width: 0;
  }

  @media (min-width: 640px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
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
  cursor: pointer;
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
    cursor: not-allowed;
    opacity: 0.72;
  }

  &__delete,
  &__compose-icon,
  &__compose-label,
  &__compose-hint,
  &__title,
  &__excerpt,
  &__time {
    position: relative;
    z-index: 1;
  }

  &__delete {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    padding: 0;
    border: none;
    border-radius: 9999px;
    background: transparent;
    color: var(--color-text-subtle);
    cursor: pointer;
    opacity: 0;
    transition:
      opacity 0.2s ease,
      color 0.2s ease,
      background-color 0.2s ease;

    svg {
      width: 1.0625rem;
      height: 1.0625rem;
    }

    &:hover {
      color: #e06c75;
      background: color-mix(in srgb, #e06c75 12%, transparent);
    }
  }

  &:hover &__delete,
  &:focus-within &__delete {
    opacity: 1;
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
    padding-right: 2rem;
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
    font-size: 0.8125rem;
    line-height: 1.5;
    color: var(--color-text-muted);
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 4;
    overflow: hidden;
    transition: color 0.3s ease;
  }

  &:not(.is-disabled):hover &__excerpt {
    color: var(--color-text-subtle);
  }

  &__time {
    display: inline-flex;
    align-items: baseline;
    gap: 0.625rem;
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
