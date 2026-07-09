import { defineStore } from 'pinia';
import fallbackAccount from '@/data/travel/account.js';
import fallbackGroups from '@/data/travel/groups.js';
import fallbackVideos from '@/data/travel/videos.js';
import { DEFAULT_MAX, getTargetCollectsFolderNames } from '@/lib/travel/douyin-collection.js';
import {
  buildTravelGeoView,
  filterVideosByGeo,
  groupVideosByFolderNames,
} from '@/lib/travel/present.js';
import { isScheduledSyncDay, resolveTravelLoad } from '@/lib/travel/sync.js';

export const useTravelStore = defineStore('travel', {
  state: () => ({
    account: null,
    groups: [],
    videos: [],
    meta: null,
    syncInfo: null,
    loading: false,
    syncing: false,
    loaded: false,
    error: null,
    source: null,
    viewMode: 'folder',
    geoFilter: {
      province: '',
      city: '',
      district: '',
      placeName: '',
    },
  }),
  getters: {
    displayAccount: (state) => state.account || fallbackAccount,
    collectsFolders: () => getTargetCollectsFolderNames(),
    folderGroups(state) {
      if (state.groups.length) return state.groups;
      if (fallbackGroups.length) return fallbackGroups;
      const videos = this.allVideos;
      if (videos.length) return groupVideosByFolderNames(videos, getTargetCollectsFolderNames());
      return groupVideosByFolderNames([], getTargetCollectsFolderNames());
    },
    allVideos(state) {
      if (state.videos.length) return state.videos;
      if (fallbackVideos.length) return fallbackVideos;
      return [];
    },
    filteredVideos(state) {
      return filterVideosByGeo(this.allVideos, state.geoFilter);
    },
    geoView(state) {
      return buildTravelGeoView(this.allVideos, state.geoFilter);
    },
    displayGroups(state) {
      if (state.viewMode === 'geo') {
        return (this.geoView.geoGroups || []).map((provinceGroup) => ({
          keyword: provinceGroup.province,
          label: provinceGroup.province,
          folders: provinceGroup.cities.flatMap((cityGroup) =>
            cityGroup.places.map((placeGroup) => ({
              id: `${provinceGroup.province}-${cityGroup.city}-${placeGroup.placeName}`,
              name: [cityGroup.city !== '未识别' ? cityGroup.city : '', placeGroup.placeName]
                .filter(Boolean)
                .join(' · '),
              total: placeGroup.videos.length,
              videos: placeGroup.videos,
            })),
          ),
        }));
      }
      return groupVideosByFolderNames(this.filteredVideos, getTargetCollectsFolderNames());
    },
    hasDisplayContent() {
      return this.displayGroups.some((group) =>
        (group.folders || []).some((folder) => (folder.videos || []).length > 0),
      );
    },
    geoOptions() {
      return this.geoView.geoOptions;
    },
    lastSyncLabel(state) {
      const at = state.meta?.lastDouyinSyncAt;
      if (!at) return '';
      return new Date(at).toLocaleString('zh-CN');
    },
    isAutoSyncDay: () => isScheduledSyncDay(),
  },
  actions: {
    setViewMode(mode) {
      this.viewMode = mode === 'geo' ? 'geo' : 'folder';
    },

    setGeoFilter(partial = {}) {
      this.geoFilter = {
        ...this.geoFilter,
        ...partial,
      };
    },

    resetGeoFilter() {
      this.geoFilter = {
        province: '',
        city: '',
        district: '',
        placeName: '',
      };
    },

    applyPayload(payload) {
      this.account = payload.account || null;
      this.videos = payload.videos || [];
      this.groups = groupVideosByFolderNames(this.videos, getTargetCollectsFolderNames());
      this.meta = payload.meta || null;
      this.syncInfo = payload.sync || null;
      this.source = payload.source || null;
      this.error = payload.error || null;
    },

    applyFallback(message) {
      this.account = fallbackAccount;
      this.groups = fallbackGroups.length
        ? fallbackGroups
        : groupVideosByFolderNames(fallbackVideos, getTargetCollectsFolderNames());
      this.videos = fallbackVideos;
      this.meta = null;
      this.syncInfo = null;
      this.source = fallbackVideos.length || fallbackGroups.length ? 'cache' : null;
      this.error = message;
    },

    async load(force = false) {
      if (this.loading || this.syncing) return;
      if (this.loaded && !force) return;

      this.loading = true;
      this.error = null;

      const maxVideos = Number(import.meta.env.PUBLIC_DOUYIN_MAX_VIDEOS) || DEFAULT_MAX;
      const folderNames = getTargetCollectsFolderNames();

      try {
        const payload = await resolveTravelLoad({
          manual: false,
          maxVideos,
          folderNames,
        });
        this.applyPayload(payload);
        this.loaded = true;
      } catch (err) {
        this.applyFallback(err?.message || '加载收藏失败');
        this.loaded = true;
      } finally {
        this.loading = false;
      }
    },

    async syncFromDouyin() {
      if (this.loading || this.syncing) return;

      this.syncing = true;
      this.error = null;

      const maxVideos = Number(import.meta.env.PUBLIC_DOUYIN_MAX_VIDEOS) || DEFAULT_MAX;
      const folderNames = getTargetCollectsFolderNames();

      try {
        const payload = await resolveTravelLoad({
          manual: true,
          maxVideos,
          folderNames,
        });
        this.applyPayload(payload);
        this.loaded = true;
      } catch (err) {
        this.error = err?.message || '同步失败';
        throw err;
      } finally {
        this.syncing = false;
      }
    },
  },
});
