// ============================================================
// Rate limiter in-memory (fenêtre glissante par clé)
// Sufficient pour un SaaS au démarrage (Vercel mono/bi-instance).
// Remplacer par Upstash Redis si besoin de comptage distribué.
// ============================================================
type Entry = { count: number; resetAt: number };
const localStore = new Map<string, Entry>();

function localRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  if (Math.random() < 0.05) {
    for (const [k, e] of localStore) { if (e.resetAt < now) localStore.delete(k); }
  }
  const entry = localStore.get(key);
  if (!entry || entry.resetAt < now) {
    localStore.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

/**
 * Retourne true si la requête est autorisée, false si limitée.
 *
 * @param key      Identifiant unique (IP, user ID, email…)
 * @param limit    Nombre max de requêtes dans la fenêtre
 * @param windowMs Durée de la fenêtre en millisecondes
 */
export async function rateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  return localRateLimit(key, limit, windowMs);
}

/** Extrait l'IP client depuis les headers Vercel/Next.js. */
export function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  );
}
