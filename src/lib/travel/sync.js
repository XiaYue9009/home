/** 旅行视频同步策略：定时（1/16 号）与手动增量 */
import {
  canFetchDouyinInBrowser,
  DEFAULT_MAX,
  fetchDouyinCollection,
  getTargetCollectsFolderNames,
} from '@/lib/travel/douyin-collection.js';
import { fetchDouyinCollectionCloud, isDouyinCloudEnabled } from '@/lib/travel/douyin-cloud.js';
import { flattenDouyinGroups } from '@/lib/travel/present.js';
import { extractGeoFromVideo } from '@/lib/travel/geo-extract.js';
import {
  appendCloudTravelVideos,
  fetchCloudTravelSyncMeta,
  fetchCloudTravelVideos,
  isTravelVideosCloudEnabled,
} from '@/lib/travel/videos-cloud.js';

export const SCHEDULED_SYNC_DAYS = [1, 16];

export function todayDateString(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function isScheduledSyncDay(date = new Date()) {
  return SCHEDULED_SYNC_DAYS.includes(date.getDate());
}

export function shouldRunScheduledSync(meta, date = new Date()) {
  if (!isScheduledSyncDay(date)) return false;
  const today = todayDateString(date);
  const last = meta?.lastAutoSyncDate ? String(meta.lastAutoSyncDate).slice(0, 10) : '';
  return last !== today;
}

function enrichVideoGeo(video) {
  if (!video) return video;
  if (video.province || video.placeName || video.geoLabel) return video;
  const geo = extractGeoFromVideo({
    title: video.title,
    topics: video.topics || [],
    poiName: video.poiName || '',
  });
  return {
    ...video,
    province: geo.province,
    city: geo.city,
    district: geo.district,
    placeName: geo.placeName,
    geoLabel: geo.label,
  };
}

function prepareVideosForStorage(videos = []) {
  return videos.map(enrichVideoGeo).filter((video) => video?.id);
}

async function fetchFromDouyin(maxVideos, folderNames) {
  if (canFetchDouyinInBrowser()) {
    return fetchDouyinCollection(maxVideos, folderNames);
  }
  if (isDouyinCloudEnabled()) {
    return fetchDouyinCollectionCloud(maxVideos, folderNames);
  }
  throw new Error('未配置抖音 API 代理或 Supabase Edge Function');
}

export async function loadTravelFromSupabase(filters = {}) {
  if (!isTravelVideosCloudEnabled()) {
    throw new Error('未配置 Supabase，无法读取旅行视频库');
  }

  const [videoResult, meta] = await Promise.all([
    fetchCloudTravelVideos(filters),
    fetchCloudTravelSyncMeta(),
  ]);

  return {
    videos: videoResult?.videos || [],
    account: meta?.account || null,
    meta,
    source: 'supabase',
  };
}

export async function syncTravelFromDouyin({
  syncType = 'manual',
  maxVideos = DEFAULT_MAX,
  folderNames = getTargetCollectsFolderNames(),
  autoSyncDate = null,
} = {}) {
  if (!isTravelVideosCloudEnabled()) {
    throw new Error('未配置 Supabase，无法同步旅行视频');
  }

  const douyin = await fetchFromDouyin(maxVideos, folderNames);
  const videos = prepareVideosForStorage(flattenDouyinGroups(douyin.groups || []));
  const appendResult = await appendCloudTravelVideos({
    videos,
    account: douyin.account || null,
    syncType,
    autoSyncDate: syncType === 'scheduled' ? autoSyncDate || todayDateString() : null,
  });

  const stored = await loadTravelFromSupabase();

  return {
    ...stored,
    sync: {
      type: syncType,
      inserted: appendResult?.inserted ?? 0,
      skipped: appendResult?.skipped ?? 0,
      total: appendResult?.total ?? stored.videos.length,
      fetched: videos.length,
    },
  };
}

export async function resolveTravelLoad({ manual = false, maxVideos, folderNames } = {}) {
  if (!isTravelVideosCloudEnabled()) {
    const douyin = await fetchFromDouyin(
      maxVideos || DEFAULT_MAX,
      folderNames || getTargetCollectsFolderNames(),
    );
    return {
      videos: prepareVideosForStorage(flattenDouyinGroups(douyin.groups || [])),
      account: douyin.account || null,
      groups: douyin.groups || [],
      source: douyin.source || 'live',
      meta: null,
      sync: null,
    };
  }

  if (manual) {
    return syncTravelFromDouyin({
      syncType: 'manual',
      maxVideos,
      folderNames,
    });
  }

  const meta = await fetchCloudTravelSyncMeta();
  if (shouldRunScheduledSync(meta)) {
    try {
      return await syncTravelFromDouyin({
        syncType: 'scheduled',
        maxVideos,
        folderNames,
        autoSyncDate: todayDateString(),
      });
    } catch (err) {
      const fallback = await loadTravelFromSupabase();
      return {
        ...fallback,
        error: err?.message || '定时同步失败',
        sync: null,
      };
    }
  }

  return loadTravelFromSupabase();
}
