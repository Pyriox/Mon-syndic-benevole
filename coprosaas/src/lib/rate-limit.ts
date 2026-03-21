// ============================================================
// Rate limiter distribué — Upstash Redis + @upstash/ratelimit
// Fonctionne correctement en multi-instance serverless (Vercel).
//
// Variables d'environnement requises :
//   UPSTASH_REDIS_REST_URL   — URL REST de votre instance Upstash Redis
//   UPSTASH_REDIS_REST_TOKEN — Token readonly ou readwrite Upstash
//
// Si les variables ne sont pas définies (ex: développement local),
// on bascule sur un rate limiter in-memory de fallback.
// ============================================================
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// ── Fallback in-memory (développement local sans Redis) ──────────────────
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

// ── Client Redis (singleton) ─────────────────────────────────────────────
let redis: Redis | null = null;
function getRedis(): Redis | null {
  if (redis) return redis;
  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  redis = new Redis({ url, token });
  return redis;
}

// ── Cache des instances Ratelimit par configuration ──────────────────────
const limiters = new Map<string, Ratelimit>();

function getRatelimit(limit: number, windowMs: number): Ratelimit | null {
  const r = getRedis();
  if (!r) return null;
  const key = `${limit}:${windowMs}`;
  if (!limiters.has(key)) {
    limiters.set(key, new Ratelimit({
      redis: r,
      limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
      prefix: 'rl',
    }));
  }
  return limiters.get(key)!;
}

/**
 * Retourne true si la requête est autorisée, false si limitée.
 * Utilise Upstash Redis si configuré, sinon fallback in-memory.
 *
 * @param key      Identifiant unique (IP, user ID, email…)
 * @param limit    Nombre max de requêtes dans la fenêtre
 * @param windowMs Durée de la fenêtre en millisecondes
 */
export async function rateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  const limiter = getRatelimit(limit, windowMs);
  if (!limiter) {
    // Fallback synchrone si Redis non configuré
    return localRateLimit(key, limit, windowMs);
  }
  const { success } = await limiter.limit(key);
  return success;
}

/** Extrait l'IP client depuis les headers Vercel/Next.js. */
export function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  );
}
