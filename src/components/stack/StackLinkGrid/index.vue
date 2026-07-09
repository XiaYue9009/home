<script setup>
import ScrollReveal from '@/components/motion/ScrollReveal/index.vue';
import { stackLinksByGroup } from '@/config/stack.js';
import { MOTION_CATEGORY, MOTION_STAGGER, ENTRANCE_POOL } from '@/lib/motion/presets.js';

const groups = stackLinksByGroup();
</script>

<template>
  <div class="stack-link-layout">
    <section v-for="group in groups" :key="group.key" class="stack-link-group">
      <ScrollReveal
        tag="h2"
        class="stack-link-group__title font-display text-xl font-semibold text-heading"
        :animation="MOTION_CATEGORY.sectionTitle.animation"
        :speed="MOTION_CATEGORY.sectionTitle.speed"
      >
        {{ group.label }}
      </ScrollReveal>

      <div class="stack-link-grid">
        <ScrollReveal
          v-for="(link, index) in group.links"
          :key="link.key"
          :animation="ENTRANCE_POOL.categoryCard[index % ENTRANCE_POOL.categoryCard.length]"
          :delay="index * MOTION_STAGGER.card"
        >
          <article
            class="stack-link-card glass-card"
            :style="{ '--card-accent': link.accent }"
          >
            <div class="stack-link-card__head">
              <span class="stack-link-card__icon" aria-hidden="true">{{ link.emoji }}</span>
              <h3 class="stack-link-card__title font-display text-lg font-semibold text-heading">
                {{ link.label }}
              </h3>
            </div>
            <p class="stack-link-card__desc text-sm text-muted">
              {{ link.description }}
            </p>
            <div class="stack-link-card__actions">
              <RouterLink
                :to="`/stack/${link.key}`"
                class="stack-link-card__action stack-link-card__action--detail"
              >
                <span>查看详情</span>
                <span aria-hidden="true">→</span>
              </RouterLink>
              <a
                :href="link.href"
                target="_blank"
                rel="noopener noreferrer"
                class="stack-link-card__action stack-link-card__action--external"
              >
                <span>打开链接</span>
                <span aria-hidden="true">↗</span>
              </a>
            </div>
          </article>
        </ScrollReveal>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.stack-link-layout {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

.stack-link-group {
  display: flex;
  flex-direction: column;
  gap: 1rem;

  &__title {
    margin: 0;
  }
}

.stack-link-grid {
  display: grid;
  gap: 1.25rem;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.stack-link-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
  height: 100%;
  padding: 1.25rem 1.35rem;
  text-align: left;
  border-radius: 1rem;
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

  &__head {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    min-width: 0;
  }

  &__icon {
    flex-shrink: 0;
    font-size: 1.65rem;
    line-height: 1;
  }

  &__title {
    margin: 0;
    line-height: 1.3;
    min-width: 0;
  }

  &__desc {
    margin: 0;
    line-height: 1.55;
    flex: 1;
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem 1.1rem;
    margin-top: auto;
    padding-top: 0.25rem;
  }

  &__action {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.875rem;
    text-decoration: none;
    transition: color 0.25s ease, opacity 0.25s ease;

    &--detail {
      color: var(--card-accent);
      font-weight: 500;

      &:hover {
        opacity: 0.85;
      }
    }

    &--external {
      color: var(--color-text-muted);

      &:hover {
        color: var(--card-accent);
      }
    }
  }
}

@media (max-width: 1023px) {
  .stack-link-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 639px) {
  .stack-link-grid {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .stack-link-card:hover {
    transform: none;
  }
}
</style>
