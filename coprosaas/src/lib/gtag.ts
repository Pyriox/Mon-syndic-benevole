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

export interface ConsentPreferences {
  analytics: boolean;
  ads: boolean;
}

/** Envoie une page_view à GA4 (navigation client-side) */
export function pageview(url: string) {
  if (!GA_ID || typeof window === 'undefined' || !window.gtag) return;
  window.gtag('config', GA_ID, { page_location: window.location.origin + url });
}

/** Envoie un event personnalisé à GA4 */
export function trackEvent(action: string, params?: Record<string, unknown>) {
  if (!GA_ID || typeof window === 'undefined' || !window.gtag) return;
  window.gtag('event', action, params);
}

/**
 * Envoie un événement à GA4 avec anonymize_ip: true.
 * Utilisé pour : dashboard views, onboarding — pas d'identifiant utilisateur persistant.
 * Consent Mode v2 reste actif : les hits respectent analytics_storage.
 */
export function trackAnonymousEvent(action: string, params?: Record<string, unknown>) {
  if (!GA_ID || typeof window === 'undefined' || !window.gtag) return;
  // Envoyer l'événement avec anonymize_ip: true pour conformité CNIL
  window.gtag('event', action, {
    ...params,
    anonymize_ip: true,
  });
}

export function updateConsent(preferences: ConsentPreferences) {
  if (typeof window === 'undefined' || !window.gtag) return;

  const adsGranted = preferences.ads ? 'granted' : 'denied';
  window.gtag('consent', 'update', {
    analytics_storage: preferences.analytics ? 'granted' : 'denied',
    ad_storage: adsGranted,
    ad_user_data: adsGranted,
    ad_personalization: adsGranted,
  });
}

/** Accorde le consentement analytics + publicitaire — Consent Mode v2 (appelé quand l'utilisateur accepte) */
export function grantConsent() {
  updateConsent({ analytics: true, ads: true });
}

/** Refuse le consentement analytics — Consent Mode v2 (appelé quand l'utilisateur refuse) */
export function denyConsent() {
  updateConsent({ analytics: false, ads: false });
}
