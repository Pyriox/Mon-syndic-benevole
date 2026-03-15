// ============================================================
// Client Component : Création et suppression de dossiers
// - DossierActions (default) : bouton "Nouveau dossier"
// - DossierDelete  (named)   : bouton poubelle, dossiers custom seulement
// ============================================================
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { FolderPlus, Trash2 } from 'lucide-react';

// ---- Bouton "Nouveau dossier" ----
export default function DossierActions() {
  const router = useRouter();
  const supabase = createClient();

  const [isOpen, setIsOpen] = useState(false);
  const [nom, setNom] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClose = () => { setIsOpen(false); setNom(''); setError(''); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error: dbError } = await supabase.from('document_dossiers').insert({
      nom: nom.trim(),
      is_default: false,
      syndic_id: user.id,
    });

    if (dbError) { setError('Erreur : ' + dbError.message); setLoading(false); return; }
    handleClose();
    router.refresh();
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)} variant="secondary" size="sm">
        <FolderPlus size={15} /> Nouveau dossier
      </Button>

      <Modal isOpen={isOpen} onClose={handleClose} title="Nouveau dossier">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nom du dossier"
            name="nom"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder="Contrats prestataires, Travaux 2025..."
            required
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3 pt-1">
            <Button type="submit" loading={loading}>Créer</Button>
            <Button type="button" variant="secondary" onClick={handleClose}>Annuler</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

// ---- Bouton poubelle (dossiers custom uniquement) ----
interface DossierDeleteProps {
  dossierId: string;
  dossierNom: string;
}

export function DossierDelete({ dossierId, dossierNom }: DossierDeleteProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm(
      `Supprimer le dossier "${dossierNom}" ?\n\nLes documents qu'il contient seront conservés mais ne seront plus classés dans ce dossier.`
    )) return;
    setLoading(true);
    await supabase.from('document_dossiers').delete().eq('id', dossierId);
    router.refresh();
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      title="Supprimer ce dossier"
      className="p-1.5 rounded-lg bg-white shadow-sm border border-gray-200 text-gray-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors disabled:opacity-40"
    >
      <Trash2 size={13} />
    </button>
  );
}
