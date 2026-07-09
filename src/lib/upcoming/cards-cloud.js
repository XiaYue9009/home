import {
  getSupabaseClient,
  isSupabaseConfigured,
  parseRpcJson,
} from '@/lib/supabase/client.js';

export function isUpcomingCardsCloudEnabled() {
  return isSupabaseConfigured();
}

function normalizeCard(entry) {
  if (!entry || typeof entry !== 'object') return null;

  const content = String(entry.content || '');
  const title = String(entry.title || '').trim();
  if (!title && !content.trim()) return null;

  return {
    id: String(entry.id || ''),
    title,
    content,
    pinned: Boolean(entry.pinned) && !Boolean(entry.done),
    done: Boolean(entry.done),
    updatedAt: entry.updatedAt || entry.updated_at || new Date().toISOString(),
  };
}

function toCloudCard(card) {
  return {
    id: card.id,
    title: card.title,
    content: card.content,
    pinned: Boolean(card.pinned) && !Boolean(card.done),
    done: Boolean(card.done),
    updated_at: card.updatedAt,
  };
}

function readUpdatedAt(payload, fallback = new Date().toISOString()) {
  return payload?.updated_at || payload?.updatedAt || fallback;
}

async function callUpcomingRpc(name, body) {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase.rpc(name, { body });
  if (error) throw error;
  return parseRpcJson(data) ?? data;
}

export async function fetchCloudUpcomingCards() {
  const payload = await callUpcomingRpc('fetch_upcoming_cards', {});
  if (!payload) return null;

  const rawCards = payload?.cards;
  const cards = Array.isArray(rawCards)
    ? rawCards.map(normalizeCard).filter(Boolean)
    : [];

  if (!cards.length) return null;

  return {
    cards,
    updatedAt: readUpdatedAt(payload, ''),
  };
}

/** 全量替换：仅用于本地首次引导上传 */
export async function upsertCloudUpcomingCards(cards) {
  const updatedAt = new Date().toISOString();
  const payload = await callUpcomingRpc('sync_upcoming_cards', {
    cards: cards.map(toCloudCard),
  });
  return readUpdatedAt(payload, updatedAt);
}

/** 新建 / 更新单张卡片；可选 ids 同步顺序 */
export async function upsertCloudUpcomingCard(card, orderedIds = null) {
  const updatedAt = new Date().toISOString();
  const body = { card: toCloudCard(card) };
  if (Array.isArray(orderedIds) && orderedIds.length) {
    body.ids = orderedIds;
  }
  const payload = await callUpcomingRpc('upsert_upcoming_card', body);
  return {
    updatedAt: readUpdatedAt(payload, updatedAt),
    card: normalizeCard(payload?.card) || card,
  };
}

/** 删除单张卡片 */
export async function deleteCloudUpcomingCard(id) {
  const updatedAt = new Date().toISOString();
  const payload = await callUpcomingRpc('delete_upcoming_card', { id });
  return readUpdatedAt(payload, updatedAt);
}

/** 更新置顶 / 完成状态（不传正文；可选 ids 同步顺序） */
export async function setCloudUpcomingCardFlags(id, flags = {}, orderedIds = null) {
  const updatedAt = new Date().toISOString();
  const body = { id };
  if ('pinned' in flags) body.pinned = Boolean(flags.pinned);
  if ('done' in flags) body.done = Boolean(flags.done);
  if (flags.updatedAt) body.updated_at = flags.updatedAt;
  if (Array.isArray(orderedIds) && orderedIds.length) body.ids = orderedIds;

  const payload = await callUpcomingRpc('set_upcoming_card_flags', body);
  return {
    updatedAt: readUpdatedAt(payload, updatedAt),
    card: normalizeCard(payload?.card),
  };
}

/** 仅同步顺序（传 id 列表） */
export async function reorderCloudUpcomingCards(ids) {
  const updatedAt = new Date().toISOString();
  const payload = await callUpcomingRpc('reorder_upcoming_cards', { ids });
  return readUpdatedAt(payload, updatedAt);
}
