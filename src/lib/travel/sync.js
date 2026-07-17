/** 旅行视频加载：Supabase 云端读取，未配置时由 store 回退本地静态数据 */
import {
  fetchCloudTravelSyncMeta,
  fetchCloudTravelVideos,
  isTravelVideosCloudEnabled,
} from '@/lib/travel/videos-cloud.js';

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

export async function resolveTravelLoad() {
  if (!isTravelVideosCloudEnabled()) {
    return null;
  }

  return loadTravelFromSupabase();
}
