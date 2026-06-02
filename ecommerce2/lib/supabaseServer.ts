import { createClient } from '@supabase/supabase-js';

/**
 * Creates a fresh Supabase server client.
 * ONLY used in server actions and Server Components — NEVER shipped to the browser.
 * Uses the anon key to ensure database Row Level Security (RLS) policies are respected.
 */
export function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_KEY;

  if (!url || !key) {
    throw new Error('[ACertain] Missing Supabase environment variables.');
  }

  return createClient(url, key);
}
