/**
 * Retourne la limite de lots autorisée selon le plan de la copropriété.
 *   essai      → 10 lots (non abonné)
 *   essentiel  → 10 lots
 *   confort    → 20 lots
 *   illimite   → ∞
 */
export function getLotLimit(plan?: string | null, planId?: string | null): number {
  if (plan === 'actif') {
    if (planId === 'illimite') return Infinity;
    if (planId === 'confort') return 20;
    return 10; // essentiel ou plan inconnu
  }
  return 10; // essai / inactif
}

/** Retourne true si la copropriété possède un abonnement actif. */
export function isSubscribed(plan?: string | null): boolean {
  return plan === 'actif';
}

/** Plans vers lesquels upgrader selon le plan actuel. */
export function getUpgradePlans(planId?: string | null): Array<'essentiel' | 'confort' | 'illimite'> {
  if (planId === 'confort') return ['illimite'];
  return ['confort', 'illimite'];
}
