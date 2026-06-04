// ============================================================
// Helper : génération et vérification des tokens de désabonnement
//
// Le token = HMAC-SHA256(userId, UNSUBSCRIBE_SECRET) encodé en base64url.
// Pas d'expiration : le lien reste valide tant que l'adresse e-mail existe.
// Le userId seul est transmis dans l'URL → pas de données sensibles en clair.
// ============================================================

import { createHmac } from 'node:crypto';

const SECRET = process.env.UNSUBSCRIBE_SECRET ?? '';

/** Génère un token de désabonnement pour un userId donné. */
export function buildUnsubscribeToken(userId: string): string {
  if (!SECRET) throw new Error('UNSUBSCRIBE_SECRET environment variable is not set');
  return createHmac('sha256', SECRET).update(userId).digest('base64url');
}

/** Vérifie qu'un token correspond bien à un userId (timing-safe). */
export function verifyUnsubscribeToken(userId: string, token: string): boolean {
  if (!SECRET) return false;
  const expected = buildUnsubscribeToken(userId);
  // Comparaison constante pour éviter les timing attacks
  if (expected.length !== token.length) return false;
  const buf1 = Buffer.from(expected, 'base64url');
  const buf2 = Buffer.from(token, 'base64url');
  if (buf1.length !== buf2.length) return false;
  let diff = 0;
  for (let i = 0; i < buf1.length; i++) diff |= buf1[i] ^ buf2[i];
  return diff === 0;
}

/** Construit l'URL complète de désabonnement pour un userId. */
export function buildUnsubscribeUrl(userId: string, siteUrl: string): string {
  const token = buildUnsubscribeToken(userId);
  return `${siteUrl}/api/unsubscribe?uid=${encodeURIComponent(userId)}&token=${encodeURIComponent(token)}`;
}
