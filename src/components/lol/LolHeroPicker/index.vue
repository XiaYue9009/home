<script setup>
import { fetchLolHeroList } from '@/lib/lol/matchup.js';

const props = defineProps({
  open: { type: Boolean, default: false },
  excludeIds: { type: Array, default: () => [] },
  title: { type: String, default: '选择英雄' },
});

const emit = defineEmits(['update:open', 'select']);

const heroes = ref([]);
const loading = ref(false);
const query = ref('');

const excludeSet = computed(() => new Set(props.excludeIds.map(String)));

const filteredHeroes = computed(() => {
  const q = query.value.trim().toLowerCase();
  let list = heroes.value.filter((hero) => !excludeSet.value.has(String(hero.id)));

  if (q) {
    list = list.filter((hero) =>
      [hero.name, hero.fullName, hero.alias, hero.keywords]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q)),
    );
  }

  return [...list].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'zh-CN'));
});

function close() {
  emit('update:open', false);
}

function selectHero(hero) {
  emit('select', hero);
  close();
}

watch(
  () => props.open,
  async (visible) => {
    if (!visible) {
      query.value = '';
      return;
    }

    if (heroes.value.length) return;

    loading.value = true;
    try {
      heroes.value = await fetchLolHeroList();
    } catch {
      heroes.value = [];
    } finally {
      loading.value = false;
    }
  },
);
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="lol-hero-picker">
      <button type="button" class="lol-hero-picker__backdrop" aria-label="关闭" @click="close" />
      <div class="lol-hero-picker__panel" role="dialog" aria-modal="true" :aria-label="title">
        <div class="lol-hero-picker__head">
          <h3>{{ title }}</h3>
          <button type="button" class="lol-hero-picker__close" aria-label="关闭" @click="close">
            ×
          </button>
        </div>

        <input
          v-model="query"
          type="search"
          class="lol-hero-picker__search"
          placeholder="搜索英雄…"
          autofocus
        />

        <p v-if="loading" class="lol-hero-picker__status text-muted">加载英雄列表…</p>
        <p v-else-if="filteredHeroes.length === 0" class="lol-hero-picker__status text-muted">
          没有可添加的英雄。
        </p>

        <div v-else class="lol-hero-picker__grid">
          <button
            v-for="hero in filteredHeroes"
            :key="hero.id"
            type="button"
            class="lol-hero-picker__option"
            @click="selectHero(hero)"
          >
            <img :src="hero.icon" :alt="hero.name" />
            <span>{{ hero.name }}</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
.lol-hero-picker {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;

  &__backdrop {
    position: absolute;
    inset: 0;
    border: none;
    background: rgba(8, 14, 22, 0.45);
    cursor: pointer;
  }

  &__panel {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    width: min(42rem, 100%);
    max-height: min(80vh, 36rem);
    padding: 1rem;
    border-radius: 1rem;
    border: 1px solid var(--color-glass-border);
    background: var(--color-glass-bg);
    box-shadow: 0 16px 48px rgba(8, 14, 22, 0.24);
    backdrop-filter: blur(12px);
  }

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    margin-bottom: 0.75rem;

    h3 {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
      color: var(--color-heading);
    }
  }

  &__close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border: none;
    border-radius: 9999px;
    background: transparent;
    color: var(--color-text-muted);
    font-size: 1.25rem;
    line-height: 1;
    cursor: pointer;

    &:hover {
      background: var(--color-glass-bg);
      color: var(--color-heading);
    }
  }

  &__search {
    width: 100%;
    margin-bottom: 0.75rem;
    padding: 0.55rem 0.75rem;
    border-radius: 0.75rem;
    border: 1px solid var(--color-border);
    background: var(--color-bg);
    color: var(--color-heading);
    font: inherit;

    &:focus {
      outline: none;
      border-color: color-mix(in srgb, var(--color-accent) 45%, transparent);
    }
  }

  &__status {
    margin: 0;
    padding: 1rem 0;
    text-align: center;
    font-size: 0.875rem;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(4.5rem, 1fr));
    gap: 0.5rem;
    overflow: auto;
    padding-right: 0.15rem;
  }

  &__option {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.35rem;
    padding: 0.5rem 0.35rem;
    border: 1px solid transparent;
    border-radius: 0.75rem;
    background: transparent;
    cursor: pointer;
    transition:
      transform 0.32s cubic-bezier(0.22, 1, 0.36, 1),
      border-color 0.25s ease,
      background-color 0.25s ease,
      box-shadow 0.32s ease;

    img {
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 9999px;
      object-fit: cover;
      transition:
        transform 0.35s cubic-bezier(0.22, 1, 0.36, 1),
        box-shadow 0.35s ease;
    }

    span {
      max-width: 100%;
      font-size: 0.6875rem;
      line-height: 1.2;
      text-align: center;
      color: var(--color-text-muted);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      transition: color 0.25s ease, transform 0.3s ease;
    }

    &:hover {
      transform: translateY(-4px);
      border-color: color-mix(in srgb, var(--color-accent) 38%, transparent);
      background: color-mix(in srgb, var(--color-accent) 10%, transparent);
      box-shadow: 0 10px 22px -8px color-mix(in srgb, var(--color-accent) 28%, transparent);

      img {
        transform: scale(1.1);
        box-shadow: 0 0 14px color-mix(in srgb, var(--color-accent) 38%, transparent);
      }

      span {
        color: var(--color-heading);
        transform: translateY(-1px);
      }
    }

    &:focus-visible {
      outline: 2px solid color-mix(in srgb, var(--color-accent) 50%, transparent);
      outline-offset: 2px;
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .lol-hero-picker__option {
    transition: border-color 0.2s ease, background-color 0.2s ease;

    &:hover {
      transform: none;
    }

    &:hover img,
    &:hover span {
      transform: none;
    }
  }
}
</style>
