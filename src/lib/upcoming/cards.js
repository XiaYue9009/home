import { parseUpdatedAt } from '@/lib/supabase/client.js';
import {
  extractTitleFromContent,
  normalizeNoteContent,
} from '@/lib/upcoming/content-title.js';
import {
  fetchCloudUpcomingCards,
  isUpcomingCardsCloudEnabled,
  upsertCloudUpcomingCards,
} from '@/lib/upcoming/cards-cloud.js';

const CARDS_STORAGE_KEY = 'moonhome-upcoming-cards';
const LEGACY_STORAGE_KEY = 'moonhome-upcoming-markdown';
const META_STORAGE_KEY = 'moonhome-upcoming-cards-meta';

export function createUpcomingCardId() {
  return `upcoming-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeCard(entry) {
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
    updatedAt: entry.updatedAt || entry.updated_at || new Date().toISOString(),
  };
}

function migrateLegacyMarkdown() {
  if (typeof localStorage === 'undefined') return [];

  try {
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!legacy?.trim()) return [];

    return [
      normalizeCard({
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
        return parsed.map(normalizeCard).filter(Boolean);
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

export async function resolveUpcomingCards() {
  const localCards = loadUpcomingCards();
  const localUpdated = parseUpdatedAt(loadUpcomingCardsMeta()?.updatedAt);

  if (!isUpcomingCardsCloudEnabled()) {
    return localCards;
  }

  try {
    const cloud = await fetchCloudUpcomingCards();
    const cloudUpdated = parseUpdatedAt(cloud?.updatedAt);
    const cloudCards = (cloud?.cards || []).map(normalizeCard).filter(Boolean);
    const hasCloudCards = cloudCards.length > 0;
    const hasLocalCards = localCards.length > 0;

    if (hasCloudCards && (!hasLocalCards || cloudUpdated >= localUpdated)) {
      saveUpcomingCards(cloudCards);
      saveUpcomingCardsMeta({ updatedAt: cloud.updatedAt, source: 'cloud' });
      return cloudCards;
    }

    if (hasLocalCards && (!hasCloudCards || localUpdated > cloudUpdated)) {
      await persistUpcomingCards(localCards);
      return localCards;
    }

    return localCards;
  } catch {
    return localCards;
  }
}

export async function persistUpcomingCards(cards) {
  const normalized = cards.map(normalizeCard).filter(Boolean);
  const updatedAt = new Date().toISOString();
  saveUpcomingCards(normalized);
  saveUpcomingCardsMeta({ updatedAt, source: 'local' });

  if (!isUpcomingCardsCloudEnabled()) {
    return { ok: true, cloud: false, cards: normalized };
  }

  try {
    const syncedAt = await upsertCloudUpcomingCards(normalized);
    saveUpcomingCardsMeta({ updatedAt: syncedAt, source: 'cloud' });
    return { ok: true, cloud: true, cards: normalized };
  } catch (error) {
    return { ok: false, cloud: true, error, cards: normalized };
  }
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
