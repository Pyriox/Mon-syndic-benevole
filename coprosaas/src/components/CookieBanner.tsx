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
      className="fixed bottom-0 left-0 right-0 z-50 bg-gray-50 border-t border-gray-300 shadow-sm"
    >
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center gap-2 px-4 py-2 text-xs text-gray-500">
        <p className="flex-1 leading-snug">
          Ce site utilise des cookies analytiques pour mesurer son audience.{' '}
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
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors underline"
          >
            Refuser
          </button>
        </div>
      </div>
    </div>
  );
}
