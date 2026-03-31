'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { grantConsent, denyConsent, pageview } from '@/lib/gtag';

const CONSENT_KEY = 'cookie_consent';
// CNIL : le consentement doit être renouvelé tous les 13 mois maximum
const CONSENT_MAX_AGE_MS = 13 * 30 * 24 * 60 * 60 * 1000;

function getStoredConsent(): { value: string; timestamp: number } | null {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    // Compatibilité avec l'ancien format (chaîne simple)
    if (raw === 'accepted' || raw === 'refused') {
      return { value: raw, timestamp: Date.now() };
    }
    return JSON.parse(raw) as { value: string; timestamp: number };
  } catch {
    return null;
  }
}

function saveConsent(value: 'accepted' | 'refused') {
  localStorage.setItem(CONSENT_KEY, JSON.stringify({ value, timestamp: Date.now() }));
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = getStoredConsent();
    if (!stored) {
      setVisible(true);
      return;
    }
    // Expiration à 13 mois : on redemande le consentement
    const expired = Date.now() - stored.timestamp > CONSENT_MAX_AGE_MS;
    if (expired) {
      localStorage.removeItem(CONSENT_KEY);
      setVisible(true);
      return;
    }
    if (stored.value === 'accepted') {
      grantConsent();
    }
    // 'refused' → le consentement reste denied par défaut
  }, []);

  function accept() {
    saveConsent('accepted');
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
    saveConsent('refused');
    denyConsent();
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Bandeau cookies"
      className="fixed bottom-0 left-0 right-0 z-50 bg-gray-50 border-t border-gray-300 shadow-sm"
    >
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center gap-2 px-4 py-2 text-xs text-gray-500">
        <p className="flex-1 leading-snug">
          Ce site utilise des cookies analytiques et publicitaires.{' '}
          <Link href="/mentions-legales" className="underline hover:text-gray-700">
            En savoir plus
          </Link>
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={accept}
            className="px-3 py-1 rounded bg-gray-700 text-white text-xs hover:bg-gray-900 transition-colors"
          >
            Accepter
          </button>
          <button
            onClick={refuse}
            className="text-xs text-gray-600 hover:text-gray-800 transition-colors underline"
          >
            Refuser
          </button>
        </div>
      </div>
    </div>
  );
}
