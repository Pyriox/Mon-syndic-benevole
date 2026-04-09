// ============================================================
// Client Supabase côté navigateur (Client Components)
// Utilise createBrowserClient de @supabase/ssr
// ============================================================
import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

let browserClient: SupabaseClient | undefined;

/**
 * Crée un client Supabase pour l'utilisation dans les Client Components React.
 * À utiliser dans les composants avec 'use client'.
 * Le client navigateur est mémorisé pour éviter de ré-instancier Supabase à
 * chaque rendu, ce qui fluidifie le flux de connexion et stabilise l'état auth.
 */
export function createClient(): SupabaseClient {
  if (!browserClient) {
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  return browserClient;
}
