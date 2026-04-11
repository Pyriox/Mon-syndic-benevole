import { describe, expect, it } from 'vitest';

import { countActiveAddonCopros, summarizeStripeBilling } from '../admin-dashboard';

describe('summarizeStripeBilling', () => {
  it('exclut la première facture payée après essai des renouvellements', () => {
    const metrics = summarizeStripeBilling([
      {
        id: 'inv-trial-conversion',
        amount_paid: 300,
        created: Date.UTC(2026, 0, 15) / 1000,
        billingReason: 'subscription_cycle',
        customerId: 'cus-1',
        subscriptionId: 'sub-1',
      },
      {
        id: 'inv-renewal',
        amount_paid: 300,
        created: Date.UTC(2026, 1, 15) / 1000,
        billingReason: 'subscription_cycle',
        customerId: 'cus-1',
        subscriptionId: 'sub-1',
      },
      {
        id: 'inv-new-sub',
        amount_paid: 399,
        created: Date.UTC(2026, 2, 10) / 1000,
        billingReason: 'subscription_create',
        customerId: 'cus-2',
        subscriptionId: 'sub-2',
      },
    ], 2026);

    expect(metrics.newSubscriptionCount).toBe(2);
    expect(metrics.newSubscriptionCash).toBe(699);
    expect(metrics.renewalCount).toBe(1);
    expect(metrics.renewalCash).toBe(300);
  });
});

describe('countActiveAddonCopros', () => {
  it('compte les copropriétés ayant une option Charges spéciales réellement active', () => {
    const count = countActiveAddonCopros([
      { copropriete_id: 'copro-1', addon_key: 'charges_speciales', status: 'active' },
      { copropriete_id: 'copro-2', addon_key: 'charges_speciales', status: 'trialing' },
      { copropriete_id: 'copro-3', addon_key: 'charges_speciales', status: 'past_due' },
      { copropriete_id: 'copro-4', addon_key: 'charges_speciales', status: 'canceled', cancel_at_period_end: true, current_period_end: '2026-12-31T00:00:00.000Z' },
      { copropriete_id: 'copro-5', addon_key: 'charges_speciales', status: 'canceled', cancel_at_period_end: true, current_period_end: '2026-01-01T00:00:00.000Z' },
      { copropriete_id: 'copro-6', addon_key: 'autre_option', status: 'active' },
      { copropriete_id: 'copro-1', addon_key: 'charges_speciales', status: 'active' },
    ], '2026-04-11T00:00:00.000Z');

    expect(count).toBe(4);
  });
});
