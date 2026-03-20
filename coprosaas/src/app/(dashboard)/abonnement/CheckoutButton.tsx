'use client';

import { useState } from 'react';
import { CreditCard, Loader2 } from 'lucide-react';
import { trackEvent } from '@/lib/gtag';

interface CheckoutButtonProps {
  planId: 'essentiel' | 'confort' | 'illimite';
  coproprieteid: string;
  isPrimary?: boolean;
}

export default function CheckoutButton({ planId, coproprieteid, isPrimary }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handle = async () => {
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
    <div className="space-y-1.5 mt-auto pt-4">
      <button
        type="button"
        onClick={handle}
        disabled={loading}
        className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-70 ${
          isPrimary ? 'bg-white text-blue-700 hover:bg-blue-50' : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <CreditCard size={14} />}
        Essai gratuit 30 jours
      </button>
      {error && <p className="text-xs text-red-400 text-center">{error}</p>}
    </div>
  );
}
