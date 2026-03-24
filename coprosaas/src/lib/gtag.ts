// ============================================================
// Helpers Google Analytics 4
// ============================================================

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? '';

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
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

/** Accorde le consentement analytics + publicitaire — Consent Mode v2 (appelé quand l'utilisateur accepte) */
export function grantConsent() {
  if (typeof window === 'undefined' || !window.gtag) return;
  window.gtag('consent', 'update', {
    analytics_storage: 'granted',
    ad_storage: 'granted',
    ad_user_data: 'granted',
    ad_personalization: 'granted',
  });
}

/** Refuse le consentement analytics — Consent Mode v2 (appelé quand l'utilisateur refuse) */
export function denyConsent() {
  if (typeof window === 'undefined' || !window.gtag) return;
  window.gtag('consent', 'update', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  });
}
