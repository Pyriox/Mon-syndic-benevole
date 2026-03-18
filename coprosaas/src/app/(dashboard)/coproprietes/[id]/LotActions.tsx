// ============================================================
// Client Component : Ajout ET modification d'un lot
// - Sans prop lot : formulaire d'ajout
// - Avec prop lot : formulaire de modification
// - Avec prop lotId uniquement : bouton de suppression
// ============================================================
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { Plus, Pencil, Lock, Trash2 } from 'lucide-react';

const TYPE_OPTIONS = [
  { value: 'appartement', label: 'Appartement' },
  { value: 'parking', label: 'Parking' },
  { value: 'cave', label: 'Cave' },
  { value: 'local_commercial', label: 'Local commercial' },
  { value: 'autre', label: 'Autre' },
];

// ---- Bouton + formulaire Ajouter / Modifier ----
interface LotActionsProps {
  coproprieteId: string;
  showLabel?: boolean;
  // Présent en mode modification
  lot?: { id: string; numero: string; type: string; tantiemes: number };
  // Limite de lots : undefined = pas de restriction (mode édition)
  canAdd?: boolean;
  lotLimit?: number;
}

export default function LotActions({ coproprieteId, showLabel, lot, canAdd, lotLimit }: LotActionsProps) {
  const router = useRouter();
  const supabase = createClient();
  const isEdit = Boolean(lot);

  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    numero: lot?.numero ?? '',
    type: lot?.type ?? 'appartement',
    tantiemes: lot?.tantiemes?.toString() ?? '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (isEdit && lot) {
      // Mise à jour du lot existant
      const { error: dbError } = await supabase
        .from('lots')
        .update({
          numero: formData.numero.trim(),
          type: formData.type,
          tantiemes: parseFloat(formData.tantiemes) || 0,
        })
        .eq('id', lot.id);

      if (dbError) { setError('Erreur : ' + dbError.message); setLoading(false); return; }
    } else {
      // Création d'un nouveau lot
      const { error: dbError } = await supabase.from('lots').insert({
        copropriete_id: coproprieteId,
        numero: formData.numero.trim(),
        type: formData.type,
        tantiemes: parseFloat(formData.tantiemes) || 0,
      });

      if (dbError) { setError('Erreur : ' + dbError.message); setLoading(false); return; }
    }

    setLoading(false);
    setIsOpen(false);
    if (!isEdit) setFormData({ numero: '', type: 'appartement', tantiemes: '' });
    router.refresh();
  };

  const handleOpen = () => {
    // Réinitialise les champs avec les valeurs du lot en édition
    setFormData({
      numero: lot?.numero ?? '',
      type: lot?.type ?? 'appartement',
      tantiemes: lot?.tantiemes?.toString() ?? '',
    });
    setError('');
    setLoading(false);
    setIsOpen(true);
  };

  return (
    <>
      {isEdit ? (
        <button
          onClick={handleOpen}
          title="Modifier ce lot"
          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
        >
          <Pencil size={15} />
        </button>
      ) : canAdd === false ? (
        <button
          type="button"
          onClick={() => router.push('/abonnement')}
          title={`Limite de ${lotLimit ?? 10} lots atteinte — Passez au plan supérieur`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-xl transition-colors"
        >
          <Lock size={13} />
          {showLabel ? `Limite de ${lotLimit ?? 10} lots atteinte` : 'Limite atteinte'}
        </button>
      ) : (
        <Button onClick={handleOpen} size="sm">
          <Plus size={14} />
          {showLabel ? 'Ajouter un lot' : 'Ajouter'}
        </Button>
      )}

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={isEdit ? `Modifier le lot ${lot?.numero}` : 'Ajouter un lot'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Numéro / Nom du lot"
            name="numero"
            value={formData.numero}
            onChange={handleChange}
            placeholder="Apt 3B, Parking 12, Cave A..."
            required
          />

          <Select
            label="Type de lot"
            name="type"
            value={formData.type}
            onChange={handleChange}
            options={TYPE_OPTIONS}
            required
          />

          <Input
            label="Tantièmes"
            name="tantiemes"
            type="number"
            min="0"
            step="0.01"
            value={formData.tantiemes}
            onChange={handleChange}
            placeholder="120"
            hint="Quote-part sur le total des tantièmes de la copropriété"
            required
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3 pt-1">
            <Button type="submit" loading={loading}>
              {isEdit ? 'Enregistrer' : 'Ajouter'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>
              Annuler
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

// ---- Bouton Supprimer (séparé pour la clarté) ----
interface LotDeleteProps {
  lotId: string;
  lotNumero: string;
}

export function LotDelete({ lotId, lotNumero }: LotDeleteProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Supprimer le lot "${lotNumero}" ? Cette action est irréversible.`)) return;
    setLoading(true);
    await supabase.from('lots').delete().eq('id', lotId);
    router.refresh();
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      title="Supprimer ce lot"
      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
    >
      <Trash2 size={15} />
    </button>
  );
}


