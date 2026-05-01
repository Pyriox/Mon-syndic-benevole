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
  // Les deux flux n'atteignent cette fonction qu'après une confirmation réussie :
  // - token_hash : verifyOtp a réussi
  // - pkce : exchangeCodeForSession a réussi
  // email_confirmed_at peut être null dans la réponse Supabase même si le compte
  // vient d'être confirmé ; on ne l'utilise donc pas comme condition bloquante.
  void params.emailConfirmedAt;

  return !params.hasAccountConfirmedEvent || !params.hasWelcomeEmailDelivery;
}
