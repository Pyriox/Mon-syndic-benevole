'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CONSENT_KEY, denyConsent, grantConsent, pageview, updateConsent, type ConsentPreferences } from '@/lib/gtag';
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
  const [visible, setVisible] = useState(() => {
    if (typeof window === 'undefined') return false;

    const stored = getStoredConsent();
    if (!stored) return true;

    const expired = Date.now() - stored.timestamp > CONSENT_MAX_AGE_MS;
    if (expired) {
      localStorage.removeItem(CONSENT_KEY);
      return true;
    }

    return false;
  });
  const [showCustom, setShowCustom] = useState(false);
  const [preferences, setPreferences] = useState<ConsentPreferences>(DEFAULT_PREFERENCES);
  const isPrivacyPolicyPage = pathname === '/politique-confidentialite';

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

  function accept() {
    saveConsent('accepted', { analytics: true, ads: true });
    grantConsent();
    // Sur première visite, aucun nouvel event n'est émis après clic "Accepter"
    // tant qu'il n'y a pas de navigation. On envoie une page_view immédiate.
    if (typeof window !== 'undefined') {
      const url = window.location.pathname + window.location.search;
      pageview(url);
    }
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
    if (preferences.analytics && typeof window !== 'undefined') {
      const url = window.location.pathname + window.location.search;
      pageview(url);
    }
    setVisible(false);
  }

  function togglePreference(key: keyof ConsentPreferences) {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  if (!visible) return null;

  return (
    <div className={isPrivacyPolicyPage
      ? 'fixed inset-x-0 bottom-0 z-50 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] sm:px-4 sm:pb-4'
      : 'fixed inset-0 z-50 flex items-end justify-center bg-slate-950/55 p-2 pt-6 backdrop-blur-sm sm:items-center sm:p-4'}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Préférences cookies"
        className={isPrivacyPolicyPage
          ? 'mx-auto w-full max-w-2xl overflow-hidden overflow-y-auto overscroll-contain rounded-[1.25rem] border border-slate-200 bg-white shadow-2xl sm:rounded-3xl max-h-[calc(100svh-1rem)]'
          : 'w-full max-w-2xl overflow-hidden overflow-y-auto overscroll-contain rounded-[1.25rem] border border-slate-200 bg-white shadow-2xl sm:rounded-3xl max-h-[calc(100svh-1rem)]'}
      >
        <div className="border-b border-slate-100 bg-[linear-gradient(135deg,#f8fafc_0%,#eef6ff_55%,#fff7ed_100%)] px-4 py-4 sm:px-8 sm:py-6">
          <div className="mb-3 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700 sm:text-xs">
            {isPrivacyPolicyPage ? 'Vous pouvez lire cette page avant de choisir' : 'Choisissez vos préférences'}
          </div>
          <h2 className="text-lg font-semibold leading-tight text-slate-950 sm:text-2xl">Aidez-nous à améliorer Mon Syndic Bénévole</h2>
          <p className="mt-3 text-sm leading-5 text-slate-600 sm:leading-6">
            Nous utilisons des cookies strictement nécessaires pour sécuriser votre session, ainsi que des cookies
            optionnels pour mesurer les pages utiles, comprendre les parcours qui bloquent et mieux présenter nos offres.
          </p>
          <p className="mt-3 text-sm leading-5 text-slate-700 sm:leading-6">
            Vous pouvez accepter, refuser ou personnaliser ces cookies. Le refus n&apos;empêche pas l&apos;accès au service,
            hors cookies strictement nécessaires à la connexion et à la sécurité.
          </p>
        </div>

        <div className="px-4 py-4 sm:px-8 sm:py-5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 sm:p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">Cookies nécessaires</p>
                <p className="mt-1 text-sm leading-5 text-slate-600 sm:leading-6">
                  Toujours actifs pour la connexion, la sécurité, la sauvegarde de vos préférences et le bon fonctionnement du site.
                </p>
              </div>
              <span className="self-start rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white sm:self-auto">Toujours actifs</span>
            </div>
          </div>

          {showCustom && (
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-3.5 sm:p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">Mesure d&apos;audience</p>
                    <p className="mt-1 text-sm leading-5 text-slate-600 sm:leading-6">
                      Pour savoir quelles pages sont consultées, quels contenus aident vraiment et où l&apos;expérience mérite d&apos;être simplifiée.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => togglePreference('analytics')}
                    aria-pressed={preferences.analytics}
                    className={`relative h-7 w-12 shrink-0 self-start rounded-full transition-colors sm:self-center ${preferences.analytics ? 'bg-blue-600' : 'bg-slate-300'}`}
                  >
                    <span
                      className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ${preferences.analytics ? 'translate-x-6' : 'translate-x-1'}`}
                    />
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3.5 sm:p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">Personnalisation et mesure publicitaire</p>
                    <p className="mt-1 text-sm leading-5 text-slate-600 sm:leading-6">
                      Pour évaluer les campagnes qui nous apportent des utilisateurs pertinents et éviter de pousser des messages moins utiles.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => togglePreference('ads')}
                    aria-pressed={preferences.ads}
                    className={`relative h-7 w-12 shrink-0 self-start rounded-full transition-colors sm:self-center ${preferences.ads ? 'bg-amber-500' : 'bg-slate-300'}`}
                  >
                    <span
                      className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ${preferences.ads ? 'translate-x-6' : 'translate-x-1'}`}
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
              className="mt-4 text-sm font-medium text-slate-700 underline underline-offset-4 hover:text-slate-950"
            >
              Personnaliser mes choix
            </button>
          )}

          <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-3.5 text-sm leading-5 text-slate-600 sm:p-4 sm:leading-6">
            Les cookies optionnels ne sont activés qu&apos;avec votre accord. Détails complets dans la{' '}
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

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={refuse}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 sm:w-auto"
              >
                Refuser les cookies optionnels
              </button>
              <button
                type="button"
                onClick={showCustom ? saveCustomPreferences : () => setShowCustom(true)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-100 sm:w-auto"
              >
                {showCustom ? 'Valider ma personnalisation' : 'Personnaliser'}
              </button>
            </div>

            <button
              type="button"
              onClick={accept}
              className="w-full rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-950/20 transition hover:bg-blue-700 sm:w-auto"
            >
              Oui, j&apos;accepte
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
