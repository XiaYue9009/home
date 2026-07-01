<script setup>
import { CATEGORIES } from '../../config/consts';
import { LOL_LOGO } from '../../config/lol/index.js';

const props = defineProps({
  category: { type: String, required: true },
  size: { type: String, default: 'md' },
});

const sizeClass = computed(() => ({
  sm: 'category-icon--sm',
  md: 'category-icon--md',
  lg: 'category-icon--lg',
})[props.size] || 'category-icon--md');
</script>

<template>
  <span v-if="category === 'lol'" class="category-icon lol-logo-wrap" :class="sizeClass">
    <img
      :src="size === 'sm' ? LOL_LOGO.small : LOL_LOGO.medium"
      alt="英雄联盟"
      class="lol-logo lol-logo--default"
      loading="lazy"
      decoding="async"
    />
    <img
      :src="size === 'sm' ? LOL_LOGO.smallLight : LOL_LOGO.mediumLight"
      alt="英雄联盟"
      class="lol-logo lol-logo--light"
      loading="lazy"
      decoding="async"
    />
  </span>
  <span v-else class="category-icon" :class="sizeClass">{{ CATEGORIES[category].emoji }}</span>
</template>

<style scoped lang="scss">
.category-icon {
  display: inline-flex;
  align-items: center;
  line-height: 1;

  &--sm {
    font-size: 1.5rem;
  }

  &--md {
    font-size: 2.25rem;
  }

  &--lg {
    font-size: 3rem;
  }
}

.lol-logo-wrap {
  .lol-logo {
    width: auto;
    object-fit: contain;

    &--light {
      display: none;
    }
  }

  &.category-icon--sm .lol-logo {
    height: 1.75rem;
  }

  &.category-icon--md .lol-logo {
    height: 2.5rem;
  }

  &.category-icon--lg .lol-logo {
    height: 3.5rem;
  }
}

:global([data-theme='night']) .lol-logo-wrap {
  .lol-logo--default {
    display: none;
  }

  .lol-logo--light {
    display: block;
  }
}
</style>
