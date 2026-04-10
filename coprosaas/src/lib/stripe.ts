import Stripe from 'stripe';
import type { BasePlanId, CoproAddonKey } from '@/lib/subscription';

type PriceLike = {
  id?: string | null;
  lookup_key?: string | null;
  nickname?: string | null;
  metadata?: Record<string, string> | null;
  product?: string | Record<string, unknown> | null;
};
export type StripeSubscriptionAddonSnapshot = {
  addonKey: CoproAddonKey;
  priceId: string | null;
  subscriptionItemId: string | null;
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
};

export type StripeSubscriptionSnapshot = {
  customerId: string | null;
  subscriptionId: string | null;
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  planId: BasePlanId | null;
  addons: StripeSubscriptionAddonSnapshot[];
};

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
  get(_target, prop, receiver) {
    return Reflect.get(getStripe(), prop, receiver);
  },
});

export const STRIPE_PRICES: Record<BasePlanId, string> = {
  essentiel: (process.env.STRIPE_PRICE_ESSENTIEL ?? '').trim(),
  confort:   (process.env.STRIPE_PRICE_CONFORT ?? '').trim(),
  illimite:  (process.env.STRIPE_PRICE_ILLIMITE ?? '').trim(),
};

export const STRIPE_ADDON_PRICES: Record<CoproAddonKey, string> = {
  charges_speciales: (process.env.STRIPE_PRICE_ADDON_CHARGES_SPECIALES ?? process.env.STRIPE_PRICE_CHARGES_SPECIALES ?? '').trim(),
};

const PLAN_IDS = Object.keys(STRIPE_PRICES) as BasePlanId[];
const ADDON_KEYS = Object.keys(STRIPE_ADDON_PRICES) as CoproAddonKey[];

function normalizeBillingSlug(value?: string | null): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function readProductMetadata(price?: PriceLike | Stripe.Price | null): Record<string, string> | null {
  if (!price || !price.product || typeof price.product === 'string') return null;
  return ((price.product as { metadata?: Record<string, string> | null }).metadata) ?? null;
}

function isBasePlanId(value?: string | null): value is BasePlanId {
  return PLAN_IDS.includes(value as BasePlanId);
}

function pickKnownKey(candidates: Array<string | null | undefined>, knownKeys: readonly string[]): string | null {
  for (const candidate of candidates) {
    const normalized = normalizeBillingSlug(candidate);
    if (!normalized) continue;

    const exact = knownKeys.find((key) => key === normalized || `addon_${key}` === normalized || normalized.endsWith(`_${key}`));
    if (exact) return exact;
  }

  return null;
}

export function getPlanIdFromPrice(price?: string | PriceLike | Stripe.Price | null): BasePlanId | null {
  if (!price) return null;

  if (typeof price === 'string') {
    const exactPlan = PLAN_IDS.find((planId) => STRIPE_PRICES[planId] && STRIPE_PRICES[planId] === price);
    return exactPlan ?? (isBasePlanId(price) ? price : null);
  }

  const metadata = price.metadata ?? {};
  const productMetadata = readProductMetadata(price) ?? {};
  const fromMetadata = metadata.plan_id ?? productMetadata.plan_id;
  if (isBasePlanId(fromMetadata)) return fromMetadata;

  const exactPlan = PLAN_IDS.find((planId) => {
    const configuredPriceId = STRIPE_PRICES[planId];
    return Boolean(configuredPriceId) && configuredPriceId === price.id;
  });
  if (exactPlan) return exactPlan;

  const fromKnownKey = pickKnownKey([price.lookup_key, price.nickname], PLAN_IDS);
  return isBasePlanId(fromKnownKey) ? fromKnownKey : null;
}

export function getAddonKeyFromPrice(price?: string | PriceLike | Stripe.Price | null): CoproAddonKey | null {
  if (!price) return null;

  if (typeof price === 'string') {
    return ADDON_KEYS.find((key) => STRIPE_ADDON_PRICES[key] && STRIPE_ADDON_PRICES[key] === price) ?? null;
  }

  const metadata = price.metadata ?? {};
  const productMetadata = readProductMetadata(price) ?? {};
  const fromMetadata = pickKnownKey([metadata.addon_key, productMetadata.addon_key], ADDON_KEYS);
  if (fromMetadata) return fromMetadata as CoproAddonKey;

  const exactAddon = ADDON_KEYS.find((key) => {
    const configuredPriceId = STRIPE_ADDON_PRICES[key];
    return Boolean(configuredPriceId) && configuredPriceId === price.id;
  });
  if (exactAddon) return exactAddon;

  const fromKnownKey = pickKnownKey([price.lookup_key, price.nickname], ADDON_KEYS);
  return (fromKnownKey as CoproAddonKey | null) ?? null;
}

export function mapStripeSubscriptionStatus(status: string): 'actif' | 'essai' | 'passe_du' | 'inactif' {
  if (status === 'active') return 'actif';
  if (status === 'trialing') return 'essai';
  if (status === 'past_due') return 'passe_du';
  return 'inactif';
}

export function mapStripeAddonStatus(status: string): 'inactive' | 'active' | 'trialing' | 'past_due' | 'canceled' {
  if (status === 'active' || status === 'trialing' || status === 'past_due') return status;
  if (status === 'canceled') return 'canceled';
  return 'inactive';
}

export function extractStripeSubscriptionSnapshot(subscription: Stripe.Subscription | Record<string, unknown>): StripeSubscriptionSnapshot {
  const raw = subscription as Record<string, unknown>;
  const rawItems = (raw.items as { data?: Array<Record<string, unknown>> } | undefined)?.data ?? [];
  const status = typeof raw.status === 'string' ? raw.status : 'incomplete';
  const cancelAtPeriodEnd = Boolean(raw.cancel_at_period_end);
  const periodEndTimestamp = typeof raw.current_period_end === 'number'
    ? raw.current_period_end
    : typeof raw.billing_cycle_anchor === 'number'
      ? raw.billing_cycle_anchor
      : 0;
  const currentPeriodEnd = periodEndTimestamp > 0
    ? (() => {
        try {
          return new Date(periodEndTimestamp * 1000).toISOString();
        } catch {
          return null;
        }
      })()
    : null;

  const metadata = (raw.metadata as Record<string, string> | undefined) ?? {};
  const metadataPlanId = isBasePlanId(metadata.plan_id) ? metadata.plan_id : null;
  const planId = metadataPlanId
    ?? rawItems.map((item) => getPlanIdFromPrice(item.price as PriceLike | undefined)).find(Boolean)
    ?? null;

  const addons = rawItems
    .map((item) => {
      const price = item.price as PriceLike | undefined;
      const addonKey = getAddonKeyFromPrice(price);
      if (!addonKey) return null;

      return {
        addonKey,
        priceId: typeof price?.id === 'string' ? price.id : null,
        subscriptionItemId: typeof item.id === 'string' ? item.id : null,
        status,
        currentPeriodEnd,
        cancelAtPeriodEnd,
      } satisfies StripeSubscriptionAddonSnapshot;
    })
    .filter((addon): addon is StripeSubscriptionAddonSnapshot => Boolean(addon));

  return {
    customerId: typeof raw.customer === 'string' ? raw.customer : null,
    subscriptionId: typeof raw.id === 'string' ? raw.id : null,
    status,
    currentPeriodEnd,
    cancelAtPeriodEnd,
    planId,
    addons,
  };
}
