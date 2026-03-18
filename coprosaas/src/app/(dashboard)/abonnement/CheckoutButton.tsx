'use client';

import { useState } from 'react';
import { CheckCircle, CreditCard, Loader2, Settings2 } from 'lucide-react';

interface CheckoutButtonProps {
  planId: 'essentiel' | 'confort' | 'illimite';
  isSubscribed: boolean;
  hasStripeCustomer: boolean;
  isPrimary?: boolean;
  isCurrentPlan?: boolean;
}

export default function CheckoutButton({ planId, isSubscribed, hasStripeCustomer, isPrimary, isCurrentPlan }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCheckout = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });
      let json: { url?: string; error?: string } = {};
      try { json = await res.json(); } catch { /* réponse non-JSON */ }
      if (!res.ok) { setError(json.error ?? `Erreur ${res.status}`); setLoading(false); return; }
      if (!json.url) { setError('URL de paiement manquante.'); setLoading(false); return; }
      window.location.href = json.url;
    } catch {
      setError('Erreur réseau — vérifiez votre connexion.');
      setLoading(false);
    }
  };

  const handlePortal = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? 'Erreur'); setLoading(false); return; }
      window.location.href = json.url;
    } catch {
      setError('Erreur réseau.');
      setLoading(false);
    }
  };

  // Plan actuellement souscrit : badge "Plan actuel"
  if (isSubscribed && isCurrentPlan) {
    return (
      <div className="mt-5 space-y-2">
        <div className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold bg-white/20 text-white cursor-default">
          <CheckCircle size={15} />
          Plan actuel
        </div>
        {hasStripeCustomer && (
          <button
            type="button"
            onClick={handlePortal}
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-medium bg-white/10 text-white/80 hover:bg-white/20 transition-colors disabled:opacity-60"
          >
            {loading ? <Loader2 size={13} className="animate-spin" /> : <Settings2 size={13} />}
            Gérer l&apos;abonnement
          </button>
        )}
        {error && <p className="text-xs text-red-300 text-center">{error}</p>}
      </div>
    );
  }

  // Autre plan — abonné à un plan différent : grisé, redirection portail pour changer
  if (isSubscribed) {
    return (
      <div className="mt-5 space-y-2">
        <button
          type="button"
          onClick={hasStripeCustomer ? handlePortal : undefined}
          disabled={loading || !hasStripeCustomer}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold bg-gray-100 text-gray-400 hover:bg-gray-200 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : <CreditCard size={15} />}
          Changer de plan
        </button>
        {error && <p className="text-xs text-red-500 text-center">{error}</p>}
      </div>
    );
  }

  return (
    <div className="mt-5 space-y-2">
      <button
        type="button"
        onClick={handleCheckout}
        disabled={loading}
        className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold transition-colors disabled:opacity-70 ${
          isPrimary
            ? 'bg-white text-blue-700 hover:bg-blue-50'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {loading ? <Loader2 size={15} className="animate-spin" /> : <CreditCard size={15} />}
        S&apos;abonner
      </button>
      {error && <p className="text-xs text-red-500 text-center">{error}</p>}
    </div>
  );
}
