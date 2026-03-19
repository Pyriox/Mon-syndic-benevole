'use client';

import { useEffect } from 'react';
import { trackEvent } from '@/lib/gtag';

const PLAN_PRICES: Record<string, number> = {
  essentiel: 20,
  confort: 30,
  illimite: 45,
};

interface Props {
  planId: string | null | undefined;
  subscriptionId: string | null | undefined;
  coproNom: string | null | undefined;
}

export default function SubscriptionSuccessTracker({ planId, subscriptionId, coproNom }: Props) {
  useEffect(() => {
    const price = PLAN_PRICES[planId ?? ''] ?? 0;
    trackEvent('purchase', {
      transaction_id: subscriptionId ?? 'unknown',
      value: price,
      currency: 'EUR',
      items: [
        {
          item_id: planId ?? 'unknown',
          item_name: `Abonnement ${planId ?? ''} — ${coproNom ?? ''}`,
          price,
          quantity: 1,
        },
      ],
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
