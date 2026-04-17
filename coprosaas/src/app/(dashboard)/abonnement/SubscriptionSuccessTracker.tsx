'use client';

import { useEffect } from 'react';
import { shouldTrackPurchaseEvent, trackEvent } from '@/lib/gtag';

// Prix annuels réels (synchronisés avec PLANS dans abonnement/page.tsx)
export const PLAN_ANNUAL_PRICES: Record<string, number> = {
  essentiel: 360,
  confort:   540,
  illimite:  960,
};

interface Props {
  planId: string | null | undefined;
  subscriptionId: string | null | undefined;
  coproNom: string | null | undefined;
  amount?: number | null; // montant passé par le parent (prioritaire)
}

export default function SubscriptionSuccessTracker({ planId, subscriptionId, coproNom, amount }: Props) {
  useEffect(() => {
    if (!shouldTrackPurchaseEvent()) return;

    // Priorité : montant passé explicitement par le parent, sinon lookup par planId
    const price = amount ?? PLAN_ANNUAL_PRICES[planId ?? ''] ?? 0;
    trackEvent('purchase', {
      transaction_id: subscriptionId ?? 'unknown',
      value: price,
      currency: 'EUR',
      items: [
        {
          item_id: planId ?? 'unknown',
          item_name: `Abonnement ${planId ?? ''}`,
          price,
          quantity: 1,
        },
      ],
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
