'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, Loader2 } from 'lucide-react';

interface Props {
  deliveryId: string;
}

export default function AdminEmailRetryButton({ deliveryId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleRetry = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'retry', deliveryId }),
      });

      if (response.ok) {
        setDone(true);
        router.refresh();
      } else {
        const data = await response.json() as { error?: string };
        setError(data.error ?? 'Erreur inconnue');
      }
    } catch {
      setError('Erreur réseau');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return <span className="text-xs font-medium text-green-600">Planifié</span>;
  }

  if (error) {
    return <span className="text-xs text-red-600">{error}</span>;
  }

  return (
    <button
      onClick={handleRetry}
      disabled={loading}
      title="Remettre en file d'envoi"
      className="inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-100 disabled:opacity-50"
    >
      {loading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
      Retry
    </button>
  );
}
