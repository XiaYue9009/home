import { defineStore } from 'pinia';
import fallbackAccount from '@/data/travel/account.js';
import fallbackGroups from '@/data/travel/groups.js';
import fallbackVideos from '@/data/travel/videos.js';
import {
  buildTravelGeoView,
  filterVideosByGeo,
  getTravelFolderNames,
  groupVideosByFolderNames,
} from '@/lib/travel/present.js';
import { resolveTravelLoad } from '@/lib/travel/sync.js';

export const useTravelStore = defineStore('travel', {
  state: () => ({
    account: null,
    groups: [],
    videos: [],
    meta: null,
    loading: false,
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
    displayAccount: (state) => state.account || fallbackAccount || {},
    collectsFolders: () => getTravelFolderNames(),
    folderGroups(state) {
      if (state.groups.length) return state.groups;
      if (fallbackGroups.length) return fallbackGroups;
      const videos = this.allVideos;
      if (videos.length) return groupVideosByFolderNames(videos, getTravelFolderNames());
      return groupVideosByFolderNames([], getTravelFolderNames());
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
      return groupVideosByFolderNames(this.filteredVideos, getTravelFolderNames());
    },
    hasDisplayContent() {
      return this.displayGroups.some((group) =>
        (group.folders || []).some((folder) => (folder.videos || []).length > 0),
      );
    },
    geoOptions() {
      return this.geoView.geoOptions;
    },
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
      this.groups = groupVideosByFolderNames(this.videos, getTravelFolderNames());
      this.meta = payload.meta || null;
      this.source = payload.source || null;
      this.error = payload.error || null;
    },

    applyFallback(message) {
      this.account = fallbackAccount || null;
      this.groups = fallbackGroups.length
        ? fallbackGroups
        : groupVideosByFolderNames(fallbackVideos, getTravelFolderNames());
      this.videos = fallbackVideos;
      this.meta = null;
      this.source = fallbackVideos.length || fallbackGroups.length ? 'cache' : null;
      this.error = message;
    },

    async load(force = false) {
      if (this.loading) return;
      if (this.loaded && !force) return;

      this.loading = true;
      this.error = null;

      try {
        const payload = await resolveTravelLoad();
        if (payload) {
          this.applyPayload(payload);
        } else {
          this.applyFallback(null);
        }
        this.loaded = true;
      } catch (err) {
        this.applyFallback(err?.message || '加载失败');
        this.loaded = true;
      } finally {
        this.loading = false;
      }
    },
  },
});
