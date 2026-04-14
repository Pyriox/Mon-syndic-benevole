// ============================================================
// Rate limiter in-memory (fenêtre glissante par clé)
// Sufficient pour un SaaS au démarrage (Vercel mono/bi-instance).
// Remplacer par Upstash Redis si besoin de comptage distribué.
// ============================================================
type Entry = { count: number; resetAt: number };
const localStore = new Map<string, Entry>();
let hasWarnedAboutRedisFallback = false;

function getUpstashConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (!url || !token) return null;
  return { url, token };
}

async function upstashPipeline(commands: Array<Array<string | number>>): Promise<Array<{ result?: unknown; error?: string }>> {
  const config = getUpstashConfig();
  if (!config) {
    throw new Error('Upstash Redis non configuré');
  }

  const response = await fetch(`${config.url}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.token}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
    body: JSON.stringify(commands),
  });

  if (!response.ok) {
    throw new Error(`Upstash Redis HTTP ${response.status}`);
  }

  return response.json() as Promise<Array<{ result?: unknown; error?: string }>>;
}

async function distributedRateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  const now = Date.now();
  const windowKey = `ratelimit:${windowMs}:${Math.floor(now / windowMs)}:${key}`;
  const results = await upstashPipeline([
    ['INCR', windowKey],
    ['PEXPIRE', windowKey, windowMs + 1000],
  ]);

  if (results.some((entry) => entry.error)) {
    throw new Error(results.find((entry) => entry.error)?.error ?? 'Erreur Upstash Redis');
  }

  const count = Number(results[0]?.result ?? 0);
  return Number.isFinite(count) && count <= limit;
}

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
  try {
    if (getUpstashConfig()) {
      return await distributedRateLimit(key, limit, windowMs);
    }
  } catch (error) {
    if (!hasWarnedAboutRedisFallback) {
      hasWarnedAboutRedisFallback = true;
      console.warn('[rate-limit] fallback mémoire activé:', error instanceof Error ? error.message : error);
    }
  }

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
