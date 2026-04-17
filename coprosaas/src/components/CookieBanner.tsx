'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CONSENT_KEY, denyConsent, grantConsent, updateConsent, type ConsentPreferences } from '@/lib/gtag';
// CNIL : le consentement doit être renouvelé tous les 13 mois maximum
const CONSENT_MAX_AGE_MS = 13 * 30 * 24 * 60 * 60 * 1000;

type StoredConsent = {
  value: 'accepted' | 'refused' | 'customized';
  timestamp: number;
  preferences?: ConsentPreferences;
};

const DEFAULT_PREFERENCES: ConsentPreferences = {
  analytics: false,
  ads: false,
};

function getStoredConsent(): StoredConsent | null {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    // Compatibilité avec l'ancien format (chaîne simple)
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

function saveConsent(value: StoredConsent['value'], preferences?: ConsentPreferences) {
  localStorage.setItem(CONSENT_KEY, JSON.stringify({ value, preferences, timestamp: Date.now() }));
}

function applyStoredConsent(stored: StoredConsent) {
  if (stored.value === 'accepted') {
    grantConsent();
    return;
  }

  if (stored.value === 'refused') {
    denyConsent();
    return;
  }

  updateConsent(stored.preferences ?? { analytics: false, ads: false });
}

export default function CookieBanner() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [preferences, setPreferences] = useState<ConsentPreferences>(DEFAULT_PREFERENCES);
  const isPrivacyPolicyPage = pathname === '/politique-confidentialite';

  useEffect(() => {
    const stored = getStoredConsent();
    if (!stored) {
      setVisible(true);
      setIsReady(true);
      return;
    }

    const expired = Date.now() - stored.timestamp > CONSENT_MAX_AGE_MS;
    if (expired) {
      localStorage.removeItem(CONSENT_KEY);
      setVisible(true);
      setIsReady(true);
      return;
    }

    setVisible(false);
    setIsReady(true);
  }, []);

  useEffect(() => {
    const stored = getStoredConsent();
    if (!stored) return;

    const expired = Date.now() - stored.timestamp > CONSENT_MAX_AGE_MS;
    if (expired) {
      localStorage.removeItem(CONSENT_KEY);
      return;
    }

    applyStoredConsent(stored);
  }, []);

  useEffect(() => {
    if (!visible || isPrivacyPolicyPage) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isPrivacyPolicyPage, visible]);

  // Permettre la réouverture depuis le footer (exigence CNIL : retrait aussi facile que l'octroi)
  useEffect(() => {
    function handleShow() {
      const stored = getStoredConsent();
      setPreferences(stored?.preferences ?? DEFAULT_PREFERENCES);
      setShowCustom(Boolean(stored && stored.value === 'customized'));
      setVisible(true);
    }
    window.addEventListener('show-cookie-banner', handleShow);
    return () => window.removeEventListener('show-cookie-banner', handleShow);
  }, []);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('msb-cookie-banner-visibility', { detail: { visible } }));
    return () => {
      window.dispatchEvent(new CustomEvent('msb-cookie-banner-visibility', { detail: { visible: false } }));
    };
  }, [visible]);

  function accept() {
    saveConsent('accepted', { analytics: true, ads: true });
    grantConsent();
    setVisible(false);
  }

  function refuse() {
    saveConsent('refused', { analytics: false, ads: false });
    denyConsent();
    setVisible(false);
  }

  function saveCustomPreferences() {
    saveConsent('customized', preferences);
    updateConsent(preferences);
    setVisible(false);
  }

  function togglePreference(key: keyof ConsentPreferences) {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  if (!isReady || !visible) return null;

  return (
    <div className={isPrivacyPolicyPage
      ? 'fixed inset-x-0 bottom-0 z-50 px-2.5 pb-[calc(env(safe-area-inset-bottom)+var(--msb-mobile-bottom-offset,0px)+0.6rem)] sm:px-4 sm:pb-4'
      : 'fixed inset-0 z-50 flex items-end justify-center bg-slate-950/55 p-2 pt-4 backdrop-blur-sm sm:items-center sm:p-3.5'}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Préférences cookies"
        className={isPrivacyPolicyPage
          ? 'mx-auto w-full max-w-[44rem] overflow-hidden overflow-y-auto overscroll-contain rounded-[1.1rem] border border-slate-200 bg-white shadow-2xl sm:rounded-[1.6rem] max-h-[calc(100svh-0.75rem)]'
          : 'w-full max-w-[44rem] overflow-hidden overflow-y-auto overscroll-contain rounded-[1.1rem] border border-slate-200 bg-white shadow-2xl sm:rounded-[1.6rem] max-h-[calc(100svh-0.75rem)]'}
      >
        <div className="border-b border-slate-100 bg-[linear-gradient(135deg,#f8fafc_0%,#eef6ff_55%,#fff7ed_100%)] px-4 py-3.5 sm:px-7 sm:py-5">
          <div className="mb-2 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-medium text-emerald-700 sm:text-[11px]">
            {isPrivacyPolicyPage ? 'Vous pouvez lire cette page avant de choisir' : 'Choisissez vos préférences'}
          </div>
          <h2 className="text-base font-semibold leading-tight text-slate-950 sm:text-[1.35rem]">Aidez-nous à améliorer Mon Syndic Bénévole</h2>
          <p className="mt-2 text-[13px] leading-5 text-slate-600 sm:text-sm sm:leading-5">
            Les cookies nécessaires assurent la sécurité et le bon fonctionnement du site. Si vous l&apos;acceptez, la mesure d&apos;audience nous aide aussi à comprendre ce qui vous est vraiment utile, à simplifier les parcours et à améliorer plus vite la plateforme.
          </p>
        </div>

        <div className="px-4 py-3.5 sm:px-7 sm:py-4.5">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:p-3.5">
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">Cookies nécessaires</p>
                <p className="mt-1 text-[13px] leading-5 text-slate-600 sm:text-sm sm:leading-5">
                  Connexion, sécurité et bon fonctionnement du site.
                </p>
              </div>
              <span className="self-start rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-white sm:self-auto">Toujours actifs</span>
            </div>
          </div>

          {showCustom && (
            <div className="mt-3.5 space-y-2.5">
              <div className={`rounded-xl border p-3 sm:p-3.5 ${preferences.analytics ? 'border-blue-200 bg-blue-50/60' : 'border-slate-200 bg-slate-50'}`}>
                <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">Mesure d&apos;audience</p>
                    <p className="mt-1 text-[13px] leading-5 text-slate-600 sm:text-sm sm:leading-5">
                      Pour comprendre les pages utiles et les parcours à améliorer.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => togglePreference('analytics')}
                    aria-pressed={preferences.analytics}
                    className={`relative h-7 w-12 shrink-0 self-start rounded-full transition-colors duration-200 ease-in-out sm:self-center ${preferences.analytics ? 'bg-blue-600' : 'bg-slate-300'}`}
                  >
                    <span
                      className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all duration-200 ease-in-out ${preferences.analytics ? 'left-6' : 'left-1'}`}
                    />
                  </button>
                </div>
              </div>

              <div className={`rounded-xl border p-3 sm:p-3.5 ${preferences.ads ? 'border-amber-200 bg-amber-50/70' : 'border-slate-200 bg-slate-50'}`}>
                <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">Personnalisation et mesure publicitaire</p>
                    <p className="mt-1 text-[13px] leading-5 text-slate-600 sm:text-sm sm:leading-5">
                      Pour mesurer l&apos;efficacité des campagnes et limiter les messages moins utiles.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => togglePreference('ads')}
                    aria-pressed={preferences.ads}
                    className={`relative h-7 w-12 shrink-0 self-start rounded-full transition-colors duration-200 ease-in-out sm:self-center ${preferences.ads ? 'bg-amber-500' : 'bg-slate-300'}`}
                  >
                    <span
                      className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all duration-200 ease-in-out ${preferences.ads ? 'left-6' : 'left-1'}`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {!showCustom && (
            <button
              type="button"
              onClick={() => setShowCustom(true)}
              className="mt-3.5 text-sm font-medium text-slate-700 underline underline-offset-4 hover:text-slate-950"
            >
              Personnaliser mes choix
            </button>
          )}

          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3 text-[13px] leading-5 text-slate-600 sm:p-3.5 sm:text-sm sm:leading-5">
            Les cookies optionnels ne s&apos;activent qu&apos;avec votre accord. Détails dans la{' '}
            <Link
              href="/politique-confidentialite"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-slate-900 underline underline-offset-4 hover:text-blue-700"
            >
              politique de confidentialité
            </Link>
            .
          </div>

          <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
            {/* Accept — full-width prominent on mobile, rightmost on desktop */}
            <button
              type="button"
              onClick={accept}
              className="sm:order-2 w-full rounded-xl bg-slate-950 px-4.5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-950/20 transition hover:bg-blue-700 sm:w-auto"
            >
              Oui, j&apos;accepte
            </button>
            {/* Secondary — 2-column grid on mobile, inline row on desktop */}
            <div className="grid grid-cols-2 gap-2 sm:order-1 sm:flex sm:flex-row sm:gap-2.5">
              <button
                type="button"
                onClick={refuse}
                className="rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                <span className="sm:hidden">Refuser</span>
                <span className="hidden sm:inline">Refuser les cookies optionnels</span>
              </button>
              <button
                type="button"
                onClick={showCustom ? saveCustomPreferences : () => setShowCustom(true)}
                className="rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-100"
              >
                {showCustom ? (
                  <>
                    <span className="sm:hidden">Valider</span>
                    <span className="hidden sm:inline">Valider ma personnalisation</span>
                  </>
                ) : 'Personnaliser'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
