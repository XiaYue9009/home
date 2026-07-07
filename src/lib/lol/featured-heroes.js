/** 我的英雄列表：本地缓存 + Supabase 云同步 */
import { FEATURED_LOL_HERO_IDS } from './index.js';
import { isSupabaseConfigured, parseUpdatedAt } from '@/lib/supabase/client.js';
import {
  fetchCloudFeaturedHeroes,
  upsertCloudFeaturedHeroes,
} from './featured-heroes-cloud.js';

const STORAGE_KEY = 'moonhome-lol-featured-hero-ids';
const META_KEY = 'moonhome-lol-featured-heroes-meta';

export function isFeaturedHeroesCloudEnabled() {
  return isSupabaseConfigured();
}

function defaultHeroIds() {
  return [...FEATURED_LOL_HERO_IDS];
}

export function loadFeaturedHeroesMeta() {
  if (typeof localStorage === 'undefined') return null;

  try {
    const raw = localStorage.getItem(META_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveFeaturedHeroesMeta(meta) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(META_KEY, JSON.stringify(meta));
}

export function getFeaturedHeroIds() {
  if (typeof localStorage === 'undefined') return defaultHeroIds();

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultHeroIds();

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return defaultHeroIds();

    return parsed.map(String);
  } catch {
    return defaultHeroIds();
  }
}

export function saveFeaturedHeroIds(ids) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids.map(String)));
}

export function isFeaturedHeroId(heroId) {
  return getFeaturedHeroIds().includes(String(heroId));
}

/** 从云端 / 本地选择最新的一份，并在需要时回填云端 */
export async function resolveFeaturedHeroIds() {
  const localIds = getFeaturedHeroIds();
  const localUpdated = parseUpdatedAt(loadFeaturedHeroesMeta()?.updatedAt);

  if (!isFeaturedHeroesCloudEnabled()) {
    return localIds;
  }

  try {
    const cloud = await fetchCloudFeaturedHeroes();
    const cloudUpdated = parseUpdatedAt(cloud?.updatedAt);
    const cloudIds = cloud?.heroIds || [];
    const hasCloudIds = cloudIds.length > 0;
    const hasLocalIds = localIds.length > 0;

    if (hasCloudIds && (!hasLocalIds || cloudUpdated >= localUpdated)) {
      saveFeaturedHeroIds(cloudIds);
      saveFeaturedHeroesMeta({ updatedAt: cloud.updatedAt, source: 'cloud' });
      return cloudIds;
    }

    if (hasLocalIds && (!hasCloudIds || localUpdated > cloudUpdated)) {
      await persistFeaturedHeroIds(localIds);
      return localIds;
    }

    return localIds;
  } catch {
    return localIds;
  }
}

/** 写入本地缓存，并同步到云端 */
export async function persistFeaturedHeroIds(ids) {
  const heroIds = ids.map(String).filter(Boolean);
  const updatedAt = new Date().toISOString();
  saveFeaturedHeroIds(heroIds);
  saveFeaturedHeroesMeta({ updatedAt, source: 'local' });

  if (!isFeaturedHeroesCloudEnabled()) {
    return { ok: true, cloud: false };
  }

  try {
    const syncedAt = await upsertCloudFeaturedHeroes(heroIds);
    saveFeaturedHeroesMeta({ updatedAt: syncedAt, source: 'cloud' });
    return { ok: true, cloud: true };
  } catch (error) {
    return { ok: false, cloud: true, error };
  }
}

export async function addFeaturedHeroId(heroId) {
  const id = String(heroId);
  const ids = getFeaturedHeroIds();
  if (ids.includes(id)) return false;

  const result = await persistFeaturedHeroIds([...ids, id]);
  return result.ok;
}
