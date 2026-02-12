import { createClient, SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;
let initialized = false;

export function getSupabase(): SupabaseClient | null {
  if (initialized) return client;
  initialized = true;

  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) return null;

  client = createClient(url, key);
  return client;
}
