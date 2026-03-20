// ============================================================
// Composant client : actions par copropriété dans la table admin
// ============================================================
'use client';

import { useState } from 'react';
import { MoreHorizontal, Loader2, RotateCcw } from 'lucide-react';

interface Props {
  coproId: string;
  coproNom: string;
  currentPlan: string;
  currentPlanId: string | null;
}

export default function AdminCoproActions({ coproId, coproNom, currentPlan }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState('');

  const post = async (body: object) => {
    setLoading(true);
    setOpen(false);
    const res = await fetch('/api/admin/coproprietes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setLoading(false);
    if (res.ok) {
      setDone('OK');
      setTimeout(() => window.location.reload(), 800);
    } else {
      const { error } = await res.json();
      alert('Erreur : ' + error);
    }
  };

  const handleReset = () => {
    if (!confirm(`Réinitialiser l'abonnement de « ${coproNom} » ?\n\nLe plan sera remis à « essai » et les données Stripe effacées (stripe_subscription_id, stripe_customer_id, plan_period_end).`)) return;
    post({ action: 'reset_subscription', coproId });
  };

  if (done) return <span className="text-xs text-green-600 font-medium">✓</span>;

  return (
    <div className="relative flex items-center justify-end">
      {loading ? (
        <Loader2 size={15} className="animate-spin text-gray-400" />
      ) : (
        <button
          onClick={() => setOpen((v) => !v)}
          className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
          aria-label="Actions"
        >
          <MoreHorizontal size={15} />
        </button>
      )}
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-20 bg-white rounded-xl shadow-lg border border-gray-200 py-1 min-w-[200px]">
            {currentPlan !== 'essai' ? (
              <button
                onClick={handleReset}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-amber-700 hover:bg-amber-50 transition-colors"
              >
                <RotateCcw size={12} className="shrink-0" />
                Réinitialiser (essai)
              </button>
            ) : (
              <p className="px-3 py-2 text-xs text-gray-400 italic">Aucune action disponible</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

