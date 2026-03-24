// ============================================================
// Composant client : actions par utilisateur dans la table admin
// ============================================================
'use client';

import { useState, useRef } from 'react';
import { Trash2, Mail, MoreHorizontal, Loader2, ShieldCheck } from 'lucide-react';

interface Props {
  userId: string;
  userEmail: string;
  isConfirmed: boolean;
  isSelf: boolean;
}

export default function AdminUserActions({ userId, userEmail, isConfirmed, isSelf }: Props) {
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

  const handleDelete = async () => {
    if (!confirm(`Supprimer définitivement le compte de ${userEmail} ?\n\nCette action est irréversible.`)) return;
    setLoading(true);
    setOpen(false);
    const res = await fetch(`/api/admin/users?userId=${userId}`, { method: 'DELETE' });
    if (res.ok) {
      window.location.reload();
    } else {
      const { error } = await res.json();
      alert('Erreur : ' + error);
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    setOpen(false);
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'resend_confirmation', email: userEmail }),
    });
    setLoading(false);
    if (res.ok) {
      setDone('Email envoyé');
      setTimeout(() => setDone(''), 3000);
    } else {
      const { error } = await res.json();
      alert('Erreur : ' + error);
    }
  };

  const handleForceConfirm = async () => {
    if (!confirm(`Forcer la vérification du compte de ${userEmail} sans envoyer d'email ?`)) return;
    setLoading(true);
    setOpen(false);
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'force_confirm', userId }),
    });
    setLoading(false);
    if (res.ok) {
      setDone('Compte vérifié');
      setTimeout(() => window.location.reload(), 1000);
    } else {
      const { error } = await res.json();
      alert('Erreur : ' + error);
    }
  };

  if (isSelf) return null;

  if (done) {
    return <span className="text-xs text-green-600 font-medium">{done}</span>;
  }

  return (
    <div className="relative flex items-center justify-end">
      {loading ? (
        <Loader2 size={15} className="text-gray-400 animate-spin" />
      ) : (
        <>
          <button
            ref={buttonRef}
            onClick={toggleOpen}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <MoreHorizontal size={15} />
          </button>

          {open && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
              <div
                className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[190px]"
                style={{ top: dropPos?.top ?? 0, right: dropPos?.right ?? 0 }}
              >
                {!isConfirmed && (
                  <button
                    onClick={handleResend}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Mail size={14} className="text-blue-500" />
                    Renvoyer la confirmation
                  </button>
                )}
                {!isConfirmed && (
                  <button
                    onClick={handleForceConfirm}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <ShieldCheck size={14} className="text-green-600" />
                    Forcer la vérification
                  </button>
                )}
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={14} />
                  Supprimer le compte
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
