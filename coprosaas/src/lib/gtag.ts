// ============================================================
// Helpers Google Analytics 4
// ============================================================

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? '';

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
  }
}

/** Envoie une page_view à GA4 (navigation client-side) */
export function pageview(url: string) {
  if (!GA_ID || typeof window === 'undefined' || !window.gtag) return;
  window.gtag('config', GA_ID, { page_path: url });
}

/** Envoie un event personnalisé à GA4 */
export function trackEvent(action: string, params?: Record<string, unknown>) {
  if (!GA_ID || typeof window === 'undefined' || !window.gtag) return;
  window.gtag('event', action, params);
}
