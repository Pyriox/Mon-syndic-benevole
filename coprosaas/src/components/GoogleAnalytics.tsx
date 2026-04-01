// ============================================================
// Composant client — track les navigations App Router dans GA4
// useSearchParams() nécessite Suspense (App Router)
// ============================================================
'use client';

import { useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { GA_ID, pageview, trackAnonymousEvent } from '@/lib/gtag';

const GA_DEBUG_PARAM = 'ga_debug';
const GA_DEBUG_STORAGE_KEY = 'ga_debug';

function isGaDebugEnabled(searchParams: ReadonlyURLSearchParams): boolean {
  if (searchParams.get(GA_DEBUG_PARAM) === '1') {
    return true;
  }

  if (typeof window === 'undefined') {
    return false;
  }

  return window.localStorage.getItem(GA_DEBUG_STORAGE_KEY) === '1';
}

function logGaDebug(message: string, details?: Record<string, unknown>) {
  console.info('[ga-debug]', message, details ?? {});
}

function TrackPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Ne pas tracker les pages admin
    if (pathname.startsWith('/admin')) return;

    const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
    const debugEnabled = isGaDebugEnabled(searchParams);

    if (searchParams.get(GA_DEBUG_PARAM) === '1') {
      window.localStorage.setItem(GA_DEBUG_STORAGE_KEY, '1');
    }

    if (debugEnabled) {
      const gtagScript = document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${GA_ID}"]`);

      logGaDebug('pageview start', {
        gaId: GA_ID,
        url,
        hasGtagFunction: typeof window.gtag === 'function',
        hasDataLayer: Array.isArray(window.dataLayer),
        dataLayerLength: Array.isArray(window.dataLayer) ? window.dataLayer.length : null,
        hasGtagScript: Boolean(gtagScript),
        consent: window.localStorage.getItem('cookie_consent'),
      });
    }
    
    // Tracker la page view
    pageview(url);
    
    // AUSSI envoyer de manière anonyme pour capturer même les visiteurs qui refusent les cookies
    // (légal CNIL: anonymize_ip = true, pas d'ID utilisateur)
    trackAnonymousEvent('page_view', {
      page_path: url,
      ...(debugEnabled ? { debug_mode: true } : {}),
    });

    const timeoutId = window.setTimeout(() => {
      const hasGtagFunction = typeof window.gtag === 'function';

      if (debugEnabled) {
        logGaDebug('post-load check', {
          gaId: GA_ID,
          url,
          hasGtagFunction,
          hasDataLayer: Array.isArray(window.dataLayer),
          dataLayerLength: Array.isArray(window.dataLayer) ? window.dataLayer.length : null,
        });
      }

      if (!hasGtagFunction) {
        console.warn(
          '[ga-debug] gtag indisponible apres chargement. Cause probable: bloqueur publicitaire, protection navigateur ou script tiers.',
        );
        return;
      }

      if (debugEnabled) {
        window.gtag('event', 'ga_debug_ping', {
          page_path: url,
          debug_mode: true,
          transport_type: 'beacon',
        });

        logGaDebug('debug ping sent', {
          gaId: GA_ID,
          url,
        });
      }
    }, 1500);

    return () => {
      window.clearTimeout(timeoutId);
    };
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
