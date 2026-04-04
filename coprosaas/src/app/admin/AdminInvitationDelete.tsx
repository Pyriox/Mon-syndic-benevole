'use client';

import { useState } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { AdminConfirmDialog } from './AdminActionDialog';

interface Props {
  invitationId: string;
  email: string;
}

export default function AdminInvitationDelete({ invitationId, email }: Props) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (done) return <span className="text-xs font-medium text-green-600">✓ Supprimée</span>;

  const confirmDelete = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/invitations', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitationId }),
      });

      if (response.ok) {
        setDone(true);
        setConfirmOpen(false);
      } else {
        const data = await response.json() as { error?: string };
        setError(data.error ?? 'Erreur lors de la suppression');
      }
    } catch {
      setError('Erreur réseau');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AdminConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Supprimer l'invitation"
        description={<p>Supprimer l&apos;invitation de <strong>{email}</strong> ?</p>}
        confirmLabel="Supprimer"
        onConfirm={confirmDelete}
        isLoading={loading}
        tone="danger"
      />

      <div className="flex flex-col items-start gap-1">
        <button
          onClick={() => {
            setError('');
            setConfirmOpen(true);
          }}
          disabled={loading}
          className="inline-flex items-center gap-1 rounded px-1.5 py-1 text-xs text-red-500 transition-colors hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
          title="Supprimer l'invitation"
        >
          {loading ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
        </button>
        {error ? <p className="text-[11px] text-red-600">{error}</p> : null}
      </div>
    </>
  );
}
