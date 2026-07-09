import { defineStore } from 'pinia';
import fallbackAccount from '@/data/travel/account.js';
import fallbackGroups from '@/data/travel/groups.js';
import fallbackVideos from '@/data/travel/videos.js';
import {
  canFetchDouyinInBrowser,
  DEFAULT_MAX,
  fetchDouyinCollection,
  getTargetCollectsKeywords,
} from '@/lib/travel/douyin-collection.js';
import { fetchDouyinCollectionCloud, isDouyinCloudEnabled } from '@/lib/travel/douyin-cloud.js';

function flattenGroupVideos(groups) {
  return (groups || []).flatMap((group) =>
    (group.folders || []).flatMap((folder) => folder.videos || []),
  );
}

export const useTravelStore = defineStore('travel', {
  state: () => ({
    account: null,
    groups: [],
    videos: [],
    loading: false,
    loaded: false,
    error: null,
    source: null,
  }),
  getters: {
    displayAccount: (state) => state.account || fallbackAccount,
    displayGroups: (state) => {
      if (state.groups.length) return state.groups;
      if (fallbackGroups.length) return fallbackGroups;
      if (fallbackVideos.length) {
        return [
          {
            keyword: '旅游',
            label: '旅游',
            folders: [{ id: 'cache', name: '本地缓存', total: fallbackVideos.length, videos: fallbackVideos }],
          },
        ];
      }
      return [];
    },
    displayVideos: (state) => {
      const live = flattenGroupVideos(state.groups);
      if (live.length) return live;
      if (state.videos.length) return state.videos;
      return fallbackVideos;
    },
    collectsKeywords: () => getTargetCollectsKeywords(),
    hasDisplayContent() {
      return this.displayGroups.some((group) =>
        (group.folders || []).some((folder) => (folder.videos || []).length > 0),
      );
    },
  },
  actions: {
    applyFallback(message) {
      this.account = fallbackAccount;
      this.groups = fallbackGroups;
      this.videos = fallbackVideos;
      this.source = fallbackVideos.length || fallbackGroups.length ? 'cache' : null;
      this.error = message;
    },

    async load(force = false) {
      if (this.loading) return;
      if (this.loaded && !force) return;

      this.loading = true;
      this.error = null;

      const maxVideos = Number(import.meta.env.PUBLIC_DOUYIN_MAX_VIDEOS) || DEFAULT_MAX;
      const keywords = getTargetCollectsKeywords();

      try {
        let result = null;

        if (canFetchDouyinInBrowser()) {
          result = await fetchDouyinCollection(maxVideos, keywords);
        } else if (isDouyinCloudEnabled()) {
          result = await fetchDouyinCollectionCloud(maxVideos, keywords);
        }

        if (!result) {
          throw new Error('未配置抖音 API 代理或 Supabase 云端函数');
        }

        this.account = result.account;
        this.groups = result.groups || [];
        this.videos = result.videos || flattenGroupVideos(result.groups);
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
