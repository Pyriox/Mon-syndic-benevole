export type OnboardingReminderKind = 'j2' | 'j7';
export type OnboardingReminderKindRequest = OnboardingReminderKind | 'all' | null | undefined;

function startOfUtcDay(value: Date): Date {
  const normalized = new Date(value);
  normalized.setUTCHours(0, 0, 0, 0);
  return normalized;
}

function addUtcDays(base: Date, days: number): string {
  const next = startOfUtcDay(base);
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString().slice(0, 10);
}

export function resolveOnboardingConfirmationWindow(params: {
  kind: OnboardingReminderKind;
  referenceDate?: Date;
  catchUp?: boolean;
}): {
  startDateIso: string | null;
  endDateIso: string;
} {
  const referenceDate = startOfUtcDay(params.referenceDate ?? new Date());
  const catchUp = params.catchUp !== false;

  if (params.kind === 'j2') {
    return {
      startDateIso: catchUp ? addUtcDays(referenceDate, -6) : addUtcDays(referenceDate, -2),
      endDateIso: addUtcDays(referenceDate, -2),
    };
  }

  return {
    startDateIso: catchUp ? null : addUtcDays(referenceDate, -7),
    endDateIso: addUtcDays(referenceDate, -7),
  };
}

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
