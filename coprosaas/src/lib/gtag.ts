// ============================================================
// Helpers Google Analytics 4 / Google Tag Manager + Consent Mode v2
// ============================================================

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? '';
export const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID ?? '';
export const CONSENT_KEY = 'cookie_consent';

const GOOGLE_COOKIE_HINTS = ['_ga', '_gid', '_gat', '_gac', '_gcl'];

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: Record<string, unknown>[];
    __msbLastPageview?: {
      key: string;
      timestamp: number;
    };
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

export function shouldTrackPurchaseEvent(): boolean {
  return hasAnalyticsConsent();
}

function getMeasurementMode() {
  return hasAnalyticsConsent() ? 'consented' : 'cookieless';
}

function pushToDataLayer(payload: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(payload);
}

function sanitizeAnonymousParams(params?: Record<string, unknown>) {
  if (!params) return {};

  const sanitized: Record<string, string | number | boolean> = {};

  for (const [key, value] of Object.entries(params)) {
    if (value == null) continue;
    if (/email|mail|user_?id|transaction|subscription|subject|phone|token|address|full_?name|first_?name|last_?name|nom|prenom/i.test(key)) continue;

    if (typeof value === 'string') {
      sanitized[key] = value.slice(0, 120);
      continue;
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

function sanitizeUrlForAnalytics(url: string) {
  if (typeof window === 'undefined') return url;

  try {
    const parsed = new URL(url, window.location.origin);
    const sensitiveKeys = ['token', 'token_hash', 'code', 'email', 'next', 'access_token', 'refresh_token', 'password', 'redirectTo'];

    for (const key of sensitiveKeys) {
      parsed.searchParams.delete(key);
    }

    if (parsed.pathname.startsWith('/auth/confirm')) {
      for (const key of Array.from(parsed.searchParams.keys())) {
        if (key !== 'type') {
          parsed.searchParams.delete(key);
        }
      }
    }

    const search = parsed.searchParams.toString();
    return `${parsed.pathname}${search ? `?${search}` : ''}`;
  } catch {
    return url.split('?')[0] ?? url;
  }
}

const PAGEVIEW_DEDUPE_WINDOW_MS = 1500;
const INTERNAL_PAGEVIEW_PREFIXES = [
  '/admin',
  '/dashboard',
  '/coproprietes',
  '/coproprietaires',
  '/depenses',
  '/appels-de-fonds',
  '/documents',
  '/assemblees',
  '/incidents',
  '/lots',
  '/profil',
  '/abonnement',
  '/aide',
  '/login',
  '/register',
  '/reset-password',
  '/auth',
] as const;

export function shouldTrackPageviewPath(url: string): boolean {
  try {
    const parsed = new URL(url, typeof window !== 'undefined' ? window.location.origin : 'https://www.mon-syndic-benevole.fr');
    const pathname = parsed.pathname;

    return !INTERNAL_PAGEVIEW_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  } catch {
    return false;
  }
}

function isDuplicatePageview(key: string) {
  if (typeof window === 'undefined') return false;

  const now = Date.now();
  const lastPageview = window.__msbLastPageview;

  if (lastPageview && lastPageview.key === key && now - lastPageview.timestamp < PAGEVIEW_DEDUPE_WINDOW_MS) {
    return true;
  }

  window.__msbLastPageview = { key, timestamp: now };
  return false;
}

export function clearGoogleCookies() {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;

  const existingCookieNames = document.cookie
    .split(';')
    .map((cookie) => cookie.trim().split('=')[0])
    .filter(Boolean);

  const cookieNames = Array.from(new Set([
    ...existingCookieNames.filter((name) => GOOGLE_COOKIE_HINTS.some((prefix) => name.startsWith(prefix))),
    '_ga',
    '_gid',
    '_gat',
    '_gat_gtag',
    '_gcl_au',
    '_gcl_aw',
    '_gcl_dc',
  ]));

  const hostname = window.location.hostname;
  const hostParts = hostname.split('.').filter(Boolean);
  const domains = new Set<string | undefined>([undefined, hostname]);

  for (let index = 0; index < hostParts.length - 1; index += 1) {
    const domain = hostParts.slice(index).join('.');
    domains.add(domain);
    domains.add(`.${domain}`);
  }

  const clearCookie = (name: string, domain?: string, secure = false) => {
    const base = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; path=/; SameSite=Lax`;
    const domainPart = domain ? `; domain=${domain}` : '';
    const securePart = secure ? '; Secure' : '';
    document.cookie = `${base}${domainPart}${securePart}`;
  };

  for (const name of cookieNames) {
    clearCookie(name);
    if (window.location.protocol === 'https:') {
      clearCookie(name, undefined, true);
    }

    for (const domain of domains) {
      if (!domain) continue;
      clearCookie(name, domain);
      if (window.location.protocol === 'https:') {
        clearCookie(name, domain, true);
      }
    }
  }
}

/**
 * Envoie une page_view pilotée par GTM (ou GA4 en fallback si GTM absent).
 * - Avec consentement : mesure standard.
 * - Sans consentement : ping cookieless, sans cookie ni identifiant persistant.
 */
export function pageview(url: string) {
  if (typeof window === 'undefined') return;

  const sanitizedUrl = sanitizeUrlForAnalytics(url);
  if (!shouldTrackPageviewPath(sanitizedUrl)) return;

  const payload = {
    page_location: window.location.origin + sanitizedUrl,
    page_title: document.title.slice(0, 120),
    measurement_mode: getMeasurementMode(),
    consent_state: hasAnalyticsConsent() ? 'granted' : 'denied',
    anonymize_ip: true,
  };
  const dedupeKey = sanitizedUrl;

  if (GTM_ID) {
    if (isDuplicatePageview(dedupeKey)) return;
    pushToDataLayer({ event: 'virtual_pageview', ...payload });
    return;
  }

  if (!GA_ID || !window.gtag) return;
  if (isDuplicatePageview(dedupeKey)) return;
  window.gtag('config', GA_ID, {
    ...payload,
    send_page_view: true,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });
}

/**
 * Envoie un event personnalisé à GTM / GA4.
 * - Avec consentement : payload complet.
 * - Sans consentement : version cookieless, agrégée, sans identifiant persistant.
 */
export function trackEvent(action: string, params?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;

  const payload = hasAnalyticsConsent()
    ? {
        ...params,
        measurement_mode: 'consented',
        consent_state: 'granted',
      }
    : {
        ...sanitizeAnonymousParams(params),
        anonymize_ip: true,
        measurement_mode: 'cookieless',
        consent_state: 'denied',
      };

  if (GTM_ID) {
    pushToDataLayer({ event: action, ...payload });
    return;
  }

  if (!GA_ID || !window.gtag) return;
  window.gtag('event', action, payload);
}

/**
 * Envoie un événement anonyme à GTM / GA4.
 * Utilisé pour : vues dashboard, onboarding, CTA, lecture d'articles,
 * erreurs de parcours — sans email, user_id, transaction_id ni cookie obligatoire.
 */
export function trackAnonymousEvent(action: string, params?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;

  const payload = {
    ...sanitizeAnonymousParams(params),
    anonymize_ip: true,
    measurement_mode: getMeasurementMode(),
    consent_state: hasAnalyticsConsent() ? 'granted' : 'denied',
  };

  if (GTM_ID) {
    pushToDataLayer({ event: action, ...payload });
    return;
  }

  if (!GA_ID || !window.gtag) return;
  window.gtag('event', action, payload);
}

/**
 * Envoie la version standard si le consentement analytics est accordé,
 * sinon la version anonyme pour éviter les doublons d'un même événement métier.
 */
export function trackConsentAwareEvent({
  standardEvent,
  anonymousEvent,
  params,
}: {
  standardEvent: string;
  anonymousEvent: string;
  params?: Record<string, unknown>;
}) {
  if (hasAnalyticsConsent()) {
    trackEvent(standardEvent, params);
    return;
  }

  trackAnonymousEvent(anonymousEvent, params);
}

export function updateConsent(preferences: ConsentPreferences) {
  if (typeof window === 'undefined') return;

  if (window.gtag) {
    const adsGranted = preferences.ads ? 'granted' : 'denied';
    window.gtag('consent', 'update', {
      analytics_storage: preferences.analytics ? 'granted' : 'denied',
      ad_storage: adsGranted,
      ad_user_data: adsGranted,
      ad_personalization: adsGranted,
    });
  }

  if (!preferences.analytics) {
    clearGoogleCookies();
  }
}

/** Accorde le consentement analytics + publicitaire — Consent Mode v2 (appelé quand l'utilisateur accepte) */
export function grantConsent() {
  updateConsent({ analytics: true, ads: true });
}

/** Refuse le consentement analytics — Consent Mode v2 (appelé quand l'utilisateur refuse ou retire son accord) */
export function denyConsent() {
  updateConsent({ analytics: false, ads: false });
}
