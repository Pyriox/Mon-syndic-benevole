// ============================================================
// Composant client : actions par utilisateur dans la table admin
// ============================================================
'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Mail, MoreHorizontal, Loader2, ShieldCheck, Pencil } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { AdminConfirmDialog, AdminDialogNotice } from './AdminActionDialog';

interface Props {
  userId: string;
  userEmail: string;
  fullName?: string;
  isConfirmed: boolean;
  isSelf: boolean;
  isAdmin: boolean;
}

type ConfirmAction = 'delete' | 'force_confirm' | 'toggle_admin';

async function getErrorMessage(response: Response, fallback = 'Une erreur est survenue.') {
  try {
    const data = await response.json() as { error?: string };
    return data.error ?? fallback;
  } catch {
    return fallback;
  }
}

export default function AdminUserActions({ userId, userEmail, fullName, isConfirmed, isSelf, isAdmin }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState('');
  const [error, setError] = useState('');
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropPos, setDropPos] = useState<{ top: number; right: number } | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [pendingAction, setPendingAction] = useState<ConfirmAction | 'edit' | 'resend' | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editEmail, setEditEmail] = useState(userEmail);
  const [editFullName, setEditFullName] = useState(fullName ?? '');

  const toggleOpen = () => {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    }
    setOpen((value) => !value);
  };

  const openEdit = () => {
    setError('');
    setOpen(false);
    setEditEmail(userEmail);
    setEditFullName(fullName ?? '');
    setEditOpen(true);
  };

  const handleEditSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setPendingAction('edit');

    const body: Record<string, unknown> = { userId };
    if (editEmail.trim() && editEmail.trim().toLowerCase() !== userEmail.toLowerCase()) {
      body.email = editEmail.trim().toLowerCase();
    }
    if (editFullName !== (fullName ?? '')) body.fullName = editFullName;

    const response = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    setPendingAction(null);
    if (response.ok) {
      setEditOpen(false);
      setDone('Modifié');
      router.refresh();
      return;
    }

    setError(`Erreur : ${await getErrorMessage(response)}`);
  };

  const handleResend = async () => {
    setError('');
    setOpen(false);
    setPendingAction('resend');

    const response = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'resend_confirmation', email: userEmail }),
    });

    setPendingAction(null);
    if (response.ok) {
      setDone('Email envoyé');
      setTimeout(() => setDone(''), 3000);
      return;
    }

    setError(`Erreur : ${await getErrorMessage(response)}`);
  };

  const requestConfirmation = (action: ConfirmAction) => {
    setError('');
    setOpen(false);
    setConfirmAction(action);
  };

  const executeConfirmedAction = async () => {
    if (!confirmAction) return;

    const action = confirmAction;
    setError('');
    setPendingAction(action);
    setConfirmAction(null);

    let response: Response;
    if (action === 'delete') {
      response = await fetch(`/api/admin/users?userId=${userId}`, { method: 'DELETE' });
    } else {
      response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: action === 'force_confirm' ? 'force_confirm' : 'toggle_admin', userId }),
      });
    }

    setPendingAction(null);
    if (response.ok) {
      if (action === 'delete') {
        router.refresh();
        return;
      }

      setDone(action === 'force_confirm' ? 'Compte vérifié' : isAdmin ? 'Admin retiré' : 'Admin accordé');
      router.refresh();
      return;
    }

    setError(`Erreur : ${await getErrorMessage(response)}`);
  };

  if (isSelf) return null;

  if (done) {
    return <span className="text-xs font-medium text-green-600">{done}</span>;
  }

  return (
    <>
      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Modifier l'utilisateur" size="md">
        <form onSubmit={handleEditSubmit} className="space-y-3">
          <AdminDialogNotice message={error} />
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={editEmail}
              onChange={(event) => setEditEmail(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Nom complet</label>
            <input
              type="text"
              value={editFullName}
              onChange={(event) => setEditFullName(event.target.value)}
              placeholder="Nom complet"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setEditOpen(false)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={pendingAction === 'edit'}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {pendingAction === 'edit' && <Loader2 size={12} className="animate-spin" />}
              {pendingAction === 'edit' ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </Modal>

      <AdminConfirmDialog
        isOpen={confirmAction === 'delete'}
        onClose={() => setConfirmAction(null)}
        title="Supprimer le compte"
        description={<p>Supprimer définitivement <strong>{userEmail}</strong> ? Cette action est irréversible.</p>}
        confirmLabel="Supprimer"
        onConfirm={executeConfirmedAction}
        isLoading={pendingAction === 'delete'}
        tone="danger"
      />

      <AdminConfirmDialog
        isOpen={confirmAction === 'force_confirm'}
        onClose={() => setConfirmAction(null)}
        title="Forcer la vérification"
        description={<p>Marquer <strong>{userEmail}</strong> comme vérifié sans renvoyer d&apos;email ?</p>}
        confirmLabel="Vérifier le compte"
        onConfirm={executeConfirmedAction}
        isLoading={pendingAction === 'force_confirm'}
      />

      <AdminConfirmDialog
        isOpen={confirmAction === 'toggle_admin'}
        onClose={() => setConfirmAction(null)}
        title={isAdmin ? 'Retirer les droits admin' : 'Accorder les droits admin'}
        description={<p>{isAdmin ? 'Retirer' : 'Accorder'} les droits administrateur à <strong>{userEmail}</strong> ?</p>}
        confirmLabel={isAdmin ? 'Retirer admin' : 'Accorder admin'}
        onConfirm={executeConfirmedAction}
        isLoading={pendingAction === 'toggle_admin'}
        tone={isAdmin ? 'danger' : 'primary'}
      />

      <div className="flex flex-col items-end gap-1">
        <div className="relative flex items-center justify-end">
          {pendingAction && pendingAction !== 'edit' ? (
            <Loader2 size={15} className="animate-spin text-gray-400" />
          ) : (
            <>
              <button
                ref={buttonRef}
                onClick={toggleOpen}
                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
              >
                <MoreHorizontal size={15} />
              </button>

              {open && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                  <div
                    className="fixed z-50 min-w-[190px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
                    style={{ top: dropPos?.top ?? 0, right: dropPos?.right ?? 0 }}
                  >
                    {!isConfirmed && (
                      <button
                        onClick={handleResend}
                        className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                      >
                        <Mail size={14} className="text-blue-500" />
                        Renvoyer la confirmation
                      </button>
                    )}
                    {!isConfirmed && (
                      <button
                        onClick={() => requestConfirmation('force_confirm')}
                        className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                      >
                        <ShieldCheck size={14} className="text-green-600" />
                        Forcer la vérification
                      </button>
                    )}
                    <div className="my-1 border-t border-gray-100" />
                    <button
                      onClick={openEdit}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-blue-700 transition-colors hover:bg-blue-50"
                    >
                      <Pencil size={14} />
                      Modifier
                    </button>
                    <div className="my-1 border-t border-gray-100" />
                    <button
                      onClick={() => requestConfirmation('toggle_admin')}
                      className={`flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors ${isAdmin ? 'text-amber-700 hover:bg-amber-50' : 'text-indigo-700 hover:bg-indigo-50'}`}
                    >
                      <ShieldCheck size={14} className={isAdmin ? 'text-amber-500' : 'text-indigo-500'} />
                      {isAdmin ? 'Retirer admin' : 'Rôle admin'}
                    </button>
                    <div className="my-1 border-t border-gray-100" />
                    <button
                      onClick={() => requestConfirmation('delete')}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50"
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

        {error && !editOpen ? <p className="max-w-[220px] text-right text-[11px] text-red-600">{error}</p> : null}
      </div>
    </>
  );
}
