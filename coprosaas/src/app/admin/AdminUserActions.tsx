// ============================================================
// Composant client : actions par utilisateur dans la table admin
// ============================================================
'use client';

import { useState, useRef } from 'react';
import { Trash2, Mail, MoreHorizontal, Loader2, ShieldCheck, Pencil } from 'lucide-react';

interface Props {
  userId: string;
  userEmail: string;
  fullName?: string;
  isConfirmed: boolean;
  isSelf: boolean;
  isAdmin: boolean;
}

export default function AdminUserActions({ userId, userEmail, fullName, isConfirmed, isSelf, isAdmin }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState('');
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropPos, setDropPos] = useState<{ top: number; right: number } | null>(null);

  // ── Edit modal ────────────────────────────────────────────
  const [editOpen,     setEditOpen]     = useState(false);
  const [editEmail,    setEditEmail]    = useState(userEmail);
  const [editFullName, setEditFullName] = useState(fullName ?? '');
  const [editLoading,  setEditLoading]  = useState(false);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditLoading(true);
    const body: Record<string, unknown> = { userId };
    if (editEmail.trim() && editEmail.trim().toLowerCase() !== userEmail.toLowerCase()) {
      body.email = editEmail.trim().toLowerCase();
    }
    if (editFullName !== (fullName ?? '')) body.fullName = editFullName;
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setEditLoading(false);
    if (res.ok) {
      setEditOpen(false);
      setDone('Modifié');
      setTimeout(() => window.location.reload(), 800);
    } else {
      const { error } = await res.json();
      alert('Erreur : ' + error);
    }
  };

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

  const handleToggleAdmin = async () => {
    if (!confirm(`${isAdmin ? 'Retirer' : 'Accorder'} les droits administrateur à ${userEmail} ?`)) return;
    setLoading(true);
    setOpen(false);
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'toggle_admin', userId }),
    });
    setLoading(false);
    if (res.ok) {
      setDone(isAdmin ? 'Admin retiré' : 'Admin accordé');
      setTimeout(() => window.location.reload(), 800);
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
    <>
      {/* ── Edit modal ──────────────────────────────────── */}
      {editOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setEditOpen(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-sm font-bold text-gray-900 mb-4">Modifier l&apos;utilisateur</h2>
            <form onSubmit={handleEditSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nom complet</label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  placeholder="Nom complet"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-600 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="text-sm px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition-colors"
                >
                  {editLoading ? 'Enregistrement…' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Row actions ─────────────────────────────────── */}
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
                <div className="border-t border-gray-100 my-1" />
                <button
                  onClick={() => { setOpen(false); setEditEmail(userEmail); setEditFullName(fullName ?? ''); setEditOpen(true); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-blue-700 hover:bg-blue-50 transition-colors"
                >
                  <Pencil size={14} />
                  Modifier
                </button>
                <div className="border-t border-gray-100 my-1" />
                <button
                  onClick={handleToggleAdmin}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${isAdmin ? 'text-amber-700 hover:bg-amber-50' : 'text-indigo-700 hover:bg-indigo-50'}`}
                >
                  <ShieldCheck size={14} className={isAdmin ? 'text-amber-500' : 'text-indigo-500'} />
                  {isAdmin ? 'Retirer admin' : 'Rôle admin'}
                </button>
                <div className="border-t border-gray-100 my-1" />
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
    </>
  );
}
