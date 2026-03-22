/**
 * Email administrateur — compatible Edge runtime (middleware).
 *
 * Supabase / Vercel Edge ne garantit pas la disponibilité de process.env
 * pour les variables sans préfixe NEXT_PUBLIC_ dans tous les contextes.
 * La valeur de fallback est identique à celle de l'env var afin de garantir
 * l'accès admin même si la variable d'environnement n'est pas résolue au runtime.
 *
 * Déjà normalisée (trim + toLowerCase) pour simplifier toutes les comparaisons.
 */
export const ADMIN_EMAIL = (process.env.ADMIN_EMAIL ?? 'tpn.fabien@gmail.com').trim().toLowerCase();
