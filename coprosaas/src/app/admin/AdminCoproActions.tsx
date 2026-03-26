// ============================================================
// Composant client : actions par copropriété dans la table admin
// ============================================================
'use client';

import { useState, useRef } from 'react';
import { MoreHorizontal, Loader2, RotateCcw, RefreshCw, UserCog } from 'lucide-react';

interface Props {
  coproId: string;
  coproNom: string;
  currentPlan: string;
  currentPlanId: string | null;
  isOrphaned?: boolean;
}

export default function AdminCoproActions({ coproId, coproNom, currentPlan, isOrphaned }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState('');
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropPos, setDropPos] = useState<{ top: number; right: number } | null>(null);

  const toggleOpen = () => {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    }
    setOpen((v) => !v);
  };

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

  const handleSync = () => {
    if (!confirm(`Synchroniser « ${coproNom} » depuis Stripe ?\n\nLe plan sera mis à jour selon l'abonnement réel dans Stripe.`)) return;
    post({ action: 'stripe_sync', coproId });
  };

  const handleReassign = () => {
    const email = window.prompt(
      `Réassigner le syndic de « ${coproNom} »\n\nEntrez l\'adresse email du nouveau syndic :`,
    );
    if (!email?.trim()) return;
    if (!confirm(`Confirmer la réassignation de « ${coproNom} » à ${email.trim()} ?`)) return;
    post({ action: 'reassign_syndic', coproId, newEmail: email.trim() } as Record<string, unknown>);
  };

  if (done) return <span className="text-xs text-green-600 font-medium">✓</span>;

  return (
    <div className="relative flex items-center justify-end gap-1">
      {isOrphaned && (
        <span title="Copropriété sans syndic" className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-orange-100 text-orange-600">
          <UserCog size={11} />
        </span>
      )}
      {loading ? (
        <Loader2 size={15} className="animate-spin text-gray-400" />
      ) : (
        <button
          ref={buttonRef}
          onClick={toggleOpen}
          className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
          aria-label="Actions"
        >
          <MoreHorizontal size={15} />
        </button>
      )}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="fixed z-50 bg-white rounded-xl shadow-lg border border-gray-200 py-1 min-w-[210px]"
            style={{ top: dropPos?.top ?? 0, right: dropPos?.right ?? 0 }}
          >
            <button
              onClick={handleSync}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-blue-700 hover:bg-blue-50 transition-colors"
            >
              <RefreshCw size={12} className="shrink-0" />
              Sync depuis Stripe
            </button>
            <div className="border-t border-gray-100 my-1" />
            <button
              onClick={handleReassign}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-violet-700 hover:bg-violet-50 transition-colors"
            >
              <UserCog size={12} className="shrink-0" />
              Réassigner le syndic
            </button>
            {currentPlan !== 'essai' && (
              <>
                <div className="border-t border-gray-100 my-1" />
                <button
                  onClick={handleReset}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-amber-700 hover:bg-amber-50 transition-colors"
                >
                  <RotateCcw size={12} className="shrink-0" />
                  Réinitialiser (essai)
                </button>
              </>
            )}

          </div>
        </>
      )}
    </div>
  );
}

