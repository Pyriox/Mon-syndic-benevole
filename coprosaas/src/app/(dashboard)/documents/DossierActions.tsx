// ============================================================
// Client Component : Gestion des dossiers & sous-dossiers
// - DossierActions (default) : bouton "Nouveau dossier" (racine)
// - DossierRename            : renommer un dossier racine (avec couleur)
// - SubDossierActions        : créer / renommer / supprimer un sous-dossier
// - DossierDelete            : bouton poubelle (dossiers custom racine)
// ============================================================
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { FolderPlus, Trash2, Pencil, Plus, AlertTriangle, Palette } from 'lucide-react';

// Palette de couleurs disponibles pour les dossiers racine
export const FOLDER_COLORS = [
  { value: 'blue',   label: 'Bleu',   bg: 'bg-blue-500',   ring: 'ring-blue-400' },
  { value: 'amber',  label: 'Ambre',  bg: 'bg-amber-500',  ring: 'ring-amber-400' },
  { value: 'green',  label: 'Vert',   bg: 'bg-green-500',  ring: 'ring-green-400' },
  { value: 'purple', label: 'Violet', bg: 'bg-purple-500', ring: 'ring-purple-400' },
  { value: 'red',    label: 'Rouge',  bg: 'bg-red-500',    ring: 'ring-red-400' },
  { value: 'pink',   label: 'Rose',   bg: 'bg-pink-500',   ring: 'ring-pink-400' },
  { value: 'cyan',   label: 'Cyan',   bg: 'bg-cyan-500',   ring: 'ring-cyan-400' },
  { value: 'gray',   label: 'Gris',   bg: 'bg-gray-400',   ring: 'ring-gray-400' },
] as const;

function ColorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-2">Couleur</p>
      <div className="flex gap-2 flex-wrap">
        {FOLDER_COLORS.map((c) => (
          <button
            key={c.value}
            type="button"
            title={c.label}
            onClick={() => onChange(c.value)}
            className={`w-7 h-7 rounded-full ${c.bg} transition-all ${
              value === c.value ? `ring-2 ring-offset-2 ${c.ring}` : 'opacity-60 hover:opacity-100'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Bouton "Nouveau dossier" (niveau racine)
// ─────────────────────────────────────────────
export default function DossierActions() {
  const router = useRouter();
  const supabase = createClient();

  const [isOpen, setIsOpen] = useState(false);
  const [nom, setNom] = useState('');
  const [couleur, setCouleur] = useState('amber');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClose = () => { setIsOpen(false); setNom(''); setCouleur('amber'); setError(''); };

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
      couleur,
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
            placeholder="Contrats prestataires, Travaux 2025…"
            required
          />
          <ColorPicker value={couleur} onChange={setCouleur} />
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

// ─────────────────────────────────────────────
// Bouton crayon/palette : renommer un dossier racine (custom)
// ou changer uniquement sa couleur (défaut — colorOnly)
// ─────────────────────────────────────────────
interface DossierRenameProps {
  dossierId: string;
  dossierNom: string;
  dossierCouleur?: string | null;
  /** true pour les dossiers par défaut : seule la couleur est modifiable */
  colorOnly?: boolean;
}

export function DossierRename({ dossierId, dossierNom, dossierCouleur, colorOnly }: DossierRenameProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isOpen, setIsOpen] = useState(false);
  const [nom, setNom] = useState(dossierNom);
  const [couleur, setCouleur] = useState(dossierCouleur ?? 'blue');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClose = () => { setIsOpen(false); setNom(dossierNom); setCouleur(dossierCouleur ?? 'blue'); setError(''); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const update = colorOnly ? { couleur } : { nom: nom.trim(), couleur };
    const { error: dbError } = await supabase
      .from('document_dossiers')
      .update(update)
      .eq('id', dossierId);
    if (dbError) { setError('Erreur : ' + dbError.message); setLoading(false); return; }
    handleClose();
    router.refresh();
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        title={colorOnly ? 'Personnaliser la couleur' : 'Renommer ce dossier'}
        className="p-1.5 rounded-lg bg-white shadow-sm border border-gray-200 text-gray-400 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-colors"
      >
        {colorOnly ? <Palette size={13} /> : <Pencil size={13} />}
      </button>
      <Modal isOpen={isOpen} onClose={handleClose} title={colorOnly ? 'Couleur du dossier' : 'Renommer le dossier'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!colorOnly && (
            <Input
              label="Nom du dossier"
              name="nom"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              required
            />
          )}
          <ColorPicker value={couleur} onChange={setCouleur} />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3 pt-1">
            <Button type="submit" loading={loading}>Enregistrer</Button>
            <Button type="button" variant="secondary" onClick={handleClose}>Annuler</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

// ─────────────────────────────────────────────
// Actions sur un sous-dossier : créer / renommer / supprimer
// ─────────────────────────────────────────────
interface SubDossierActionsProps {
  parentId: string;
  dossier?: { id: string; nom: string } | null;
  hasDocuments?: boolean;
  hasSubs?: boolean;
  mode: 'create' | 'rename' | 'delete';
}

export function SubDossierActions({ parentId, dossier, hasDocuments, hasSubs, mode }: SubDossierActionsProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isOpen, setIsOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [nom, setNom] = useState(dossier?.nom ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClose = () => { setIsOpen(false); setNom(dossier?.nom ?? ''); setError(''); };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error: dbError } = await supabase.from('document_dossiers').insert({
      nom: nom.trim(),
      is_default: false,
      syndic_id: user.id,
      parent_id: parentId,
    });
    if (dbError) { setError('Erreur : ' + dbError.message); setLoading(false); return; }
    handleClose();
    router.refresh();
  };

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dossier) return;
    setLoading(true);
    setError('');
    const { error: dbError } = await supabase
      .from('document_dossiers')
      .update({ nom: nom.trim() })
      .eq('id', dossier.id);
    if (dbError) { setError('Erreur : ' + dbError.message); setLoading(false); return; }
    handleClose();
    router.refresh();
  };

  const executeDelete = async () => {
    if (!dossier) return;
    setLoading(true);
    setConfirmOpen(false);
    const { data: subs } = await supabase.from('document_dossiers').select('id').eq('parent_id', dossier.id);
    const subIds = (subs ?? []).map((s) => s.id);
    if (subIds.length > 0) {
      await supabase.from('documents').delete().in('dossier_id', subIds);
      await supabase.from('document_dossiers').delete().in('id', subIds);
    }
    await supabase.from('documents').delete().eq('dossier_id', dossier.id);
    await supabase.from('document_dossiers').delete().eq('id', dossier.id);
    router.refresh();
  };

  if (mode === 'delete') {
    const hasContent = hasDocuments || hasSubs;
    return (
      <>
        <button
          onClick={() => setConfirmOpen(true)}
          disabled={loading}
          title="Supprimer ce sous-dossier"
          className="p-1.5 rounded-lg bg-white shadow-sm border border-gray-200 text-gray-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors disabled:opacity-40"
        >
          <Trash2 size={13} />
        </button>
        <Modal isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} title="Supprimer le sous-dossier">
          <div className="space-y-4">
            {hasContent && (
              <div className="flex gap-3 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700">
                <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                <p className="text-sm">Ce dossier contient des fichiers ou sous-dossiers qui seront <strong>définitivement supprimés</strong>.</p>
              </div>
            )}
            <p className="text-sm text-gray-700">
              {hasContent
                ? `Supprimer "${dossier?.nom}" quand même ?`
                : `Supprimer le dossier "${dossier?.nom}" ?`}
            </p>
            <div className="flex gap-3 pt-1">
              <Button onClick={executeDelete} loading={loading} className="bg-red-600 hover:bg-red-700 text-white border-red-600">Supprimer</Button>
              <Button type="button" variant="secondary" onClick={() => setConfirmOpen(false)}>Annuler</Button>
            </div>
          </div>
        </Modal>
      </>
    );
  }

  if (mode === 'rename') {
    return (
      <>
        <button
          onClick={() => setIsOpen(true)}
          title="Renommer ce sous-dossier"
          className="p-1.5 rounded-lg bg-white shadow-sm border border-gray-200 text-gray-400 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-colors"
        >
          <Pencil size={13} />
        </button>
        <Modal isOpen={isOpen} onClose={handleClose} title="Renommer le sous-dossier">
          <form onSubmit={handleRename} className="space-y-4">
            <Input
              label="Nouveau nom"
              name="nom"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              required
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-3 pt-1">
              <Button type="submit" loading={loading}>Renommer</Button>
              <Button type="button" variant="secondary" onClick={handleClose}>Annuler</Button>
            </div>
          </form>
        </Modal>
      </>
    );
  }

  // mode === 'create'
  return (
    <>
      <Button onClick={() => setIsOpen(true)} variant="secondary" size="sm">
        <Plus size={15} /> Nouveau sous-dossier
      </Button>
      <Modal isOpen={isOpen} onClose={handleClose} title="Nouveau sous-dossier">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Nom du sous-dossier"
            name="nom"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder="Ex : 2024, Électricité, Travaux…"
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

// ─────────────────────────────────────────────
// Bouton poubelle (dossiers custom niveau racine)
// ─────────────────────────────────────────────
interface DossierDeleteProps {
  dossierId: string;
  dossierNom: string;
}

export function DossierDelete({ dossierId, dossierNom }: DossierDeleteProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const executeDelete = async () => {
    setLoading(true);
    setConfirmOpen(false);
    await supabase.from('document_dossiers').delete().eq('id', dossierId);
    router.refresh();
  };

  return (
    <>
      <button
        onClick={() => setConfirmOpen(true)}
        disabled={loading}
        title="Supprimer ce dossier"
        className="p-1.5 rounded-lg bg-white shadow-sm border border-gray-200 text-gray-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors disabled:opacity-40"
      >
        <Trash2 size={13} />
      </button>
      <Modal isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} title="Supprimer le dossier">
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            Supprimer le dossier <strong>&ldquo;{dossierNom}&rdquo;</strong> ? Les documents qu&apos;il contient seront conservés mais ne seront plus classés dans ce dossier.
          </p>
          <div className="flex gap-3 pt-1">
            <Button onClick={executeDelete} loading={loading} className="bg-red-600 hover:bg-red-700 text-white border-red-600">Supprimer</Button>
            <Button type="button" variant="secondary" onClick={() => setConfirmOpen(false)}>Annuler</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
