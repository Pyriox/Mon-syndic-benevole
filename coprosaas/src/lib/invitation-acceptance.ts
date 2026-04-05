function normalizeEmail(value: string | null | undefined): string | null {
  const normalized = String(value ?? '').trim().toLowerCase();
  return normalized ? normalized : null;
}

export type InvitationAcceptanceState = 'accept-now' | 'needs-login' | 'wrong-account';

export function getInvitationAcceptanceState(params: {
  invitationEmail: string | null | undefined;
  currentUserEmail: string | null | undefined;
}): InvitationAcceptanceState {
  const invitationEmail = normalizeEmail(params.invitationEmail);
  const currentUserEmail = normalizeEmail(params.currentUserEmail);

  if (!currentUserEmail) {
    return 'needs-login';
  }

  if (invitationEmail && invitationEmail === currentUserEmail) {
    return 'accept-now';
  }

  return 'wrong-account';
}

export function buildInvitationLoginHref(token: string, email?: string | null): string {
  const params = new URLSearchParams({ invite_token: token.trim() });
  const normalizedEmail = normalizeEmail(email);

  if (normalizedEmail) {
    params.set('email', normalizedEmail);
  }

  return `/login?${params.toString()}`;
}
