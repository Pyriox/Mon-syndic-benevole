'use client';

import { useState } from 'react';
import { CreditCard, Loader2 } from 'lucide-react';
import { trackEvent } from '@/lib/gtag';
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

  const handle = async () => {
    if (!cgvAccepted) {
      setError('Veuillez accepter les CGV avant de continuer.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, coproprieteid }),
      });
      let json: { url?: string; error?: string } = {};
      try { json = await res.json(); } catch { /* non-JSON */ }
      if (!res.ok) { setError(json.error ?? `Erreur ${res.status}`); setLoading(false); return; }
      if (!json.url) { setError('URL de paiement manquante.'); setLoading(false); return; }
      trackEvent('begin_checkout', { plan_id: planId });
      window.location.href = json.url;
    } catch {
      setError('Erreur réseau — vérifiez votre connexion.');
      setLoading(false);
    }
  };

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
        disabled={loading || !cgvAccepted}
        className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
          isPrimary ? 'bg-white text-blue-700 hover:bg-blue-50' : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <CreditCard size={14} />}
        Essai gratuit 14 jours
      </button>
      {error && <p className="text-xs text-red-500 text-center">{error}</p>}
    </div>
  );
}
