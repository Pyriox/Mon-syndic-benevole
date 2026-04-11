import { describe, expect, it } from 'vitest';
import { extractStripeSubscriptionSnapshot } from '../stripe';

describe('extractStripeSubscriptionSnapshot', () => {
  it('uses the subscription item current_period_end instead of the billing anchor', () => {
    const snapshot = extractStripeSubscriptionSnapshot({
      id: 'sub_123',
      customer: 'cus_123',
      status: 'active',
      billing_cycle_anchor: 1712707200, // 2024-04-10
      items: {
        data: [
          {
            id: 'si_123',
            current_period_end: 1744243200, // 2025-04-10
            price: {
              id: 'price_essentiel',
              metadata: { plan_id: 'essentiel' },
            },
          },
        ],
      },
    });

    expect(snapshot.currentPeriodEnd).toBe('2025-04-10T00:00:00.000Z');
  });
});
