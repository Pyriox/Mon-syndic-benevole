// ============================================================
// Composant client — track les navigations App Router dans GA4
// useSearchParams() nécessite Suspense (App Router)
// ============================================================
'use client';

import { useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { pageview, trackAnonymousEvent } from '@/lib/gtag';

function TrackPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Ne pas tracker les pages admin
    if (pathname.startsWith('/admin')) return;

    const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
    
    // Tracker la page view
    pageview(url);
    
    // AUSSI envoyer de manière anonyme pour capturer même les visiteurs qui refusent les cookies
    // (légal CNIL: anonymize_ip = true, pas d'ID utilisateur)
    trackAnonymousEvent('page_view', { page_path: url });
  }, [pathname, searchParams]);

  return null;
}

export default function GoogleAnalytics() {
  return (
    <Suspense fallback={null}>
      <TrackPageView />
    </Suspense>
  );
}
