'use client';

import { useState } from 'react';
import { Loader2, Zap, ArrowRight } from 'lucide-react';
import { getGa4ClientId, trackConsentAwareEvent } from '@/lib/gtag';
import Link from 'next/link';

interface CheckoutButtonProps {
  planId: 'essentiel' | 'confort' | 'illimite';
  coproprieteid: string;
  isPrimary?: boolean;
}

export default function CheckoutButton({ planId, coproprieteid, isPrimary }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cgvAccepted, setCgvAccepted] = useState(false);
  const [shake, setShake] = useState(false);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handle = async () => {
    if (!cgvAccepted) {
      setError('Veuillez accepter les CGV avant de continuer.');
      triggerShake();
      return;
    }
    setLoading(true);
    setError('');
    try {
      const gaClientId = await getGa4ClientId();
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, coproprieteid, gaClientId }),
      });
      let json: { url?: string; error?: string } = {};
      try { json = await res.json(); } catch { /* non-JSON */ }
      if (!res.ok) { setError(json.error ?? `Erreur ${res.status}`); setLoading(false); return; }
      if (!json.url) { setError('URL de paiement manquante.'); setLoading(false); return; }
      trackConsentAwareEvent({ standardEvent: 'begin_checkout', anonymousEvent: 'begin_checkout_anonymous', params: { plan_id: planId } });
      window.location.href = json.url;
    } catch {
      setError('Erreur réseau — vérifiez votre connexion.');
      setLoading(false);
    }
  };

  const isReady = cgvAccepted && !loading;

  return (
    <div className="space-y-2 mt-auto pt-4">
      <label className="flex items-start gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={cgvAccepted}
          onChange={(e) => { setCgvAccepted(e.target.checked); if (e.target.checked) setError(''); }}
          className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-gray-300 accent-blue-600"
        />
        <span className={`text-xs leading-relaxed ${isPrimary ? 'text-blue-100' : 'text-gray-500'}`}>
          J&apos;ai lu et j&apos;accepte les{' '}
          <Link href="/cgu" target="_blank" className={`underline ${isPrimary ? 'text-white' : 'text-blue-600'}`}>
            conditions générales de vente
          </Link>
        </span>
      </label>
      <button
        type="button"
        onClick={handle}
        disabled={loading}
        style={shake ? { animation: 'shake 0.4s ease' } : undefined}
        className={[
          'group relative flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold',
          'transition-all duration-200 select-none',
          'active:scale-[0.97]',
          loading && 'cursor-wait',
          !loading && !cgvAccepted && 'opacity-60 cursor-not-allowed',
          isReady && (isPrimary
            ? 'hover:bg-blue-50 hover:shadow-md'
            : 'hover:bg-blue-700 hover:shadow-md'),  
          isPrimary ? 'bg-white text-blue-700' : 'bg-blue-600 text-white',
        ].filter(Boolean).join(' ')}
      >
        {loading ? (
          <>
            <Loader2 size={14} className="animate-spin shrink-0" />
            Redirection…
          </>
        ) : (
          <>
            <Zap size={14} className="shrink-0" />
            Essai gratuit 14 jours
            <ArrowRight
              size={14}
              className={`shrink-0 transition-transform duration-150 ${isReady ? 'group-hover:translate-x-0.5' : ''}`}
            />
          </>
        )}
      </button>
      {error && <p className="text-xs text-red-500 text-center">{error}</p>}

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25%       { transform: translateX(-3px); }
          75%       { transform: translateX(3px); }
        }
      `}</style>
    </div>
  );
}
