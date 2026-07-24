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

export async function fetchCloudTravelSyncMeta() {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase.rpc('fetch_travel_sync_meta', { body: {} });
  if (error) throw error;

  const payload = parseRpcJson(data);
  const account = parseRpcJson(payload?.account) || payload?.account || null;

  return {
    account,
    updatedAt: payload?.updated_at || payload?.updatedAt || '',
  };
}
