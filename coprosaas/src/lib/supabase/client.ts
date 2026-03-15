// ============================================================
// Client Supabase côté navigateur (Client Components)
// Utilise createBrowserClient de @supabase/ssr
// ============================================================
import { createBrowserClient } from '@supabase/ssr';

/**
 * Crée un client Supabase pour l'utilisation dans les Client Components React.
 * À utiliser dans les composants avec 'use client'.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
