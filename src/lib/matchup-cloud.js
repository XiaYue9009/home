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

function entryToRow(entry) {
  return {
    id: entry.id,
    enemyId: entry.enemy_id || '',
    enemyName: '',
    candidateSpellIds: entry.candidate_spell_ids || [],
    skillIds: entry.skill_ids || [],
    primaryRuneIds: entry.primary_rune_ids || [],
    secondaryRuneIds: entry.secondary_rune_ids || [],
    itemIds: entry.item_ids || [],
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

function latestUpdatedAt(entries = [], fallback = '') {
  if (!entries.length) return fallback;
  return entries.reduce(
    (max, entry) => (entry.updated_at > max ? entry.updated_at : max),
    entries[0].updated_at,
  );
}

async function fetchLegacyCloudMatchups(supabase, heroId) {
  const { data, error } = await supabase
    .from('lol_matchups')
    .select('rows, updated_at')
    .eq('hero_id', heroId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    rows: data.rows || [],
    updatedAt: data.updated_at,
    legacy: true,
  };
}

export async function fetchCloudMatchups(heroId) {
  const supabase = getClient();
  if (!supabase) return null;

  const { data: entries, error } = await supabase
    .from('lol_matchup_entries')
    .select('*')
    .eq('hero_id', heroId);

  if (error) {
    if (error.code === '42P01') return fetchLegacyCloudMatchups(supabase, heroId);
    throw error;
  }

  if (entries?.length) {
    return {
      rows: entries.map(entryToRow),
      updatedAt: latestUpdatedAt(entries),
    };
  }

  return fetchLegacyCloudMatchups(supabase, heroId);
}

export async function upsertCloudMatchups(heroId, rows) {
  const supabase = getClient();
  if (!supabase) return null;

  const updatedAt = new Date().toISOString();
  const payload = rows.map((row) => rowToEntry(heroId, row, updatedAt));

  const { error: deleteError } = await supabase
    .from('lol_matchup_entries')
    .delete()
    .eq('hero_id', heroId);

  if (deleteError) {
    if (deleteError.code === '42P01') {
      return upsertLegacyCloudMatchups(supabase, heroId, rows, updatedAt);
    }
    throw deleteError;
  }

  if (payload.length) {
    const { error: insertError } = await supabase.from('lol_matchup_entries').insert(payload);
    if (insertError) throw insertError;
  }

  return updatedAt;
}

async function upsertLegacyCloudMatchups(supabase, heroId, rows, updatedAt) {
  const { data, error } = await supabase
    .from('lol_matchups')
    .upsert(
      {
        hero_id: heroId,
        rows,
        updated_at: updatedAt,
      },
      { onConflict: 'hero_id' },
    )
    .select('updated_at')
    .single();

  if (error) throw error;
  return data?.updated_at || updatedAt;
}
