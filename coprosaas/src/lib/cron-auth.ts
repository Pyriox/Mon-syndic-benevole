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

function getConfiguredCronSecrets(): string[] {
  const candidates = [
    process.env.CRON_SECRET,
    process.env.CRON_SECRET_PREVIOUS,
  ];

  return candidates
    .map((value) => extractCronSecretCandidate(value))
    .filter((value): value is string => Boolean(value));
}

function matchesAnyCronSecret(provided: string | null | undefined, expectedSecrets: string[]): boolean {
  for (const expected of expectedSecrets) {
    if (isValidCronSecret(provided, expected)) {
      return true;
    }
  }

  return false;
}

export function getCronAuthState(req: NextRequest): {
  ok: boolean;
  debug: {
    cronSecretConfigured: boolean;
    authHeaderPresent: boolean;
    xCronSecretHeaderPresent: boolean;
  };
} {
  const expectedSecrets = getConfiguredCronSecrets();
  const authHeader = req.headers.get('authorization');
  const xCronSecret = req.headers.get('x-cron-secret');

  const ok = matchesAnyCronSecret(authHeader, expectedSecrets)
    || matchesAnyCronSecret(xCronSecret, expectedSecrets);

  return {
    ok,
    debug: {
      cronSecretConfigured: expectedSecrets.length > 0,
      authHeaderPresent: Boolean(authHeader),
      xCronSecretHeaderPresent: Boolean(xCronSecret),
    },
  };
}
