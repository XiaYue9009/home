<script setup>
import SystemToolPanel from '@/components/tools/SystemToolPanel/index.vue';
import { SYSTEM_TOOLS } from '@/config/tools.js';
import { MOTION_STAGGER, ENTRANCE_POOL } from '@/lib/motion/presets.js';

const activeTool = ref(null);

function openDemo(tool) {
  activeTool.value = tool;
}

function closeDrawer() {
  activeTool.value = null;
}
</script>

<template>
  <div class="system-tool-layout">
    <ScrollReveal
      v-for="(tool, index) in SYSTEM_TOOLS"
      :key="tool.key"
      :animation="ENTRANCE_POOL.categoryCard[index % ENTRANCE_POOL.categoryCard.length]"
      :delay="index * MOTION_STAGGER.card"
    >
      <button
        type="button"
        class="system-tool-card glass-card"
        :style="{ '--card-accent': tool.accent }"
        @click="openDemo(tool)"
      >
        <span class="system-tool-card__icon" aria-hidden="true">{{ tool.emoji }}</span>
        <div class="system-tool-card__body">
          <h3 class="system-tool-card__title font-display text-lg font-semibold text-heading">
            {{ tool.label }}
          </h3>
          <p class="system-tool-card__desc text-sm text-muted">
            {{ tool.description }}
          </p>
          <p class="system-tool-card__action text-sm text-muted">
            <span>查看 Demo</span>
            <span class="system-tool-card__arrow" aria-hidden="true">→</span>
          </p>
        </div>
      </button>
    </ScrollReveal>

    <el-drawer
      :model-value="Boolean(activeTool)"
      class="system-tool-drawer"
      :title="activeTool?.label"
      direction="rtl"
      size="min(52rem, 94vw)"
      append-to-body
      destroy-on-close
      @update:model-value="(open) => !open && closeDrawer()"
    >
      <SystemToolPanel v-if="activeTool" :tool="activeTool" in-drawer />
    </el-drawer>
  </div>
</template>

<style scoped lang="scss">
.system-tool-layout {
  display: grid;
  gap: 1.25rem;
  max-width: 52rem;
  grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));
}

.system-tool-card {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  width: 100%;
  height: 100%;
  padding: 1.35rem 1.5rem;
  text-align: left;
  border-radius: 1rem;
  cursor: pointer;
  transition:
    transform 0.38s cubic-bezier(0.22, 1, 0.36, 1),
    border-color 0.3s ease,
    box-shadow 0.38s ease,
    background-color 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    border-color: color-mix(in srgb, var(--card-accent) 28%, transparent);
    background-color: color-mix(in srgb, var(--color-glass-bg) 94%, var(--card-accent) 6%);
    box-shadow:
      0 12px 28px -14px color-mix(in srgb, var(--card-accent) 35%, transparent),
      0 0 0 1px color-mix(in srgb, var(--card-accent) 12%, transparent);
  }

  &:focus-visible {
    outline: 2px solid color-mix(in srgb, var(--card-accent) 55%, transparent);
    outline-offset: 3px;
  }

  &__icon {
    font-size: 2rem;
    line-height: 1;
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    flex: 1;
  }

  &__title {
    margin: 0;
    line-height: 1.3;
  }

  &__desc {
    margin: 0;
    line-height: 1.55;
  }

  &__action {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    margin: auto 0 0;
    padding-top: 0.35rem;
    transition: color 0.3s ease;
  }

  &:hover &__action {
    color: var(--card-accent);
  }

  &__arrow {
    display: inline-block;
    opacity: 0.55;
    transition:
      transform 0.35s cubic-bezier(0.22, 1, 0.36, 1),
      opacity 0.3s ease;
  }

  &:hover &__arrow {
    opacity: 1;
    transform: translateX(4px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .system-tool-card:hover {
    transform: none;
  }

  .system-tool-card:hover .system-tool-card__arrow {
    transform: none;
  }
}
</style>

<style lang="scss">
.system-tool-drawer {
  .system-tool-demo__editor :deep(.markdown-editor) {
    min-height: 16rem;
  }
}
</style>
