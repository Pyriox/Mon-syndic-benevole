import Stripe from 'stripe';

// Initialisation lazy pour éviter l'échec au build si la clé est absente
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY manquante');
    _stripe = new Stripe(key, { apiVersion: '2026-02-25.clover' });
  }
  return _stripe;
}

// Alias pour compatibilité avec les fichiers existants
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as any)[prop];
  },
});

export const STRIPE_PRICES: Record<string, string> = {
  essentiel: process.env.STRIPE_PRICE_ESSENTIEL ?? '',
  confort:   process.env.STRIPE_PRICE_CONFORT ?? '',
  illimite:  process.env.STRIPE_PRICE_ILLIMITE ?? '',
};
