'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { grantConsent } from '@/lib/gtag';

const CONSENT_KEY = 'cookie_consent';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored === 'accepted') {
      grantConsent();
    } else if (!stored) {
      setVisible(true);
    }
    // 'refused' → on ne fait rien, le consentement reste denied
  }, []);

  function accept() {
    localStorage.setItem(CONSENT_KEY, 'accepted');
    grantConsent();
    setVisible(false);
  }

  function refuse() {
    localStorage.setItem(CONSENT_KEY, 'refused');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Bandeau cookies"
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-md"
    >
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-3 px-4 py-3 text-sm text-gray-600">
        <p className="flex-1 leading-snug">
          Nous utilisons des cookies analytiques (Google Analytics) pour mesurer
          l'audience et améliorer le service.{' '}
          <Link href="/mentions-legales" className="underline hover:text-gray-900">
            En savoir plus
          </Link>
        </p>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={accept}
            className="px-4 py-1.5 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Accepter
          </button>
          <button
            onClick={refuse}
            className="text-sm text-gray-500 hover:text-gray-800 transition-colors underline"
          >
            Continuer sans accepter
          </button>
        </div>
      </div>
    </div>
  );
}
