export type BasePlanId = 'essentiel' | 'confort' | 'illimite';
export type CoproAddonKey = 'charges_speciales';
export type CoproAddonStatus = 'inactive' | 'active' | 'trialing' | 'past_due' | 'canceled' | string;

export interface CoproAddon {
  id?: string;
  copropriete_id?: string;
  addon_key: CoproAddonKey | string;
  status: CoproAddonStatus | null;
  current_period_end?: string | null;
  cancel_at_period_end?: boolean | null;
  stripe_price_id?: string | null;
  stripe_subscription_item_id?: string | null;
}

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

function hasFuturePeriodEnd(periodEnd?: string | null, nowIso: string = new Date().toISOString()): boolean {
  return Boolean(periodEnd && periodEnd > nowIso);
}

export function hasAddonAccess(addon?: Partial<CoproAddon> | null, nowIso: string = new Date().toISOString()): boolean {
  if (!addon) return false;

  const status = addon.status ?? null;
  if (status === 'active' || status === 'trialing' || status === 'past_due') {
    return true;
  }

  if (addon.cancel_at_period_end) {
    return hasFuturePeriodEnd(addon.current_period_end, nowIso);
  }

  return false;
}

export function hasAddon(
  addons: CoproAddon[] | null | undefined,
  addonKey: CoproAddonKey,
  nowIso: string = new Date().toISOString(),
): boolean {
  return (addons ?? []).some((addon) => addon.addon_key === addonKey && hasAddonAccess(addon, nowIso));
}

export function hasChargesSpecialesAddon(addons: CoproAddon[] | null | undefined, nowIso: string = new Date().toISOString()): boolean {
  return hasAddon(addons, 'charges_speciales', nowIso);
}

/** Plans vers lesquels upgrader selon le plan actuel. */
export function getUpgradePlans(planId?: string | null): Array<'essentiel' | 'confort' | 'illimite'> {
  if (planId === 'confort') return ['illimite'];
  return ['confort', 'illimite'];
}
