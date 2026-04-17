'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { trackAnonymousEvent } from '@/lib/gtag';

interface Props {
  userRole: 'syndic' | 'copropriétaire';
}

/**
 * Composant client injecté dans le layout dashboard.
 * - Trace l'événement onboarding_complete si la page contient ?copro_cree=1.
 */
export default function DashboardTracker({ userRole }: Props) {
  const searchParams = useSearchParams();

  // ── Onboarding complete (première copropriété créée) ──────────────────
  useEffect(() => {
    if (searchParams.get('copro_cree') !== '1') return;

    trackAnonymousEvent('onboarding_complete', {
      role: userRole,
      action: 'first_copropriete_created',
    });

    // Nettoyer le param de l'URL sans rechargement de page
    const url = new URL(window.location.href);
    url.searchParams.delete('copro_cree');
    window.history.replaceState({}, '', url.toString());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
