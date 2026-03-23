/**
 * Helpers d'accès admin.
 *
 * isAdminUser est compatible Edge Runtime (middleware) — reçoit en paramètre
 * un client Supabase déjà instancié pour éviter d'importer server-only.
 * La table admin_users est interrogée via RLS (self-read) dans le middleware
 * et via le service role dans les pages/API.
 *
 * ADMIN_EMAIL conservé pour rétrocompatibilité (seed migration).
 */
export const ADMIN_EMAIL = (process.env.ADMIN_EMAIL ?? 'tpn.fabien@gmail.com').trim().toLowerCase();

/**
 * Vérifie qu'un userId est présent dans la table admin_users.
 * Accepte n'importe quel client Supabase (anon ou service role).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function isAdminUser(userId: string, supabase: any): Promise<boolean> {
  const { data } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();
  return !!data;
}
