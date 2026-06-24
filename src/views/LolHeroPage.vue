<script setup>
import LolHeroProfile from '../components/LolHeroProfile.vue';
import LolMatchupTable from '../components/LolMatchupTable.vue';
import { FEATURED_LOL_HERO_IDS, fetchLolHeroDetail } from '../lib/lol.js';
import { getLolMatchups } from '../data/lol-matchups';
import { SITE } from '../config/consts';

const props = defineProps({
  heroId: { type: String, required: true },
});

const router = useRouter();

const hero = ref(null);
const loading = ref(true);
const error = ref(false);

const matchups = computed(() => getLolMatchups(props.heroId));

async function loadHero(id) {
  loading.value = true;
  error.value = false;

  if (!FEATURED_LOL_HERO_IDS.includes(id)) {
    error.value = true;
    loading.value = false;
    return;
  }

  try {
    hero.value = await fetchLolHeroDetail(id);
    document.title = `${hero.value.name} · LOL · ${SITE.title}`;
  } catch {
    error.value = true;
    hero.value = null;
  } finally {
    loading.value = false;
  }
}

function goList() {
  router.push('/lol');
}

watch(
  () => props.heroId,
  (id) => {
    if (id) loadHero(id);
  },
  { immediate: true },
);
</script>

<template>
  <div class="lol-detail-page">
    <div class="lol-detail-page__shell mx-auto w-full max-w-[100rem] px-4 sm:px-6">
      <button type="button" class="lol-detail-page__back text-link text-sm" @click="goList">
        ← 返回 LOL
      </button>

      <p v-if="loading" class="text-muted">加载英雄…</p>
      <p v-else-if="error" class="text-muted">英雄数据加载失败。</p>

      <div v-else-if="hero" class="lol-detail-grid">
        <LolHeroProfile :hero="hero" compact art-only />
        <div class="lol-detail-grid__main">
          <LolHeroProfile :hero="hero" bar-text />
          <div class="lol-detail-grid__panel">
            <LolMatchupTable
              compact
              :matchups="matchups"
              :hero-name="hero.name"
              :hero-id="heroId"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.lol-detail-page {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  padding-block: 0.25rem 0.35rem;

  &__shell {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
  }

  &__back {
    align-self: flex-start;
    flex-shrink: 0;
    margin: 0 0 0.4rem;
    white-space: nowrap;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    font: inherit;
    text-align: left;
  }
}

.lol-detail-grid {
  display: grid;
  flex: 1;
  gap: 0.5rem;
  min-height: 0;
  overflow: hidden;

  > * {
    min-height: 0;
    min-width: 0;
  }

  @media (min-width: 1024px) {
    grid-template-columns: minmax(220px, 280px) minmax(0, 1fr);
    align-items: stretch;
  }

  @media (max-width: 1023px) {
    grid-template-rows: minmax(5.5rem, 12vh) minmax(0, 1fr);
  }

  &__main {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    min-height: 0;
    overflow: hidden;

    > :first-child {
      flex-shrink: 0;

      :deep(.lol-hero-profile__bar-summary) {
        padding: 0.3rem 0.65rem;
      }
    }
  }

  &__panel {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;

    :deep(.lol-matchup-panel) {
      display: flex;
      flex: 1;
      flex-direction: column;
      min-height: 0;
      overflow: hidden;
    }
  }
}
</style>
