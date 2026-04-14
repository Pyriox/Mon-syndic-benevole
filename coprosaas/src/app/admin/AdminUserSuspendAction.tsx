'use client';

// Composant : suspendre / réactiver un compte utilisateur
import { useState } from 'react';
import { Loader2, ShieldOff, ShieldCheck } from 'lucide-react';
import { AdminConfirmDialog } from './AdminActionDialog';

interface Props {
  userId: string;
  userEmail: string;
  isSuspended: boolean;
}

export default function AdminUserSuspendAction({ userId, userEmail, isSuspended: initialSuspended }: Props) {
  const [suspended, setSuspended] = useState(initialSuspended);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_suspend', userId }),
      });
      if (res.ok) {
        setSuspended((prev) => !prev);
      }
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={loading}
        className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all disabled:opacity-60 ${
          suspended
            ? 'border-emerald-200 bg-white text-emerald-700 hover:border-emerald-300'
            : 'border-red-200 bg-white text-red-700 hover:border-red-300'
        }`}
      >
        {loading ? (
          <Loader2 size={12} className="animate-spin" />
        ) : suspended ? (
          <ShieldCheck size={12} />
        ) : (
          <ShieldOff size={12} />
        )}
        {suspended ? 'Réactiver le compte' : 'Suspendre le compte'}
      </button>

      <AdminConfirmDialog
        isOpen={open}
        onClose={() => setOpen(false)}
        title={suspended ? 'Réactiver le compte' : 'Suspendre le compte'}
        description={
          suspended ? (
            <p>Réactiver le compte <strong>{userEmail}</strong> ? L'utilisateur pourra se reconnecter.</p>
          ) : (
            <p>
              Suspendre <strong>{userEmail}</strong> ? La session sera immédiatement invalidée
              et l'accès bloqué jusqu'à réactivation.
            </p>
          )
        }
        confirmLabel={suspended ? 'Réactiver' : 'Suspendre'}
        tone={suspended ? 'primary' : 'danger'}
        onConfirm={handleToggle}
        isLoading={loading}
      />
    </>
  );
}
