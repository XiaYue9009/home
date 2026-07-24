import { markdownToHtml } from '@/lib/editor/content-format.js';
import { parseUpdatedAt } from '@/lib/supabase/client.js';
import {
  extractTitleFromContent,
  normalizeNoteContent,
} from '@/lib/upcoming/content-title.js';
import {
  deleteCloudUpcomingCard,
  fetchCloudUpcomingCards,
  isUpcomingCardsCloudEnabled,
  reorderCloudUpcomingCards,
  setCloudUpcomingCardFlags,
  upsertCloudUpcomingCard,
  upsertCloudUpcomingCards,
} from '@/lib/upcoming/cards-cloud.js';

const CARDS_STORAGE_KEY = 'moonhome-upcoming-cards';
const LEGACY_STORAGE_KEY = 'moonhome-upcoming-markdown';
const META_STORAGE_KEY = 'moonhome-upcoming-cards-meta';

export function createUpcomingCardId() {
  return `upcoming-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function normalizeUpcomingCard(entry) {
  if (!entry || typeof entry !== 'object') return null;

  const content = normalizeNoteContent(
    String(entry.content || ''),
    String(entry.title || '').trim() || '未命名',
  );
  const title = extractTitleFromContent(content);
  if (!title && !content.trim()) return null;

  return {
    id: String(entry.id || createUpcomingCardId()),
    title,
    content,
    pinned: Boolean(entry.pinned) && !Boolean(entry.done),
    done: Boolean(entry.done),
    updatedAt: entry.updatedAt || entry.updated_at || new Date().toISOString(),
  };
}

/** 未完成置顶 → 未完成普通 → 已完成；组内保持相对顺序 */
export function sortUpcomingCards(cards = []) {
  const pinned = [];
  const active = [];
  const done = [];
  for (const card of cards) {
    if (card?.done) done.push(card);
    else if (card?.pinned) pinned.push(card);
    else active.push(card);
  }
  return [...pinned, ...active, ...done];
}

function migrateLegacyMarkdown() {
  if (typeof localStorage === 'undefined') return [];

  try {
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!legacy?.trim()) return [];

    return [
      normalizeUpcomingCard({
        id: createUpcomingCardId(),
        title: '默认笔记',
        content: legacy,
      }),
    ].filter(Boolean);
  } catch {
    return [];
  }
}

export function loadUpcomingCardsMeta() {
  if (typeof localStorage === 'undefined') return null;

  try {
    const raw = localStorage.getItem(META_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveUpcomingCardsMeta(meta) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(META_STORAGE_KEY, JSON.stringify(meta));
}

export function loadUpcomingCards() {
  if (typeof localStorage === 'undefined') return [];

  try {
    const raw = localStorage.getItem(CARDS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return sortUpcomingCards(parsed.map(normalizeUpcomingCard).filter(Boolean));
      }
    }
  } catch {
    /* fall through */
  }

  const migrated = migrateLegacyMarkdown();
  if (migrated.length) {
    saveUpcomingCards(migrated);
  }

  return migrated;
}

export function saveUpcomingCards(cards) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(CARDS_STORAGE_KEY, JSON.stringify(cards));
}

function commitLocalCards(cards, meta = {}) {
  const normalized = sortUpcomingCards(cards.map(normalizeUpcomingCard).filter(Boolean));
  const updatedAt = meta.updatedAt || new Date().toISOString();
  saveUpcomingCards(normalized);
  saveUpcomingCardsMeta({
    updatedAt,
    source: meta.source || 'local',
  });
  return { cards: normalized, updatedAt };
}

export async function resolveUpcomingCards() {
  const localCards = loadUpcomingCards();
  const localUpdated = parseUpdatedAt(loadUpcomingCardsMeta()?.updatedAt);

  if (!isUpcomingCardsCloudEnabled()) {
    return localCards;
  }

  try {
    const cloud = await fetchCloudUpcomingCards();
    const cloudUpdated = parseUpdatedAt(cloud?.updatedAt);
    const cloudCards = (cloud?.cards || []).map(normalizeUpcomingCard).filter(Boolean);
    const hasCloudCards = cloudCards.length > 0;
    const hasLocalCards = localCards.length > 0;

    if (hasCloudCards && (!hasLocalCards || cloudUpdated >= localUpdated)) {
      return commitLocalCards(cloudCards, {
        updatedAt: cloud.updatedAt,
        source: 'cloud',
      }).cards;
    }

    if (hasLocalCards && (!hasCloudCards || localUpdated > cloudUpdated)) {
      // 仅首次引导：本地有、云端空时全量上传一次
      const result = await replaceUpcomingCards(localCards);
      return result.cards;
    }

    return sortUpcomingCards(localCards);
  } catch {
    return localCards;
  }
}

/** 全量替换（仅引导同步） */
export async function replaceUpcomingCards(cards) {
  const local = commitLocalCards(cards);

  if (!isUpcomingCardsCloudEnabled()) {
    return { ok: true, cloud: false, cards: local.cards };
  }

  try {
    const syncedAt = await upsertCloudUpcomingCards(local.cards);
    return {
      ok: true,
      cloud: true,
      cards: commitLocalCards(local.cards, { updatedAt: syncedAt, source: 'cloud' }).cards,
    };
  } catch (error) {
    return { ok: false, cloud: true, error, cards: local.cards };
  }
}

/** @deprecated 兼容旧调用，请改用按操作拆分的 API */
export async function persistUpcomingCards(cards) {
  return replaceUpcomingCards(cards);
}

export async function persistUpcomingCardUpsert(cards, card) {
  const nextCards = sortUpcomingCards(cards.map(normalizeUpcomingCard).filter(Boolean));
  const local = commitLocalCards(nextCards);
  const target = local.cards.find((entry) => entry.id === card.id) || normalizeUpcomingCard(card);

  if (!isUpcomingCardsCloudEnabled() || !target) {
    return { ok: true, cloud: false, cards: local.cards };
  }

  try {
    const { updatedAt } = await upsertCloudUpcomingCard(
      target,
      local.cards.map((entry) => entry.id),
    );
    return {
      ok: true,
      cloud: true,
      cards: commitLocalCards(local.cards, { updatedAt, source: 'cloud' }).cards,
    };
  } catch (error) {
    return { ok: false, cloud: true, error, cards: local.cards };
  }
}

export async function persistUpcomingCardDelete(cards, id) {
  const local = commitLocalCards(cards);

  if (!isUpcomingCardsCloudEnabled()) {
    return { ok: true, cloud: false, cards: local.cards };
  }

  try {
    const updatedAt = await deleteCloudUpcomingCard(id);
    return {
      ok: true,
      cloud: true,
      cards: commitLocalCards(local.cards, { updatedAt, source: 'cloud' }).cards,
    };
  } catch (error) {
    return { ok: false, cloud: true, error, cards: local.cards };
  }
}

export async function persistUpcomingCardFlags(cards, id, flags) {
  const local = commitLocalCards(cards);
  const target = local.cards.find((entry) => entry.id === id);

  if (!isUpcomingCardsCloudEnabled() || !target) {
    return { ok: true, cloud: false, cards: local.cards };
  }

  try {
    const { updatedAt } = await setCloudUpcomingCardFlags(
      id,
      {
        pinned: target.pinned,
        done: target.done,
        updatedAt: target.updatedAt,
        ...flags,
      },
      local.cards.map((entry) => entry.id),
    );
    return {
      ok: true,
      cloud: true,
      cards: commitLocalCards(local.cards, { updatedAt, source: 'cloud' }).cards,
    };
  } catch (error) {
    return { ok: false, cloud: true, error, cards: local.cards };
  }
}

export async function persistUpcomingCardReorder(cards) {
  const local = commitLocalCards(cards);

  if (!isUpcomingCardsCloudEnabled()) {
    return { ok: true, cloud: false, cards: local.cards };
  }

  try {
    const updatedAt = await reorderCloudUpcomingCards(local.cards.map((card) => card.id));
    return {
      ok: true,
      cloud: true,
      cards: commitLocalCards(local.cards, { updatedAt, source: 'cloud' }).cards,
    };
  } catch (error) {
    return { ok: false, cloud: true, error, cards: local.cards };
  }
}

/** 去掉首行 H1（标题已在卡片外展示），保留其余 Markdown */
export function cardBodyMarkdown(content = '') {
  return String(content || '')
    .replace(/^#\s+.+\n?/, '')
    .trim();
}

export function cardPreviewHtml(content = '') {
  const body = cardBodyMarkdown(content);
  if (!body) return '<p class="upcoming-card-preview__empty">点击编辑内容…</p>';
  return markdownToHtml(body);
}

export function cardExcerpt(content = '', maxLength = 72) {
  const plain = String(content)
    .replace(/^#\s+.+\n?/, '')
    .replace(/^#+\s+/gm, '')
    .replace(/\*\*|__|\*|_|`|>\s?|[-*+]\s+/g, '')
    .replace(/!\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!plain) return '点击编辑内容…';
  if (plain.length <= maxLength) return plain;
  return `${plain.slice(0, maxLength)}…`;
}
