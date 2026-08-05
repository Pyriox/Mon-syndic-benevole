'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';

export default function AdminStripeSyncButton({ coproId, coproNom }: { coproId: string; coproNom: string }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSync = async () => {
    setStatus('loading');
    setMessage('');
    try {
      const res = await fetch('/api/admin/stripe/sync-copro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coproId }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setStatus('error');
        setMessage(data.message ?? 'Erreur inconnue');
        return;
      }
      const changed = data.before !== data.after;
      setStatus('ok');
      setMessage(
        changed
          ? `${data.before ?? '?'} → ${data.after}`
          : `Déjà à jour (${data.after})`
      );
      // Reload la page pour refléter le nouveau plan
      if (changed) setTimeout(() => window.location.reload(), 800);
    } catch {
      setStatus('error');
      setMessage('Erreur réseau');
    }
  };

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={handleSync}
        disabled={status === 'loading'}
        title={`Resynchroniser "${coproNom}" depuis Stripe`}
        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium border transition-colors ${
          status === 'ok'
            ? 'border-green-300 bg-green-50 text-green-700'
            : status === 'error'
            ? 'border-red-300 bg-red-50 text-red-700'
            : 'border-gray-200 bg-white text-gray-500 hover:border-indigo-300 hover:text-indigo-700 hover:bg-indigo-50'
        }`}
      >
        <RefreshCw size={11} className={status === 'loading' ? 'animate-spin' : ''} />
        {status === 'loading' ? 'Sync…' : 'Sync Stripe'}
      </button>
      {message && (
        <span className={`text-[10px] ${status === 'error' ? 'text-red-600' : 'text-green-600'}`}>
          {message}
        </span>
      )}
    </div>
  );
}
