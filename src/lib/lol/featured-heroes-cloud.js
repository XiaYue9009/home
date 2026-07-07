/** Supabase 我的英雄列表云同步 */
import {
  getSupabaseClient,
  isSupabaseConfigured,
  parseRpcJson,
} from '@/lib/supabase/client.js';

export function isFeaturedHeroesCloudEnabled() {
  return isSupabaseConfigured();
}

function parseHeroIds(value) {
  const parsed = parseRpcJson(value);
  if (!Array.isArray(parsed)) return [];
  return parsed.map(String).filter(Boolean);
}

export async function fetchCloudFeaturedHeroes() {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase.rpc('fetch_lol_featured_heroes', {
    body: {},
  });

  if (error) throw error;

  const payload = parseRpcJson(data);
  const heroIds = parseHeroIds(payload?.hero_ids ?? payload?.heroIds);
  if (!heroIds.length) return null;

  return {
    heroIds,
    updatedAt: payload?.updated_at || payload?.updatedAt || '',
  };
}

export async function upsertCloudFeaturedHeroes(heroIds) {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const updatedAt = new Date().toISOString();
  const payload = heroIds.map(String).filter(Boolean);

  const { data, error } = await supabase.rpc('sync_lol_featured_heroes', {
    body: {
      hero_ids: payload,
    },
  });

  if (error) throw error;

  return data?.updated_at || updatedAt;
}
