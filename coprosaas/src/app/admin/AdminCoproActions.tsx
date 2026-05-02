'use client';
// ============================================================
// Composant client : actions par copropriété dans la table admin
// ============================================================

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MoreHorizontal, Loader2, UserCog, Pencil } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { appendAdminFrom } from '@/lib/admin-list-params';
import { AdminDialogNotice, AdminPromptDialog } from './AdminActionDialog';

interface Props {
  coproId: string;
  coproNom: string;
  isOrphaned?: boolean;
  adresse?: string | null;
  codePostal?: string | null;
  ville?: string | null;
  nombreLots?: number | null;
  contextHref?: string;
  inlineMode?: boolean;
}

async function getErrorMessage(response: Response, fallback = 'Une erreur est survenue.') {
  try {
    const data = await response.json() as { error?: string };
    return data.error ?? fallback;
  } catch {
    return fallback;
  }
}

export default function AdminCoproActions({
  coproId,
  coproNom,
  isOrphaned,
  adresse,
  codePostal,
  ville,
  nombreLots,
  contextHref,
  inlineMode = false,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState('');
  const [error, setError] = useState('');
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropPos, setDropPos] = useState<{ top: number; right: number } | null>(null);
  const [pendingAction, setPendingAction] = useState<'edit' | 'reassign_syndic' | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editNom, setEditNom] = useState(coproNom);
  const [editAdresse, setEditAdresse] = useState(adresse ?? '');
  const [editCodePostal, setEditCodePostal] = useState(codePostal ?? '');
  const [editVille, setEditVille] = useState(ville ?? '');
  const [editNbLots, setEditNbLots] = useState(String(nombreLots ?? ''));
  const [reassignOpen, setReassignOpen] = useState(false);
  const [reassignEmail, setReassignEmail] = useState('');

  const toggleOpen = () => {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    }
    setOpen((value) => !value);
  };

  const openEdit = () => {
    setError('');
    setEditNom(coproNom);
    setEditAdresse(adresse ?? '');
    setEditCodePostal(codePostal ?? '');
    setEditVille(ville ?? '');
    setEditNbLots(String(nombreLots ?? ''));
    setOpen(false);
    setEditOpen(true);
  };

  const handleEditSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setPendingAction('edit');

    const response = await fetch('/api/admin/coproprietes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        coproId,
        nom: editNom,
        adresse: editAdresse,
        code_postal: editCodePostal,
        ville: editVille,
        nombre_lots: editNbLots ? Number(editNbLots) : undefined,
      }),
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

  const postAction = async (body: Record<string, unknown>, successMessage = 'OK') => {
    setError('');
    setPendingAction('reassign_syndic');

    const response = await fetch('/api/admin/coproprietes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    setPendingAction(null);
    if (response.ok) {
      setDone(successMessage);
      router.refresh();
      return true;
    }

    setError(`Erreur : ${await getErrorMessage(response)}`);
    return false;
  };

  const submitReassign = async () => {
    const nextEmail = reassignEmail.trim().toLowerCase();
    if (!nextEmail) {
      setError('Adresse email requise pour la réassignation.');
      return;
    }

    const success = await postAction({ action: 'reassign_syndic', coproId, newEmail: nextEmail }, 'Syndic réassigné');
    if (success) {
      setReassignOpen(false);
      setReassignEmail('');
    }
  };

  const openDetails = () => {
    setOpen(false);
    router.push(appendAdminFrom(`/admin/coproprietes/${coproId}`, contextHref ?? null));
  };

  const btnCls = 'inline-flex items-center rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:border-gray-300 disabled:opacity-50 transition-colors';

  if (done) return <span className="text-xs font-medium text-green-600">✓</span>;

  if (inlineMode) {
    return (
      <>
        <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Modifier la copropriété" size="lg">
          <form onSubmit={handleEditSubmit} className="space-y-3">
            <AdminDialogNotice message={error} />
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Nom</label>
              <input type="text" value={editNom} onChange={(e) => setEditNom(e.target.value)} required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Adresse</label>
              <input type="text" value={editAdresse} onChange={(e) => setEditAdresse(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Code postal</label>
                <input type="text" value={editCodePostal} onChange={(e) => setEditCodePostal(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Ville</label>
                <input type="text" value={editVille} onChange={(e) => setEditVille(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Nombre de lots</label>
              <input type="number" min={0} value={editNbLots} onChange={(e) => setEditNbLots(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setEditOpen(false)} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-50">Annuler</button>
              <button type="submit" disabled={pendingAction === 'edit'} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-blue-700 disabled:opacity-50">
                {pendingAction === 'edit' && <Loader2 size={12} className="animate-spin" />}
                {pendingAction === 'edit' ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </Modal>

        <AdminPromptDialog
          isOpen={reassignOpen}
          onClose={() => setReassignOpen(false)}
          title="Réassigner le syndic"
          description={<p>Entrez l&apos;adresse email du nouveau syndic pour <strong>{coproNom}</strong>.</p>}
          label="Email du nouveau syndic"
          value={reassignEmail}
          onChange={setReassignEmail}
          onConfirm={submitReassign}
          confirmLabel="Réassigner"
          placeholder="nom@exemple.fr"
          isLoading={pendingAction === 'reassign_syndic'}
          error={error}
        />

        <div className="flex flex-wrap gap-1.5">
          <button onClick={openEdit} disabled={!!pendingAction} className={btnCls}>
            {pendingAction === 'edit' ? <Loader2 size={12} className="mr-1.5 animate-spin" /> : <Pencil size={12} className="mr-1.5" />}
            Modifier
          </button>
          <button
            onClick={() => { setError(''); setReassignEmail(''); setReassignOpen(true); }}
            disabled={!!pendingAction}
            className={btnCls}
          >
            {pendingAction === 'reassign_syndic' ? <Loader2 size={12} className="mr-1.5 animate-spin" /> : <UserCog size={12} className="mr-1.5" />}
            Réassigner le syndic
          </button>
          {error && !editOpen && !reassignOpen && <p className="w-full text-[11px] text-red-600">{error}</p>}
        </div>
      </>
    );
  }

  return (
    <>
      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Modifier la copropriété" size="lg">
        <form onSubmit={handleEditSubmit} className="space-y-3">
          <AdminDialogNotice message={error} />
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Nom</label>
            <input
              type="text"
              value={editNom}
              onChange={(event) => setEditNom(event.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Adresse</label>
            <input
              type="text"
              value={editAdresse}
              onChange={(event) => setEditAdresse(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Code postal</label>
              <input
                type="text"
                value={editCodePostal}
                onChange={(event) => setEditCodePostal(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Ville</label>
              <input
                type="text"
                value={editVille}
                onChange={(event) => setEditVille(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Nombre de lots</label>
            <input
              type="number"
              min={0}
              value={editNbLots}
              onChange={(event) => setEditNbLots(event.target.value)}
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

      <AdminPromptDialog
        isOpen={reassignOpen}
        onClose={() => setReassignOpen(false)}
        title="Réassigner le syndic"
        description={<p>Entrez l&apos;adresse email du nouveau syndic pour <strong>{coproNom}</strong>.</p>}
        label="Email du nouveau syndic"
        value={reassignEmail}
        onChange={setReassignEmail}
        onConfirm={submitReassign}
        confirmLabel="Réassigner"
        placeholder="nom@exemple.fr"
        isLoading={pendingAction === 'reassign_syndic'}
        error={error}
      />

      <div className="flex flex-col items-end gap-1">
        <div className="relative flex items-center justify-end gap-1">
          {isOrphaned && (
            <span title="Copropriété sans syndic" className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-orange-100 text-orange-600">
              <UserCog size={11} />
            </span>
          )}
          {pendingAction && pendingAction !== 'edit' ? (
            <Loader2 size={15} className="animate-spin text-gray-400" />
          ) : (
            <button
              ref={buttonRef}
              onClick={toggleOpen}
              className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
              aria-label="Actions"
            >
              <MoreHorizontal size={15} />
            </button>
          )}
          {open && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
              <div
                className="fixed z-50 min-w-[210px] rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
                style={{ top: dropPos?.top ?? 0, right: dropPos?.right ?? 0 }}
              >
                <button
                  onClick={openEdit}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-xs text-blue-700 transition-colors hover:bg-blue-50"
                >
                  <Pencil size={12} className="shrink-0" />
                  Modifier les infos
                </button>
                <button
                  onClick={() => {
                    setError('');
                    setOpen(false);
                    setReassignEmail('');
                    setReassignOpen(true);
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-xs text-violet-700 transition-colors hover:bg-violet-50"
                >
                  <UserCog size={12} className="shrink-0" />
                  Réassigner le syndic
                </button>
              </div>
            </>
          )}
        </div>

        {error && !editOpen && !reassignOpen ? <p className="max-w-[220px] text-right text-[11px] text-red-600">{error}</p> : null}
      </div>
    </>
  );
}
