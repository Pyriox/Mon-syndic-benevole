export type OnboardingReminderKind = 'j2' | 'j7';
export type OnboardingReminderKindRequest = OnboardingReminderKind | 'all' | null | undefined;

export function resolveOnboardingKinds(params: {
  requestedKind?: OnboardingReminderKindRequest;
  force?: boolean;
  hasTargetEmails?: boolean;
}): OnboardingReminderKind[] {
  const requestedKind = params.requestedKind ?? null;

  if (requestedKind === 'j2') return ['j2'];
  if (requestedKind === 'j7') return ['j7'];
  if (requestedKind === 'all') return ['j2', 'j7'];

  // Pour les déclenchements manuels ciblés, on reste prudent :
  // sans précision explicite, on n'envoie qu'une seule relance par défaut.
  if (params.force || params.hasTargetEmails) {
    return ['j2'];
  }

  return ['j2', 'j7'];
}
