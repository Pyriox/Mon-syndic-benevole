/**
 * Retourne la limite de lots autorisée selon le plan de la copropriété.
 *   null/inactif  → 10 lots (non abonné, aucun moyen de paiement enregistré)
 *   essai         → 10 lots (période d'essai de 14 jours, CB enregistrée)
 *   essentiel     → 10 lots
 *   confort       → 20 lots
 *   illimite      → ∞
 */
export function getLotLimit(plan?: string | null, planId?: string | null): number {
  if (plan === 'actif' || plan === 'essai') {
    if (planId === 'illimite') return Infinity;
    if (planId === 'confort') return 20;
    return 10; // essentiel ou plan inconnu
  }
  return 10; // null / inactif (aucun moyen de paiement enregistré)
}

/**
 * Retourne true si la copropriété possède un accès actif :
 *   - 'actif'  = abonnement payant confirmé
 *   - 'essai'  = période d'essai de 14 jours (CB enregistrée, paiement non encore prélevé)
 */
export function isSubscribed(plan?: string | null): boolean {
  return plan === 'actif' || plan === 'essai';
}

/** Plans vers lesquels upgrader selon le plan actuel. */
export function getUpgradePlans(planId?: string | null): Array<'essentiel' | 'confort' | 'illimite'> {
  if (planId === 'confort') return ['illimite'];
  return ['confort', 'illimite'];
}
