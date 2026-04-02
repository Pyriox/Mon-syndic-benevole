import { describe, expect, it } from 'vitest';
import { shouldRunSignupFollowups } from '../auth-confirmation';

describe('shouldRunSignupFollowups', () => {
  it('runs follow-ups for a confirmed PKCE account even when the confirmation timestamp is not recent', () => {
    expect(
      shouldRunSignupFollowups({
        flow: 'pkce',
        emailConfirmedAt: '2026-03-20T08:15:00.000Z',
        hasAccountConfirmedEvent: false,
        hasWelcomeEmailDelivery: false,
      }),
    ).toBe(true);
  });

  it('does not rerun follow-ups when the account confirmation and welcome email were already recorded', () => {
    expect(
      shouldRunSignupFollowups({
        flow: 'pkce',
        emailConfirmedAt: '2026-03-20T08:15:00.000Z',
        hasAccountConfirmedEvent: true,
        hasWelcomeEmailDelivery: true,
      }),
    ).toBe(false);
  });

  it('runs follow-ups again when the confirmation was logged but the welcome email was never sent', () => {
    expect(
      shouldRunSignupFollowups({
        flow: 'pkce',
        emailConfirmedAt: '2026-03-20T08:15:00.000Z',
        hasAccountConfirmedEvent: true,
        hasWelcomeEmailDelivery: false,
      }),
    ).toBe(true);
  });
});
