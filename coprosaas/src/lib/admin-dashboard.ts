import { hasAddonAccess, type CoproAddon } from '@/lib/subscription';

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
