'use client';

import { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';

type AddonBillingButtonProps = {
  coproprieteid: string;
  enabled: boolean;
  scheduledForCancellation?: boolean;
};

export default function AddonBillingButton({
  coproprieteid,
  enabled,
  scheduledForCancellation = false,
}: AddonBillingButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isEnabling = !enabled || scheduledForCancellation;
  const label = !enabled
    ? 'Activer l’option'
    : scheduledForCancellation
      ? 'Conserver l’option'
      : 'Arrêter à l’échéance';

  async function handleClick() {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/stripe/addons/charges-speciales', {
        method: isEnabling ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coproprieteid }),
      });

      const json = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) {
        setError(json.error ?? `Erreur ${response.status}`);
        setLoading(false);
        return;
      }

      const addonState = isEnabling ? 'enabled' : 'disabled';
      window.location.assign(`/abonnement?addon=${addonState}&coproId=${coproprieteid}`);
    } catch {
      setError('Erreur réseau — vérifiez votre connexion.');
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-colors ${
          isEnabling
            ? 'bg-slate-900 hover:bg-slate-800'
            : 'bg-amber-600 hover:bg-amber-700'
        } ${loading ? 'cursor-wait opacity-80' : ''}`}
      >
        {loading ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Traitement…
          </>
        ) : (
          <>
            <Sparkles size={14} />
            {label}
          </>
        )}
      </button>

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
