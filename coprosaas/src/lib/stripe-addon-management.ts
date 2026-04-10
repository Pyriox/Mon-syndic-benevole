import { createAdminClient } from '@/lib/supabase/admin';
import {
  STRIPE_ADDON_PRICES,
  extractStripeSubscriptionSnapshot,
  getAddonKeyFromPrice,
  mapStripeAddonStatus,
  stripe,
  type StripeSubscriptionAddonSnapshot,
  type StripeSubscriptionSnapshot,
} from '@/lib/stripe';
import type { CoproAddonKey } from '@/lib/subscription';

export const KNOWN_ADDON_KEYS = ['charges_speciales'] as const;

type DbAddonSnapshot = {
  addonKey: CoproAddonKey;
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  priceId: string | null;
  subscriptionItemId: string | null;
};

type ExistingAddonRow = {
  addon_key: string;
  status: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  stripe_subscription_id: string | null;
  stripe_subscription_item_id: string | null;
  stripe_price_id: string | null;
};

export type CoproAddonMutationResult =
  | {
      ok: true;
      message: string;
      currentPeriodEnd: string | null;
      alreadyApplied?: boolean;
    }
  | {
      ok: false;
      status: number;
      error: string;
    };

function hasFuturePeriodEnd(periodEnd?: string | null, nowIso: string = new Date().toISOString()): boolean {
  return Boolean(periodEnd && periodEnd > nowIso);
}

function toDbAddonSnapshots(snapshot: StripeSubscriptionSnapshot | null): DbAddonSnapshot[] {
  return (snapshot?.addons ?? []).map((addon: StripeSubscriptionAddonSnapshot) => ({
    addonKey: addon.addonKey,
    status: addon.status,
    currentPeriodEnd: addon.currentPeriodEnd,
    cancelAtPeriodEnd: addon.cancelAtPeriodEnd,
    priceId: addon.priceId,
    subscriptionItemId: addon.subscriptionItemId,
  }));
}

export async function syncCoproAddonsFromSnapshot(coproId: string, snapshot: StripeSubscriptionSnapshot | null) {
  return syncCoproAddonsToDb(coproId, toDbAddonSnapshots(snapshot), snapshot?.subscriptionId ?? null, snapshot?.currentPeriodEnd ?? null);
}

export async function syncCoproAddonsToDb(
  coproId: string,
  addons: DbAddonSnapshot[],
  subscriptionId?: string | null,
  fallbackCurrentPeriodEnd?: string | null,
) {
  const admin = createAdminClient();
  const nowIso = new Date().toISOString();
  const { data: existingRows } = await admin
    .from('copro_addons')
    .select('addon_key, status, current_period_end, cancel_at_period_end, stripe_subscription_id, stripe_subscription_item_id, stripe_price_id')
    .eq('copropriete_id', coproId)
    .in('addon_key', [...KNOWN_ADDON_KEYS]);

  const existingByKey = new Map<string, ExistingAddonRow>(
    (existingRows ?? []).map((row) => [row.addon_key, row as ExistingAddonRow]),
  );

  const seenKeys = new Set<string>();

  for (const addon of addons) {
    seenKeys.add(addon.addonKey);
    await admin
      .from('copro_addons')
      .upsert({
        copropriete_id: coproId,
        addon_key: addon.addonKey,
        status: mapStripeAddonStatus(addon.status ?? 'inactive'),
        stripe_subscription_id: subscriptionId ?? null,
        stripe_subscription_item_id: addon.subscriptionItemId ?? null,
        stripe_price_id: addon.priceId ?? null,
        current_period_end: addon.currentPeriodEnd ?? fallbackCurrentPeriodEnd ?? null,
        cancel_at_period_end: addon.cancelAtPeriodEnd ?? false,
      }, { onConflict: 'copropriete_id,addon_key' });
  }

  for (const addonKey of KNOWN_ADDON_KEYS) {
    if (seenKeys.has(addonKey)) continue;

    const existing = existingByKey.get(addonKey);
    const keepScheduledAccess = Boolean(
      subscriptionId
      && existing?.cancel_at_period_end
      && hasFuturePeriodEnd(existing.current_period_end, nowIso),
    );

    await admin
      .from('copro_addons')
      .upsert({
        copropriete_id: coproId,
        addon_key: addonKey,
        status: keepScheduledAccess ? 'canceled' : 'inactive',
        stripe_subscription_id: subscriptionId ?? existing?.stripe_subscription_id ?? null,
        stripe_subscription_item_id: keepScheduledAccess ? existing?.stripe_subscription_item_id ?? null : null,
        stripe_price_id: keepScheduledAccess ? existing?.stripe_price_id ?? null : null,
        current_period_end: keepScheduledAccess
          ? existing?.current_period_end ?? fallbackCurrentPeriodEnd ?? null
          : fallbackCurrentPeriodEnd ?? null,
        cancel_at_period_end: keepScheduledAccess,
      }, { onConflict: 'copropriete_id,addon_key' });
  }
}

