/** 旅行视频 Supabase 读写 */
import {
  getSupabaseClient,
  isSupabaseConfigured,
  parseRpcJson,
} from '@/lib/supabase/client.js';

export function isTravelVideosCloudEnabled() {
  return isSupabaseConfigured();
}

function parseVideos(value) {
  const parsed = parseRpcJson(value);
  return Array.isArray(parsed) ? parsed : [];
}

export function dbRowToVideo(row) {
  if (!row) return null;
  return {
    id: String(row.id || ''),
    title: row.title || '',
    cover: row.cover || '',
    author: row.author || '',
    diggCount: row.digg_count ?? row.diggCount ?? 0,
    playCount: row.play_count ?? row.playCount ?? 0,
    shareUrl: row.share_url || row.shareUrl || '',
    createTime: row.create_time || row.createTime || null,
    folderId: row.folder_id || row.folderId || '',
    folderName: row.folder_name || row.folderName || '',
    category: row.category || '',
    province: row.province || '',
    city: row.city || '',
    district: row.district || '',
    placeName: row.place_name || row.placeName || '',
    geoLabel: row.geo_label || row.geoLabel || '',
    poiName: row.poi_name || row.poiName || '',
    topics: Array.isArray(row.topics) ? row.topics : [],
    syncedAt: row.synced_at || row.syncedAt || null,
    createdAt: row.created_at || row.createdAt || null,
  };
}

export function videoToDbRow(video) {
  return {
    id: String(video.id || ''),
    title: video.title || '',
    cover: video.cover || '',
    author: video.author || '',
    share_url: video.shareUrl || '',
    digg_count: Number(video.diggCount) || 0,
    play_count: Number(video.playCount) || 0,
    create_time: video.createTime || null,
    folder_id: video.folderId || '',
    folder_name: video.folderName || '',
    category: video.category || '',
    province: video.province || '',
    city: video.city || '',
    district: video.district || '',
    place_name: video.placeName || '',
    geo_label: video.geoLabel || '',
    poi_name: video.poiName || '',
    topics: Array.isArray(video.topics) ? video.topics : [],
  };
}

export async function fetchCloudTravelVideos(filters = {}) {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase.rpc('fetch_travel_videos', {
    body: {
      category: filters.category || null,
      province: filters.province || null,
      city: filters.city || null,
      district: filters.district || null,
      place_name: filters.placeName || null,
    },
  });

  if (error) throw error;

  const payload = parseRpcJson(data);
  const videos = parseVideos(payload?.videos).map(dbRowToVideo).filter(Boolean);

  return {
    videos,
    updatedAt: payload?.updated_at || payload?.updatedAt || '',
  };
}

export async function appendCloudTravelVideos({ videos = [], account = null, syncType = 'manual', autoSyncDate = null }) {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const rows = videos.map(videoToDbRow).filter((row) => row.id);
  if (!rows.length) {
    return { inserted: 0, skipped: 0, total: 0 };
  }

  const { data, error } = await supabase.rpc('append_travel_videos', {
    body: {
      videos: rows,
      account: account || {},
      sync_type: syncType,
      auto_sync_date: autoSyncDate,
    },
  });

  if (error) throw error;

  const payload = parseRpcJson(data);
  return {
    inserted: payload?.inserted ?? 0,
    skipped: payload?.skipped ?? 0,
    total: payload?.total ?? 0,
    updatedAt: payload?.updated_at || payload?.updatedAt || '',
  };
}

export async function fetchCloudTravelSyncMeta() {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase.rpc('fetch_travel_sync_meta', { body: {} });
  if (error) throw error;

  const payload = parseRpcJson(data);
  const account = parseRpcJson(payload?.account) || payload?.account || null;

  return {
    account,
    lastDouyinSyncAt: payload?.last_douyin_sync_at || payload?.lastDouyinSyncAt || null,
    lastAutoSyncDate: payload?.last_auto_sync_date || payload?.lastAutoSyncDate || null,
    lastSyncType: payload?.last_sync_type || payload?.lastSyncType || '',
    updatedAt: payload?.updated_at || payload?.updatedAt || '',
  };
}
