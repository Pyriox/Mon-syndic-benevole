import { describe, expect, it } from 'vitest';
import { buildSyndicOnboardingReminderSubject } from '../emails/syndic-notifications';
import { resolveOnboardingKinds } from '../onboarding-reminders';

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
