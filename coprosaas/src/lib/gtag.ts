// ============================================================
// Helpers Google Analytics 4
// ============================================================

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? '';
export const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID ?? '';
export const CONSENT_KEY = 'cookie_consent';

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

type StoredConsent = {
  value: 'accepted' | 'refused' | 'customized';
  timestamp: number;
  preferences?: ConsentPreferences;
};

function readStoredConsent(): StoredConsent | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;

    if (raw === 'accepted' || raw === 'refused') {
      return {
        value: raw,
        timestamp: Date.now(),
        preferences: raw === 'accepted'
          ? { analytics: true, ads: true }
          : { analytics: false, ads: false },
      };
    }

    return JSON.parse(raw) as StoredConsent;
  } catch {
    return null;
  }
}

export function getConsentPreferences(): ConsentPreferences {
  const stored = readStoredConsent();
  if (!stored) {
    return { analytics: false, ads: false };
  }

  if (stored.value === 'accepted') {
    return { analytics: true, ads: true };
  }

  if (stored.value === 'refused') {
    return { analytics: false, ads: false };
  }

  return stored.preferences ?? { analytics: false, ads: false };
}

export function hasAnalyticsConsent(): boolean {
  return getConsentPreferences().analytics;
}

function pushToDataLayer(payload: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(payload);
}

/** Envoie une page_view pilotée par GTM (ou GA4 en fallback si GTM absent). */
export function pageview(url: string) {
  if (typeof window === 'undefined' || !hasAnalyticsConsent()) return;

  const payload = {
    page_location: window.location.origin + url,
    page_path: url,
    page_title: document.title,
  };

  if (GTM_ID) {
    pushToDataLayer({ event: 'virtual_pageview', ...payload });
    return;
  }

  if (!GA_ID || !window.gtag) return;
  window.gtag('config', GA_ID, payload);
}

/** Envoie un event personnalisé à GTM / GA4. */
export function trackEvent(action: string, params?: Record<string, unknown>) {
  if (typeof window === 'undefined' || !hasAnalyticsConsent()) return;

  if (GTM_ID) {
    pushToDataLayer({ event: action, ...params });
    return;
  }

  if (!GA_ID || !window.gtag) return;
  window.gtag('event', action, params);
}

/**
 * Envoie un événement anonyme à GTM / GA4.
 * Utilisé pour : dashboard views, onboarding — pas d'identifiant utilisateur persistant.
 */
export function trackAnonymousEvent(action: string, params?: Record<string, unknown>) {
  if (typeof window === 'undefined' || !hasAnalyticsConsent()) return;

  const payload = {
    ...params,
    anonymize_ip: true,
  };

  if (GTM_ID) {
    pushToDataLayer({ event: action, ...payload });
    return;
  }

  if (!GA_ID || !window.gtag) return;
  window.gtag('event', action, payload);
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
