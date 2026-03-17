import Stripe from 'stripe';

// Singleton Stripe (server-side only)
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
});

export const STRIPE_PRICES: Record<string, string> = {
  essentiel: process.env.STRIPE_PRICE_ESSENTIEL!,
  confort:   process.env.STRIPE_PRICE_CONFORT!,
  illimite:  process.env.STRIPE_PRICE_ILLIMITE!,
};
