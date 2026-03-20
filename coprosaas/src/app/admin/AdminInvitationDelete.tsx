'use client';
import { useState } from 'react';
import { Trash2, Loader2 } from 'lucide-react';

interface Props {
  invitationId: string;
  email: string;
}

export default function AdminInvitationDelete({ invitationId, email }: Props) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (done) return <span className="text-xs text-green-600 font-medium">✓ Supprimée</span>;

  const handleDelete = async () => {
    if (!confirm(`Supprimer l'invitation de « ${email} » ?`)) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/invitations', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitationId }),
      });
      if (res.ok) {
        setDone(true);
      } else {
        const data = await res.json();
        alert(data.error ?? 'Erreur lors de la suppression');
      }
    } catch {
      alert('Erreur réseau');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 rounded px-1.5 py-1 transition-colors disabled:opacity-50"
      title="Supprimer l'invitation"
    >
      {loading ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
    </button>
  );
}
