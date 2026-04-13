import { describe, expect, it } from 'vitest';
import { buildSyndicOnboardingReminderSubject } from '../emails/syndic-notifications';
import { resolveOnboardingConfirmationWindow, resolveOnboardingKinds } from '../onboarding-reminders';

describe('buildSyndicOnboardingReminderSubject', () => {
  it('does not expose J+2/J+7 prefixes in the email subject', () => {
    const subject = buildSyndicOnboardingReminderSubject({ kind: 'j7', coproCount: 0 });

    expect(subject).not.toContain('J+2');
    expect(subject).not.toContain('J+7');
  });
});

describe('resolveOnboardingKinds', () => {
  it('defaults to only J+2 for forced manual targeted runs without explicit kind', () => {
    expect(resolveOnboardingKinds({ requestedKind: null, force: true, hasTargetEmails: true })).toEqual(['j2']);
  });

  it('keeps both kinds for the regular daily cron when no explicit kind is provided', () => {
    expect(resolveOnboardingKinds({ requestedKind: null, force: false, hasTargetEmails: false })).toEqual(['j2', 'j7']);
  });
});

describe('resolveOnboardingConfirmationWindow', () => {
  const referenceDate = new Date('2026-04-13T15:30:00.000Z');

  it('keeps a J+2 catch-up window covering the previous missed days', () => {
    expect(resolveOnboardingConfirmationWindow({ kind: 'j2', referenceDate })).toEqual({
      startDateIso: '2026-04-07',
      endDateIso: '2026-04-11',
    });
  });

  it('keeps a J+7 catch-up window for every confirmation up to J+7', () => {
    expect(resolveOnboardingConfirmationWindow({ kind: 'j7', referenceDate })).toEqual({
      startDateIso: null,
      endDateIso: '2026-04-06',
    });
  });

  it('can still resolve the exact historical day when catch-up is disabled', () => {
    expect(resolveOnboardingConfirmationWindow({ kind: 'j2', referenceDate, catchUp: false })).toEqual({
      startDateIso: '2026-04-11',
      endDateIso: '2026-04-11',
    });
  });
});
