import type { NextRequest } from 'next/server';

export function extractCronSecretCandidate(value: string | null | undefined): string | null {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const bearerMatch = trimmed.match(/^Bearer\s+(.+)$/i);
  return (bearerMatch?.[1] ?? trimmed).trim() || null;
}

export function isValidCronSecret(
  provided: string | null | undefined,
  expected: string | null | undefined,
): boolean {
  const normalizedExpected = extractCronSecretCandidate(expected);
  const normalizedProvided = extractCronSecretCandidate(provided);

  return Boolean(normalizedExpected && normalizedProvided && normalizedExpected === normalizedProvided);
}

export function getCronAuthState(req: NextRequest): {
  ok: boolean;
  debug: {
    cronSecretConfigured: boolean;
    authHeaderPresent: boolean;
    xCronSecretHeaderPresent: boolean;
  };
} {
  const expectedSecret = process.env.CRON_SECRET ?? null;
  const authHeader = req.headers.get('authorization');
  const xCronSecret = req.headers.get('x-cron-secret');

  const ok = isValidCronSecret(authHeader, expectedSecret)
    || isValidCronSecret(xCronSecret, expectedSecret);

  return {
    ok,
    debug: {
      cronSecretConfigured: Boolean(extractCronSecretCandidate(expectedSecret)),
      authHeaderPresent: Boolean(authHeader),
      xCronSecretHeaderPresent: Boolean(xCronSecret),
    },
  };
}
