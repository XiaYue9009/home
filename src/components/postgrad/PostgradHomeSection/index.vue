<script setup>
import ScrollReveal from '@/components/motion/ScrollReveal/index.vue';
import {
  POSTGRAD_TARGET,
  POSTGRAD_STRATEGY,
  POSTGRAD_EXTERNAL_LINKS,
  POSTGRAD_SUBJECTS,
} from '@/config/postgrad.js';
import { MOTION_HOME, MOTION_STAGGER, ENTRANCE_POOL } from '@/lib/motion/presets.js';

const primaryLinks = POSTGRAD_EXTERNAL_LINKS;
</script>

<template>
  <section class="page-shell page-shell--section">
    <ScrollReveal
      class="postgrad-home__header"
      :animation="MOTION_HOME.postsTitle.animation"
      :speed="MOTION_HOME.postsTitle.speed"
    >
      <div class="postgrad-home__title-row">
        <h2 class="font-display text-2xl font-bold text-heading">考研备战</h2>
        <RouterLink to="/postgrad" class="postgrad-home__more text-sm text-link">
          查看全部 →
        </RouterLink>
      </div>
      <p class="postgrad-home__subtitle text-sm text-muted">
        {{ POSTGRAD_TARGET.university }} · {{ POSTGRAD_TARGET.majorName }}（{{ POSTGRAD_TARGET.majorCode }}）
        — {{ POSTGRAD_STRATEGY.headline }}
      </p>
    </ScrollReveal>

    <ScrollReveal
      class="postgrad-home__strategy glass-card"
      :animation="MOTION_HOME.postsTitle.animation"
      :speed="MOTION_HOME.postsTitle.speed"
    >
      <p class="postgrad-home__strategy-text text-sm text-muted">
        {{ POSTGRAD_STRATEGY.summary }}
      </p>
      <div class="postgrad-home__phases">
        <div
          v-for="phase in POSTGRAD_STRATEGY.phases"
          :key="phase.key"
          class="postgrad-home__phase"
          :style="{ '--phase-accent': phase.accent }"
        >
          <span class="postgrad-home__phase-label">{{ phase.label }}</span>
          <span class="postgrad-home__phase-goal">{{ phase.goal }}</span>
        </div>
      </div>
    </ScrollReveal>

    <div class="postgrad-home__links">
      <ScrollReveal
        v-for="(link, index) in primaryLinks"
        :key="link.key"
        :animation="ENTRANCE_POOL.categoryCard[index % ENTRANCE_POOL.categoryCard.length]"
        :delay="index * MOTION_STAGGER.card"
      >
        <a
          :href="link.href"
          target="_blank"
          rel="noopener noreferrer"
          class="postgrad-home__link glass-card"
          :style="{ '--card-accent': link.accent }"
        >
          <span class="postgrad-home__link-icon" aria-hidden="true">{{ link.emoji }}</span>
          <span class="postgrad-home__link-label">{{ link.label }}</span>
        </a>
      </ScrollReveal>
    </div>

    <div class="postgrad-home__subjects">
      <ScrollReveal
        v-for="(subject, index) in POSTGRAD_SUBJECTS"
        :key="subject.code"
        :animation="ENTRANCE_POOL.categoryCard[index % ENTRANCE_POOL.categoryCard.length]"
        :delay="index * MOTION_STAGGER.card"
      >
        <div
          class="postgrad-home__subject glass-card"
          :style="{ '--card-accent': subject.accent }"
        >
          <span class="postgrad-home__subject-code">{{ subject.code }}</span>
          <span class="postgrad-home__subject-name">{{ subject.name }}</span>
          <span class="postgrad-home__subject-score">{{ subject.score }}分</span>
        </div>
      </ScrollReveal>
    </div>
  </section>
</template>

<style scoped lang="scss">
.postgrad-home__header {
  margin-bottom: 1rem;
}

.postgrad-home__title-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem 1rem;
  margin-bottom: 0.35rem;
}

.postgrad-home__subtitle {
  margin: 0;
  line-height: 1.55;
}

.postgrad-home__more {
  text-decoration: none;
  white-space: nowrap;

  &:hover {
    opacity: 0.85;
  }
}

.postgrad-home__strategy {
  margin-bottom: 1.25rem;
  padding: 1.15rem 1.35rem;
  border-left: 3px solid #c084fc;
}

.postgrad-home__strategy-text {
  margin: 0 0 0.85rem;
  line-height: 1.6;
}

.postgrad-home__phases {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
}

.postgrad-home__phase {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.75rem;
  font-size: 0.8125rem;
  border-radius: 9999px;
  background: color-mix(in srgb, var(--phase-accent) 8%, var(--color-glass-bg));
  border: 1px solid color-mix(in srgb, var(--phase-accent) 16%, transparent);
}

.postgrad-home__phase-label {
  font-weight: 600;
  color: var(--phase-accent);
}

.postgrad-home__phase-goal {
  color: var(--color-text-muted);
}

.postgrad-home__links {
  display: grid;
  gap: 0.85rem;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-bottom: 1.25rem;
}

.postgrad-home__link {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.85rem 1rem;
  text-decoration: none;
  border-radius: 0.75rem;
  transition:
    transform 0.3s ease,
    border-color 0.3s ease,
    box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    border-color: color-mix(in srgb, var(--card-accent) 25%, transparent);
    box-shadow: 0 8px 20px -10px color-mix(in srgb, var(--card-accent) 30%, transparent);
  }
}

.postgrad-home__link-icon {
  font-size: 1.25rem;
  line-height: 1;
}

.postgrad-home__link-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-heading);
}

.postgrad-home__subjects {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.postgrad-home__subject {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.85rem 1rem;
  border-radius: 0.75rem;
}

.postgrad-home__subject-code {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--card-accent);
}

.postgrad-home__subject-name {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-heading);
  line-height: 1.3;
}

.postgrad-home__subject-score {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

@media (max-width: 1023px) {
  .postgrad-home__subjects {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 639px) {
  .postgrad-home__links,
  .postgrad-home__subjects {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .postgrad-home__link:hover {
    transform: none;
  }
}
</style>
