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

export async function fetchCloudMatchups(heroId) {
  const supabase = getClient();
  if (!supabase) return null;

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
  };
}

export async function upsertCloudMatchups(heroId, rows) {
  const supabase = getClient();
  if (!supabase) return null;

  const updatedAt = new Date().toISOString();
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
