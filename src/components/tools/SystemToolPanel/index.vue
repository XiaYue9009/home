<script setup>
import { resolveToolDemoComponent } from '@/config/tool-demos.js';

const props = defineProps({
  tool: { type: Object, required: true },
  inDrawer: { type: Boolean, default: false },
});

const demoComponent = computed(() => resolveToolDemoComponent(props.tool.demoKey));
const demoProps = computed(() => {
  if (props.tool.demoKey === 'markdown-editor') {
    return {
      hint: props.tool.demo?.hint,
      content: props.tool.demo?.content,
    };
  }
  if (props.tool.demoKey === 'github-image' || props.tool.demoKey === 'picgo') {
    return { links: props.tool.links };
  }
  return {};
});
</script>

<template>
  <div class="system-tool-panel" :class="{ 'system-tool-panel--drawer': inDrawer }">
    <p v-if="inDrawer" class="system-tool-panel__summary text-sm text-muted">
      {{ tool.description }}
    </p>

    <header v-else class="system-tool-panel__header">
      <span class="system-tool-panel__icon" aria-hidden="true">{{ tool.emoji }}</span>
      <div>
        <h2 class="system-tool-panel__title font-display text-xl font-semibold text-heading">
          {{ tool.label }}
        </h2>
        <p class="system-tool-panel__summary text-sm text-muted">
          {{ tool.description }}
        </p>
      </div>
    </header>

    <section class="system-tool-panel__section">
      <h3 class="system-tool-panel__section-title">交互 Demo</h3>
      <component :is="demoComponent" v-bind="demoProps" />
    </section>

    <div class="system-tool-panel__columns">
      <section class="system-tool-panel__section">
        <h3 class="system-tool-panel__section-title">功能点</h3>
        <ul class="system-tool-panel__list">
          <li v-for="item in tool.features" :key="item">
            {{ item }}
          </li>
        </ul>
      </section>

      <section class="system-tool-panel__section">
        <h3 class="system-tool-panel__section-title">实现思路</h3>
        <ul class="system-tool-panel__list system-tool-panel__list--impl">
          <li v-for="item in tool.implementation" :key="item">
            {{ item }}
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.system-tool-panel {
  &--drawer {
    .system-tool-panel__summary {
      margin: 0 0 1rem;
      line-height: 1.55;
    }
  }

  &:not(&--drawer) {
    padding: 1.35rem 1.5rem;
    border-radius: 1rem;
  }

  &__header {
    display: flex;
    align-items: flex-start;
    gap: 0.85rem;
    margin-bottom: 1.25rem;
  }

  &__icon {
    font-size: 2rem;
    line-height: 1;
  }

  &__title {
    margin: 0;
    line-height: 1.3;
  }

  &__summary {
    margin: 0.35rem 0 0;
    line-height: 1.55;
  }

  &__section {
    margin-bottom: 1.25rem;

    &:last-child {
      margin-bottom: 0;
    }
  }

  &__section-title {
    margin: 0 0 0.65rem;
    font-size: 0.8125rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--color-text-subtle);
  }

  &__columns {
    display: grid;
    gap: 1.25rem;

    @media (min-width: 768px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  &__list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.55rem;

    li {
      position: relative;
      padding-left: 1rem;
      font-size: 0.875rem;
      line-height: 1.55;
      color: var(--color-text-muted);

      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0.55rem;
        width: 0.35rem;
        height: 0.35rem;
        border-radius: 50%;
        background: #6366f1;
      }
    }

    &--impl li::before {
      background: #38bdf8;
    }
  }
}
</style>
