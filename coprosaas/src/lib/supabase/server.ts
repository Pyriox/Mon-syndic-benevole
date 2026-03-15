// ============================================================
// Client Supabase côté serveur (Server Components, Server Actions, Route Handlers)
// Utilise createServerClient de @supabase/ssr avec les cookies Next.js
// ============================================================
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Crée un client Supabase pour l'utilisation côté serveur.
 * À utiliser dans les Server Components et Route Handlers.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll peut échouer dans les Server Components (lecture seule)
            // Ignoré car le middleware gère le rafraîchissement des sessions
          }
        },
      },
    }
  );
}
