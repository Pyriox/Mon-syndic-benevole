// ============================================================
// Source unique des tarifs des plans d'abonnement.
// Toute page (dashboard, landing, articles de blog) doit lire ces
// valeurs plutôt que de coder un prix en dur, pour éviter les
// tarifs obsolètes affichés à différents endroits du site.
// ============================================================

export const PRICING_PLANS = [
  {
    id: 'essentiel',
    name: 'Essentiel',
    desc: '10 lots inclus',
    annual: 360,
    monthlyLabel: '30 €',
    badge: 'Le plus populaire',
    highlight: true,
    maxLots: 10,
  },
  {
    id: 'confort',
    name: 'Confort',
    desc: '20 lots inclus',
    annual: 540,
    monthlyLabel: '45 €',
    badge: null,
    highlight: false,
    maxLots: 20,
  },
  {
    id: 'illimite',
    name: 'Illimité',
    desc: 'Lots illimités',
    annual: 960,
    monthlyLabel: '80 €',
    badge: null,
    highlight: false,
    maxLots: Infinity,
  },
] as const;

export type PricingPlanId = (typeof PRICING_PLANS)[number]['id'];

export const ENTRY_PLAN = PRICING_PLANS[0];
export const MAX_PLAN = PRICING_PLANS[PRICING_PLANS.length - 1];

/** Plan couvrant un nombre de lots donné (le moins cher qui suffit). */
export function planForLotCount(lots: number) {
  return PRICING_PLANS.find((plan) => lots <= plan.maxLots) ?? MAX_PLAN;
}
