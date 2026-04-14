'use client';

// Composant : lier une fiche copropriétaire à un compte utilisateur via user_id
import { useState } from 'react';
import { Loader2, Link2 } from 'lucide-react';
import { AdminConfirmDialog } from './AdminActionDialog';

interface Props {
  coproprietaireId: string;
  userId: string;
  displayName: string;
  coproNom: string;
}

export default function AdminLinkCoproprietaireUser({ coproprietaireId, userId, displayName, coproNom }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleLink = async () => {
    setLoading(true);
    try {
      await fetch('/api/admin/coproprietaires', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'link_user', coproprietaireId, linkUserId: userId }),
      });
      setDone(true);
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  if (done) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 border border-emerald-200">
        <Link2 size={10} /> Lié
      </span>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors"
      >
        <Link2 size={10} /> Lier au compte
      </button>

      <AdminConfirmDialog
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Lier la fiche au compte"
        description={
          <p>
            Associer <strong>{displayName}</strong> ({coproNom}) à ce compte utilisateur ?
            Le champ <code>user_id</code> de la fiche sera mis à jour.
          </p>
        }
        confirmLabel="Lier"
        onConfirm={handleLink}
        isLoading={loading}
      />
    </>
  );
}
