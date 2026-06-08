'use client';

// Composant : activer / désactiver les e-mails marketing d'un utilisateur
import { useState } from 'react';
import { Loader2, MailX, MailCheck } from 'lucide-react';

interface Props {
  userId: string;
  unsubscribeMarketing: boolean;
}

export default function AdminUserMarketingAction({ userId, unsubscribeMarketing: initial }: Props) {
  const [unsubscribed, setUnsubscribed] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_marketing', userId }),
      });
      const data = await res.json() as { unsubscribeMarketing?: boolean; error?: string };
      if (res.ok && typeof data.unsubscribeMarketing === 'boolean') {
        setUnsubscribed(data.unsubscribeMarketing);
      } else {
        setError(data.error ?? 'Erreur inconnue');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <span className="inline-flex items-center gap-1.5">
      {unsubscribed
        ? <span className="text-amber-700 font-medium">Désabonné</span>
        : <span className="text-gray-700">Actifs</span>
      }
      <button
        onClick={handleToggle}
        disabled={loading}
        title={unsubscribed ? 'Réabonner aux e-mails marketing' : 'Désabonner des e-mails marketing'}
        className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium transition-all disabled:opacity-60 ${
          unsubscribed
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300'
            : 'border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-300'
        }`}
      >
        {loading
          ? <Loader2 size={10} className="animate-spin" />
          : unsubscribed
            ? <MailCheck size={10} />
            : <MailX size={10} />
        }
        {unsubscribed ? 'Réabonner' : 'Désabonner'}
      </button>
      {error && <span className="text-red-600 text-[10px]">{error}</span>}
    </span>
  );
}
