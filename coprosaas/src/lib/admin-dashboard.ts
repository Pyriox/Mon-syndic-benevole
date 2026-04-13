import { hasAddonAccess, type CoproAddon } from '@/lib/subscription';

export const ADMIN_MRR_PRICES: Record<string, number> = { essentiel: 30, confort: 45, illimite: 80 };
export const ADMIN_ARR_PRICES: Record<string, number> = { essentiel: 360, confort: 540, illimite: 960 };
export const ADMIN_ADDON_MRR_PRICES: Record<string, number> = { charges_speciales: 8.25 };
export const ADMIN_ADDON_ARR_PRICES: Record<string, number> = { charges_speciales: 99 };

export type AdminStripeInvoiceLike = {
  id: string;
  amount_paid: number;
  created: number;
  billingReason: string | null;
  customerId: string | null;
  subscriptionId?: string | null;
};

export function summarizeStripeBilling(invoices: AdminStripeInvoiceLike[], year: number) {
  const startOfYearTs = new Date(year, 0, 1).getTime() / 1000;
  const paidInvoices = invoices
    .filter((invoice) => invoice.created >= startOfYearTs && invoice.amount_paid > 0)
    .sort((a, b) => a.created - b.created);

  const firstPaidInvoiceBySubscription = new Map<string, string>();

  for (const invoice of paidInvoices) {
    const key = invoice.subscriptionId ?? invoice.customerId ?? invoice.id;
    if (!firstPaidInvoiceBySubscription.has(key)) {
      firstPaidInvoiceBySubscription.set(key, invoice.id);
    }
  }

  let renewalCount = 0;
  let renewalCash = 0;
  let newSubscriptionCount = 0;
  let newSubscriptionCash = 0;

  for (const invoice of paidInvoices) {
    const key = invoice.subscriptionId ?? invoice.customerId ?? invoice.id;
    const isFirstPaidInvoice = firstPaidInvoiceBySubscription.get(key) === invoice.id;
    const isNewSubscription = invoice.billingReason === 'subscription_create'
      || (invoice.billingReason === 'subscription_cycle' && isFirstPaidInvoice);
    const isRenewal = invoice.billingReason === 'subscription_cycle' && !isFirstPaidInvoice;

    if (isNewSubscription) {
      newSubscriptionCount += 1;
      newSubscriptionCash += invoice.amount_paid;
    }

    if (isRenewal) {
      renewalCount += 1;
      renewalCash += invoice.amount_paid;
    }
  }

  return {
    renewalCount,
    renewalCash,
    newSubscriptionCount,
    newSubscriptionCash,
  };
}

export function countActiveAddonCopros(
  addons: Array<Partial<CoproAddon> | null | undefined>,
  nowIso: string = new Date().toISOString(),
): number {
  const coproIds = new Set<string>();

  for (const addon of addons) {
    if (!addon || addon.addon_key !== 'charges_speciales' || !addon.copropriete_id) continue;
    if (!hasAddonAccess(addon, nowIso)) continue;
    coproIds.add(addon.copropriete_id);
  }

  return coproIds.size;
}

export function buildEstimatedRevenueMetrics(
  planBreakdown: Record<string, number>,
  addons: Array<Partial<CoproAddon> | null | undefined>,
  nowIso: string = new Date().toISOString(),
) {
  const baseMrr = Object.entries(planBreakdown).reduce((sum, [planId, count]) => sum + (ADMIN_MRR_PRICES[planId] ?? 0) * count, 0);
  const baseArr = Object.entries(planBreakdown).reduce((sum, [planId, count]) => sum + (ADMIN_ARR_PRICES[planId] ?? 0) * count, 0);

  const addonCounts: Record<string, number> = {};
  const seenAddonKeys = new Set<string>();

  for (const addon of addons) {
    if (!addon?.addon_key || !addon.copropriete_id) continue;
    if (!hasAddonAccess(addon, nowIso)) continue;

    const dedupeKey = `${addon.copropriete_id}:${addon.addon_key}`;
    if (seenAddonKeys.has(dedupeKey)) continue;
    seenAddonKeys.add(dedupeKey);

    addonCounts[addon.addon_key] = (addonCounts[addon.addon_key] ?? 0) + 1;
  }

  const addonMrr = Object.entries(addonCounts).reduce((sum, [addonKey, count]) => sum + (ADMIN_ADDON_MRR_PRICES[addonKey] ?? 0) * count, 0);
  const addonArr = Object.entries(addonCounts).reduce((sum, [addonKey, count]) => sum + (ADMIN_ADDON_ARR_PRICES[addonKey] ?? 0) * count, 0);

  return {
    baseMrr,
    baseArr,
    addonMrr,
    addonArr,
    totalMrr: baseMrr + addonMrr,
    totalArr: baseArr + addonArr,
    addonCounts,
  };
}
