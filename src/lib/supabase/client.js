import { createClient } from '@supabase/supabase-js';

let client = null;

export function isSupabaseConfigured() {
  return Boolean(
    import.meta.env.PUBLIC_SUPABASE_URL && import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function getSupabaseClient() {
  if (!isSupabaseConfigured()) return null;
  if (!client) {
    client = createClient(
      import.meta.env.PUBLIC_SUPABASE_URL,
      import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    );
  }
  return client;
}

export function parseRpcJson(value) {
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

export function parseUpdatedAt(value = '') {
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : 0;
}
