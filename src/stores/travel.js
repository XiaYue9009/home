import { defineStore } from 'pinia';
import fallbackAccount from '@/data/travel/account.js';
import fallbackVideos from '@/data/travel/videos.js';
import {
  canFetchDouyinInBrowser,
  DEFAULT_MAX,
  fetchDouyinCollection,
} from '@/lib/travel/douyin-collection.js';
import { fetchDouyinCollectionCloud, isDouyinCloudEnabled } from '@/lib/travel/douyin-cloud.js';

export const useTravelStore = defineStore('travel', {
  state: () => ({
    account: null,
    videos: [],
    loading: false,
    loaded: false,
    error: null,
    source: null,
  }),
  getters: {
    displayAccount: (state) => state.account || fallbackAccount,
    displayVideos: (state) => (state.videos.length ? state.videos : fallbackVideos),
  },
  actions: {
    applyFallback(message) {
      this.account = fallbackAccount;
      this.videos = fallbackVideos;
      this.source = fallbackVideos.length ? 'cache' : null;
      this.error = message;
    },

    async load(force = false) {
      if (this.loading) return;
      if (this.loaded && !force) return;

      this.loading = true;
      this.error = null;

      const maxVideos = Number(import.meta.env.PUBLIC_DOUYIN_MAX_VIDEOS) || DEFAULT_MAX;

      try {
        let result = null;

        if (canFetchDouyinInBrowser()) {
          result = await fetchDouyinCollection(maxVideos);
        } else if (isDouyinCloudEnabled()) {
          result = await fetchDouyinCollectionCloud(maxVideos);
        }

        if (!result) {
          throw new Error('未配置抖音 API 代理或 Supabase 云端函数');
        }

        this.account = result.account;
        this.videos = result.videos;
        this.source = result.source;
        this.loaded = true;
      } catch (err) {
        this.applyFallback(err?.message || '加载收藏失败');
        this.loaded = true;
      } finally {
        this.loading = false;
      }
    },
  },
});
