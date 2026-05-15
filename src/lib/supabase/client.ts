'use client';

import { createBrowserClient } from '@supabase/ssr';

/**
 * Supabase client para Client Components.
 *
 * Configura explicitamente o flow PKCE — sem isso, em alguns setups (extensões
 * de privacidade, ITP no Safari, modos privados) o code_verifier não persiste
 * entre a abertura do OAuth e o retorno do Google, causando o erro
 * "PKCE code verifier not found in storage" no callback.
 *
 * Usa anon key — RLS do servidor é quem protege os dados.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: 'pkce',
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    }
  );
}
