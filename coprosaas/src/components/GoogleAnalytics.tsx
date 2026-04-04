// ============================================================
// Composant client — track les navigations App Router dans GA4
// useSearchParams() nécessite Suspense (App Router)
// ============================================================
'use client';

import { useEffect, Suspense, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { pageview } from '@/lib/gtag';

function TrackPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTrackedUrlRef = useRef<string | null>(null);

  useEffect(() => {
    // Ne pas tracker les pages admin
    if (pathname.startsWith('/admin')) return;

    const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
    if (url === lastTrackedUrlRef.current) return;

    lastTrackedUrlRef.current = url;
    pageview(url);
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
