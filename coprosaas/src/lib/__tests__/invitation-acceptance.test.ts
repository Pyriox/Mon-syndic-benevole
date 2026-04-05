import { describe, expect, it } from 'vitest';
import { buildInvitationLoginHref, getInvitationAcceptanceState } from '../invitation-acceptance';

describe('getInvitationAcceptanceState', () => {
  it('returns accept-now when the current session matches the invited email', () => {
    expect(getInvitationAcceptanceState({
      invitationEmail: 'copro@example.com',
      currentUserEmail: 'Copro@Example.com',
    })).toBe('accept-now');
  });

  it('returns needs-login when there is no active session', () => {
    expect(getInvitationAcceptanceState({
      invitationEmail: 'copro@example.com',
      currentUserEmail: null,
    })).toBe('needs-login');
  });

  it('returns wrong-account when another user is connected', () => {
    expect(getInvitationAcceptanceState({
      invitationEmail: 'copro@example.com',
      currentUserEmail: 'other@example.com',
    })).toBe('wrong-account');
  });
});

describe('buildInvitationLoginHref', () => {
  it('preserves the invite token and normalizes the email query param', () => {
    expect(buildInvitationLoginHref('token-123', 'Copro@Example.com')).toBe('/login?invite_token=token-123&email=copro%40example.com');
  });
});
