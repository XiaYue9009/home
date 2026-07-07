import { defineStore } from 'pinia';
import { fetchLolHero, FALLBACK_LOL_HEROES } from '@/lib/lol/index.js';
import {
  addFeaturedHeroId,
  resolveFeaturedHeroIds,
} from '@/lib/lol/featured-heroes.js';

export const useLolStore = defineStore('lol', {
  state: () => ({
    heroIds: [],
    heroes: [],
    loading: false,
  }),
  actions: {
    async loadHeroes() {
      this.loading = true;

      try {
        this.heroIds = await resolveFeaturedHeroIds();
        this.heroes = await Promise.all(this.heroIds.map((id) => fetchLolHero(id)));
      } catch {
        this.heroes = FALLBACK_LOL_HEROES.filter((hero) => this.heroIds.includes(hero.id));
      } finally {
        this.loading = false;
      }
    },
    async addHero(heroId) {
      const added = await addFeaturedHeroId(heroId);
      if (!added) return false;

      this.heroIds = [...this.heroIds, String(heroId)];

      try {
        const hero = await fetchLolHero(heroId);
        this.heroes.push(hero);
      } catch {
        await this.loadHeroes();
      }

      return true;
    },
  },
});
