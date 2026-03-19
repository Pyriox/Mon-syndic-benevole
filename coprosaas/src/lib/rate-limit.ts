// ============================================================
// Rate limiter in-memory — fenêtre glissante par clé (IP, user ID...)
// Efficace par instance serverless. Pour une protection distribuée
// (multi-instance), utiliser Upstash Redis + @upstash/ratelimit.
// ============================================================

type Entry = { count: number; resetAt: number };

const store = new Map<string, Entry>();

/**
 * Retourne true si la requête est autorisée, false si limitée.
 * @param key      Identifiant unique (IP, user ID, email…)
 * @param limit    Nombre max de requêtes dans la fenêtre
 * @param windowMs Durée de la fenêtre en millisecondes
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();

  // Nettoyage périodique pour éviter une fuite mémoire
  if (Math.random() < 0.05) {
    for (const [k, entry] of store) {
      if (entry.resetAt < now) store.delete(k);
    }
  }

  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) return false;

  entry.count++;
  return true;
}

/** Extrait l'IP client depuis les headers Vercel/Next.js. */
export function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  );
}
