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
