'use client';

import { createBrowserClient } from '@supabase/ssr';

/**
 * Supabase client para Client Components.
 * Usa a anon key — RLS do servidor é quem protege os dados.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
