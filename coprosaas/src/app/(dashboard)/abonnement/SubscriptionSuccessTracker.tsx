'use client';

// Déclenche la conversion Google Ads "purchase" via GTM (dataLayer).
// Le label de conversion et l'ID tag Ads vivent entièrement dans GTM —
// aucune variable d'environnement nécessaire côté app.
// La conversion GA4 `purchase` reste envoyée côté serveur via Measurement Protocol.
import { useEffect, useRef } from 'react';

const PLAN_PRICES: Record<string, number> = {
  essentiel: 360,
  confort: 540,
  illimite: 960,
};

interface Props {
  planId?: string | null;
}

export default function SubscriptionSuccessTracker({ planId }: Props) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;

    if (typeof window === 'undefined') return;

    const value = planId ? (PLAN_PRICES[planId] ?? 0) : 0;

    // Push dans le dataLayer — GTM + Consent Mode v2 gèrent la conversion Ads.
    // Si ad_storage est refusé, Google Ads utilisera la modélisation de conversion.
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'purchase_subscription',
      value,
      currency: 'EUR',
      plan_id: planId ?? 'unknown',
    });
  }, [planId]);

  return null;
}
