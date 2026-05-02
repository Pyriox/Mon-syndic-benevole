// ============================================================
// Composant client : actions structurelles sur la fiche utilisateur
// (modifier, rôle admin, changer rôle syndic/membre, supprimer)
// ============================================================
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, ShieldCheck, UserCog, Pencil, Loader2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { AdminConfirmDialog, AdminDialogNotice, AdminPromptDialog } from './AdminActionDialog';

interface Props {
  userId: string;
  userEmail: string;
  fullName?: string;
  isAdmin: boolean;
  userRole: 'syndic' | 'membre' | 'admin';
}

type ConfirmAction = 'delete' | 'toggle_admin' | 'toggle_role';

async function getErrorMessage(response: Response, fallback = 'Une erreur est survenue.'): Promise<string> {
  try {
    const data = await response.json() as { error?: string };
    return data.error ?? fallback;
  } catch {
    return fallback;
  }
}

export default function AdminUserActionsDetail({ userId, userEmail, fullName, isAdmin, userRole }: Props) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [pendingAction, setPendingAction] = useState<ConfirmAction | 'edit' | null>(null);
  const [role, setRole] = useState(userRole);

  const [editOpen, setEditOpen] = useState(false);
  const [editEmail, setEditEmail] = useState(userEmail);
  const [editFullName, setEditFullName] = useState(fullName ?? '');
  const [deleteInput, setDeleteInput] = useState('');

  const openEdit = () => {
    setError('');
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
      router.refresh();
      return;
    }
    setError(`Erreur : ${await getErrorMessage(response)}`);
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
        body: JSON.stringify({ action: action === 'toggle_admin' ? 'toggle_admin' : 'toggle_role', userId }),
      });
    }

    setPendingAction(null);
    if (response.ok) {
      if (action === 'delete') {
        router.push('/admin/utilisateurs');
        return;
      }
      if (action === 'toggle_role') {
        const data = await response.json() as { newRole?: string };
        setRole(data.newRole === 'membre' ? 'membre' : 'syndic');
      }
      router.refresh();
      return;
    }
    setError(`Erreur : ${await getErrorMessage(response)}`);
  };

  const btnCls = 'inline-flex items-center rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs font-medium text-red-700 hover:border-red-300 disabled:opacity-50 transition-colors';

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
              onChange={(e) => setEditEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Nom complet</label>
            <input
              type="text"
              value={editFullName}
              onChange={(e) => setEditFullName(e.target.value)}
              placeholder="Nom complet"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setEditOpen(false)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={pendingAction === 'edit'}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {pendingAction === 'edit' && <Loader2 size={12} className="animate-spin" />}
              {pendingAction === 'edit' ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </Modal>

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

      <AdminConfirmDialog
        isOpen={confirmAction === 'toggle_role'}
        onClose={() => setConfirmAction(null)}
        title={role === 'membre' ? 'Passer en Syndic' : 'Passer en Membre'}
        description={<p>Changer le rôle de <strong>{userEmail}</strong> : {role === 'membre' ? 'Membre → Syndic' : 'Syndic → Membre'} ?</p>}
        confirmLabel={role === 'membre' ? 'Passer Syndic' : 'Passer Membre'}
        tone="primary"
        onConfirm={executeConfirmedAction}
        isLoading={pendingAction === 'toggle_role'}
      />

      <AdminPromptDialog
        isOpen={confirmAction === 'delete'}
        onClose={() => { setConfirmAction(null); setDeleteInput(''); }}
        title="Supprimer le compte"
        description={<p>Supprimer définitivement <strong>{userEmail}</strong> ? Cette action est <strong>irréversible</strong>.</p>}
        label='Tapez “SUPPRIMER” pour confirmer'
        value={deleteInput}
        onChange={(v) => setDeleteInput(v)}
        onConfirm={executeConfirmedAction}
        confirmLabel="Supprimer définitivement"
        placeholder="SUPPRIMER"
        inputType="text"
        requiredValue="SUPPRIMER"
        isLoading={pendingAction === 'delete'}
        tone="danger"
      />

      {error && !editOpen && <p className="text-[11px] text-red-600">{error}</p>}

      <div className="flex flex-wrap gap-1.5">
        <button onClick={openEdit} disabled={!!pendingAction} className={btnCls}>
          <Pencil size={12} className="mr-1.5" />
          Modifier
        </button>

        {!isAdmin && (
          <button onClick={() => setConfirmAction('toggle_role')} disabled={!!pendingAction} className={btnCls}>
            <UserCog size={12} className="mr-1.5" />
            {role === 'membre' ? 'Passer Syndic' : 'Passer Membre'}
          </button>
        )}

        <button onClick={() => setConfirmAction('toggle_admin')} disabled={!!pendingAction} className={btnCls}>
          <ShieldCheck size={12} className="mr-1.5" />
          {isAdmin ? 'Retirer admin' : 'Rôle admin'}
        </button>
      </div>

      <div className="mt-2 pt-2 border-t border-red-200/60">
        <button onClick={() => setConfirmAction('delete')} disabled={!!pendingAction} className={btnCls}>
          {pendingAction === 'delete'
            ? <Loader2 size={12} className="mr-1.5 animate-spin" />
            : <Trash2 size={12} className="mr-1.5" />
          }
          Supprimer le compte
        </button>
      </div>
    </>
  );
}
