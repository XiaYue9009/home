import { createClient } from '@supabase/supabase-js';

let client = null;

export function isCloudSyncEnabled() {
  return !!(import.meta.env.PUBLIC_SUPABASE_URL && import.meta.env.PUBLIC_SUPABASE_ANON_KEY);
}

function getClient() {
  if (!isCloudSyncEnabled()) return null;
  if (!client) {
    client = createClient(
      import.meta.env.PUBLIC_SUPABASE_URL,
      import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    );
  }
  return client;
}

function parseRpcJson(value) {
  if (value == null) return null;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
  return value;
}

function parseRowsPayload(rows) {
  const parsed = parseRpcJson(rows);
  if (Array.isArray(parsed)) return parsed;
  if (parsed && typeof parsed === 'object') return Object.values(parsed);
  return [];
}

/** 兼容 RPC/legacy 的 snake_case 与 camelCase */
function normalizeCloudRow(entry) {
  if (!entry || typeof entry !== 'object') return null;

  return {
    id: entry.id,
    enemyId: String(entry.enemy_id ?? entry.enemyId ?? ''),
    enemyName: entry.enemyName || entry.enemy_name || '',
    candidateSpellIds: [...(entry.candidate_spell_ids ?? entry.candidateSpellIds ?? [])],
    skillIds: [...(entry.skill_ids ?? entry.skillIds ?? [])],
    primaryRuneIds: [...(entry.primary_rune_ids ?? entry.primaryRuneIds ?? [])],
    secondaryRuneIds: [...(entry.secondary_rune_ids ?? entry.secondaryRuneIds ?? [])],
    itemIds: [...(entry.item_ids ?? entry.itemIds ?? [])],
    difficulty: entry.difficulty || 'unknown',
    tips: entry.tips || '',
  };
}

function rowToEntry(heroId, row, updatedAt) {
  return {
    id: row.id,
    hero_id: heroId,
    enemy_id: row.enemyId || null,
    difficulty: row.difficulty || 'unknown',
    candidate_spell_ids: row.candidateSpellIds || [],
    skill_ids: row.skillIds || [],
    primary_rune_ids: row.primaryRuneIds || [],
    secondary_rune_ids: row.secondaryRuneIds || [],
    item_ids: row.itemIds || [],
    tips: row.tips || '',
    updated_at: updatedAt,
  };
}

/** POST /rpc/fetch_lol_matchup_entries，参数在 body 字段 */
export async function fetchCloudMatchups(heroId) {
  const supabase = getClient();
  if (!supabase) return null;

  const { data, error } = await supabase.rpc('fetch_lol_matchup_entries', {
    body: { hero_id: heroId },
  });

  if (error) throw error;

  const payload = parseRpcJson(data);
  const rawRows = parseRowsPayload(payload?.rows);
  if (!rawRows.length) return null;

  const rows = rawRows.map(normalizeCloudRow).filter(Boolean);
  if (!rows.length) return null;

  return {
    rows,
    updatedAt: payload?.updated_at || payload?.updatedAt || '',
    legacy: Boolean(payload?.legacy),
  };
}

/** POST /rpc/sync_lol_matchup_entries，参数在 body 字段（upsert + 清理多余行，单次请求） */
export async function upsertCloudMatchups(heroId, rows) {
  const supabase = getClient();
  if (!supabase) return null;

  const updatedAt = new Date().toISOString();
  const payload = rows.map((row) => rowToEntry(heroId, row, updatedAt));

  const { data, error } = await supabase.rpc('sync_lol_matchup_entries', {
    body: {
      hero_id: heroId,
      rows: payload,
    },
  });

  if (error) throw error;

  return data?.updated_at || updatedAt;
}