async function loadAddonContext(coproprieteId: string, syndicId: string, addonKey: CoproAddonKey) {
  const admin = createAdminClient();
  const { data: copro, error } = await admin
    .from('coproprietes')
    .select('id, nom, stripe_subscription_id, stripe_customer_id')
    .eq('id', coproprieteId)
    .eq('syndic_id', syndicId)
    .single();

  if (error || !copro) {
    return { ok: false, status: 404, error: 'Copropriété introuvable.' } as const;
  }

  if (!copro.stripe_subscription_id || !copro.stripe_customer_id) {
    return { ok: false, status: 409, error: 'Activez d’abord un abonnement principal pour cette copropriété.' } as const;
  }

  const addonPriceId = STRIPE_ADDON_PRICES[addonKey];
  if (!addonPriceId || addonPriceId.startsWith('price_REMPLACER')) {
    return { ok: false, status: 500, error: 'Le prix Stripe de cette option n’est pas configuré.' } as const;
  }

  const subscription = await stripe.subscriptions.retrieve(copro.stripe_subscription_id, {
    expand: ['items.data.price.product'],
  });

  if (['canceled', 'incomplete_expired'].includes(subscription.status)) {
    return { ok: false, status: 409, error: 'Cet abonnement ne peut plus être modifié.' } as const;
  }

  const { data: existingAddon } = await admin
    .from('copro_addons')
    .select('status, current_period_end, cancel_at_period_end, stripe_subscription_item_id, stripe_price_id')
    .eq('copropriete_id', coproprieteId)
    .eq('addon_key', addonKey)
    .maybeSingle();

  return { ok: true, admin, copro, addonPriceId, subscription, existingAddon } as const;
}

function findAddonItem(subscription: Awaited<ReturnType<typeof stripe.subscriptions.retrieve>>, addonKey: CoproAddonKey, addonPriceId: string) {
  return subscription.items.data.find((item) => {
    const price = typeof item.price === 'string' ? item.price : item.price;
    return getAddonKeyFromPrice(price) === addonKey || (typeof item.price !== 'string' && item.price.id === addonPriceId);
  }) ?? null;
}

export async function enableCoproAddon(coproprieteId: string, syndicId: string, addonKey: CoproAddonKey): Promise<CoproAddonMutationResult> {
  const context = await loadAddonContext(coproprieteId, syndicId, addonKey);
  if (!context.ok) return context;

  const { copro, addonPriceId, subscription, existingAddon } = context;
  const existingItem = findAddonItem(subscription, addonKey, addonPriceId);

  if (existingItem) {
    const snapshot = extractStripeSubscriptionSnapshot(subscription);
    await syncCoproAddonsFromSnapshot(copro.id, snapshot);
    return {
      ok: true,
      message: 'L’option est déjà active pour cette copropriété.',
      currentPeriodEnd: snapshot.currentPeriodEnd,
      alreadyApplied: true,
    };
  }

  const resumeWithoutProration = Boolean(
    existingAddon?.cancel_at_period_end && hasFuturePeriodEnd(existingAddon.current_period_end),
  );

  await stripe.subscriptionItems.create({
    subscription: subscription.id,
    price: addonPriceId,
    quantity: 1,
    proration_behavior: resumeWithoutProration ? 'none' : 'create_prorations',
  });

  const updatedSubscription = await stripe.subscriptions.retrieve(subscription.id, {
    expand: ['items.data.price.product'],
  });
  const snapshot = extractStripeSubscriptionSnapshot(updatedSubscription);
  await syncCoproAddonsFromSnapshot(copro.id, snapshot);

  return {
    ok: true,
    message: resumeWithoutProration
      ? 'L’option restera active au-delà de l’échéance en cours.'
      : 'L’option a bien été activée avec prorata sur la période restante.',
    currentPeriodEnd: snapshot.currentPeriodEnd,
  };
}

export async function disableCoproAddonAtPeriodEnd(coproprieteId: string, syndicId: string, addonKey: CoproAddonKey): Promise<CoproAddonMutationResult> {
  const context = await loadAddonContext(coproprieteId, syndicId, addonKey);
  if (!context.ok) return context;

  const { admin, copro, addonPriceId, subscription, existingAddon } = context;
  const existingItem = findAddonItem(subscription, addonKey, addonPriceId);
  const snapshotBefore = extractStripeSubscriptionSnapshot(subscription);

  if (!existingItem) {
    if (existingAddon?.cancel_at_period_end && hasFuturePeriodEnd(existingAddon.current_period_end)) {
      return {
        ok: true,
        message: 'La résiliation de l’option est déjà programmée à la prochaine échéance.',
        currentPeriodEnd: existingAddon.current_period_end ?? snapshotBefore.currentPeriodEnd,
        alreadyApplied: true,
      };
    }

    return { ok: false, status: 409, error: 'Cette option n’est pas active pour cette copropriété.' };
  }

  await stripe.subscriptionItems.del(existingItem.id, {
    proration_behavior: 'none',
  });

  await admin
    .from('copro_addons')
    .upsert({
      copropriete_id: copro.id,
      addon_key: addonKey,
      status: 'canceled',
      stripe_subscription_id: subscription.id,
      stripe_subscription_item_id: existingItem.id,
      stripe_price_id: typeof existingItem.price === 'string' ? existingItem.price : existingItem.price?.id ?? addonPriceId,
      current_period_end: snapshotBefore.currentPeriodEnd,
      cancel_at_period_end: true,
    }, { onConflict: 'copropriete_id,addon_key' });

  const updatedSubscription = await stripe.subscriptions.retrieve(subscription.id, {
    expand: ['items.data.price.product'],
  });
  const snapshot = extractStripeSubscriptionSnapshot(updatedSubscription);
  await syncCoproAddonsFromSnapshot(copro.id, snapshot);

  return {
    ok: true,
    message: 'L’option restera active jusqu’à la prochaine échéance, puis ne sera pas renouvelée.',
    currentPeriodEnd: snapshotBefore.currentPeriodEnd,
  };
}
