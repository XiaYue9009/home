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
    updatedAt: entry.updatedAt || entry.updated_at || new Date().toISOString(),
  };
}

export async function fetchCloudUpcomingCards() {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase.rpc('fetch_upcoming_cards', {
    body: {},
  });

  if (error) throw error;

  const payload = parseRpcJson(data);
  const rawCards = payload?.cards;
  const cards = Array.isArray(rawCards)
    ? rawCards.map(normalizeCard).filter(Boolean)
    : [];

  if (!cards.length) return null;

  return {
    cards,
    updatedAt: payload?.updated_at || payload?.updatedAt || '',
  };
}

export async function upsertCloudUpcomingCards(cards) {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const updatedAt = new Date().toISOString();
  const payload = cards.map((card) => ({
    id: card.id,
    title: card.title,
    content: card.content,
    updated_at: card.updatedAt,
  }));

  const { data, error } = await supabase.rpc('sync_upcoming_cards', {
    body: {
      cards: payload,
    },
  });

  if (error) throw error;

  return data?.updated_at || updatedAt;
}
