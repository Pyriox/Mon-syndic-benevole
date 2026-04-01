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
    
    // Événement distinct pour éviter de gonfler artificiellement la métrique GA4 "page_view".
    trackAnonymousEvent('page_view_anonymous', { page_path: url });
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
