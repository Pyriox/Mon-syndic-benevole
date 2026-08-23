'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
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
  if (stored.value === 'accepted') { grantConsent(); return; }
  if (stored.value === 'refused') { denyConsent(); return; }
  updateConsent(stored.preferences ?? { analytics: false, ads: false });
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [preferences, setPreferences] = useState<ConsentPreferences>(DEFAULT_PREFERENCES);
  const customizeBtnRef = useRef<HTMLButtonElement>(null);
  const firstToggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const stored = getStoredConsent();
    if (!stored) { setVisible(true); setIsReady(true); return; }
    const expired = Date.now() - stored.timestamp > CONSENT_MAX_AGE_MS;
    if (expired) { localStorage.removeItem(CONSENT_KEY); setVisible(true); setIsReady(true); return; }
    setVisible(false);
    setIsReady(true);
  }, []);

  useEffect(() => {
    const stored = getStoredConsent();
    if (!stored) return;
    const expired = Date.now() - stored.timestamp > CONSENT_MAX_AGE_MS;
    if (expired) { localStorage.removeItem(CONSENT_KEY); return; }
    applyStoredConsent(stored);
  }, []);

  // Réouverture depuis le footer (CNIL : retrait aussi facile que l'octroi)
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

  // Déplace le focus vers le panneau quand il s'ouvre
  useEffect(() => {
    if (showCustom) firstToggleRef.current?.focus();
  }, [showCustom]);

  // Escape ferme le panneau de préférences
  useEffect(() => {
    if (!showCustom) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') { setShowCustom(false); customizeBtnRef.current?.focus(); }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [showCustom]);

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
    // Bandeau bas — ne bloque pas le scroll, pas d'overlay
    <div className="fixed inset-x-0 bottom-0 z-50 pb-[env(safe-area-inset-bottom)]">

      {/* ── Centre de préférences (niveau 2) ──────────────────────────────── */}
      {showCustom && (
        <div
          id="cookie-pref-panel"
          role="region"
          aria-label="Centre de préférences cookies"
          className="max-h-[60vh] overflow-y-auto overscroll-contain border-t border-white/10 bg-[#0c1525] px-4 py-5 sm:px-8"
        >
          <div className="mx-auto max-w-3xl">
            <h3 className="mb-1 text-sm font-semibold text-white">Centre de préférences</h3>
            <p className="mb-4 text-xs text-slate-400">Gérez les cookies utilisés sur Mon Syndic Bénévole.</p>

            <div className="space-y-2.5">
              {/* Cookies nécessaires */}
              <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[13px] font-semibold text-white">Cookies nécessaires</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-400">
                      Connexion sécurisée, sessions et bon fonctionnement du site. Ces cookies sont indispensables et ne peuvent pas être désactivés.
                    </p>
                  </div>
                  <span className="mt-0.5 shrink-0 rounded-full bg-slate-700/60 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-300">
                    Toujours actifs
                  </span>
                </div>
              </div>

              {/* Mesure d'audience */}
              <div className={`rounded-xl border px-4 py-3.5 transition-colors duration-150 ${preferences.analytics ? 'border-blue-500/30 bg-blue-500/[0.07]' : 'border-white/10 bg-white/[0.04]'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-white">Mesure d&apos;audience</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-400">
                      Google Analytics pour comprendre quelles pages sont les plus utiles et améliorer votre expérience. Aucune donnée partagée à des fins publicitaires.
                    </p>
                  </div>
                  <button
                    ref={firstToggleRef}
                    type="button"
                    role="switch"
                    onClick={() => togglePreference('analytics')}
                    aria-checked={preferences.analytics}
                    className={`relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 ${preferences.analytics ? 'bg-blue-500' : 'bg-slate-600'}`}
                  >
                    <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all duration-200 ${preferences.analytics ? 'left-6' : 'left-1'}`} />
                    <span className="sr-only">{preferences.analytics ? 'Désactiver' : 'Activer'} la mesure d&apos;audience</span>
                  </button>
                </div>
              </div>

              {/* Personnalisation publicitaire */}
              <div className={`rounded-xl border px-4 py-3.5 transition-colors duration-150 ${preferences.ads ? 'border-amber-500/30 bg-amber-500/[0.07]' : 'border-white/10 bg-white/[0.04]'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-white">Personnalisation publicitaire</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-400">
                      Ces cookies mesurent l&apos;efficacité de nos campagnes Google Ads et permettent de vous montrer des annonces plus pertinentes.
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    onClick={() => togglePreference('ads')}
                    aria-checked={preferences.ads}
                    className={`relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 ${preferences.ads ? 'bg-amber-500' : 'bg-slate-600'}`}
                  >
                    <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all duration-200 ${preferences.ads ? 'left-6' : 'left-1'}`} />
                    <span className="sr-only">{preferences.ads ? 'Désactiver' : 'Activer'} la personnalisation publicitaire</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={saveCustomPreferences}
                className="rounded-lg bg-blue-500 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
              >
                Enregistrer mes choix
              </button>
              <button
                type="button"
                onClick={() => { setShowCustom(false); customizeBtnRef.current?.focus(); }}
                className="text-xs text-slate-400 underline underline-offset-2 hover:text-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bandeau principal (niveau 1) ───────────────────────────────────── */}
      <div
        role="dialog"
        aria-modal="false"
        aria-label="Consentement aux cookies"
        aria-controls="cookie-pref-panel"
        aria-expanded={showCustom}
        className="border-t border-white/10 bg-[#0c1525]/95 px-4 py-3.5 shadow-[0_-4px_32px_rgba(0,0,0,0.5)] backdrop-blur-md sm:px-8"
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:gap-8">

          {/* Texte */}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white">Vos préférences cookies</p>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-400">
              Cookies nécessaires au fonctionnement + mesure d&apos;audience et publicité avec votre accord.{' '}
              <Link
                href="/politique-confidentialite"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-300 underline underline-offset-2 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
              >
                Politique de confidentialité
              </Link>
            </p>
          </div>

          {/* Boutons — même taille et poids visuel pour Refuser/Accepter (CNIL 2026) */}
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
            {/*
              Mobile : grille 2 colonnes pour Refuser | Accepter (poids égal),
              Personnaliser pleine largeur en dessous.
              Desktop : sm:contents efface le wrapper → 3 boutons frères dans le flex parent,
              réordonnés via sm:order-*.
            */}
            <div className="grid grid-cols-2 gap-2 sm:contents">
              <button
                type="button"
                onClick={refuse}
                className="rounded-lg border border-slate-600/70 px-4 py-2 text-sm font-semibold text-slate-200 transition-colors hover:border-slate-500 hover:bg-slate-700/50 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 sm:order-1"
              >
                Tout refuser
              </button>
              <button
                type="button"
                onClick={accept}
                className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 sm:order-3"
              >
                Tout accepter
              </button>
            </div>
            <button
              ref={customizeBtnRef}
              type="button"
              onClick={() => setShowCustom((v) => !v)}
              aria-expanded={showCustom}
              aria-controls="cookie-pref-panel"
              className="rounded-lg border border-slate-600/50 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:border-slate-500 hover:bg-slate-700/40 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 sm:order-2"
            >
              Personnaliser
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
