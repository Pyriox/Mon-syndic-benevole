export function getSafeAuthRedirectPath(candidate: string | null | undefined, fallbackPath: string): string {
  if (!candidate) {
    return fallbackPath;
  }

  if (!candidate.startsWith('/') || candidate.startsWith('//') || candidate.startsWith('/\\')) {
    return fallbackPath;
  }

  try {
    const parsed = new URL(candidate, 'https://app.local');

    if (parsed.origin !== 'https://app.local') {
      return fallbackPath;
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallbackPath;
  }
}

export function shouldRunSignupFollowups(params: {
  flow: 'pkce' | 'token_hash';
  emailConfirmedAt?: string | null;
  hasAccountConfirmedEvent: boolean;
  hasWelcomeEmailDelivery: boolean;
}): boolean {
  const isConfirmed = params.flow === 'token_hash' || Boolean(params.emailConfirmedAt);

  if (!isConfirmed) {
    return false;
  }

  return !params.hasAccountConfirmedEvent || !params.hasWelcomeEmailDelivery;
}
