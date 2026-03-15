// ============================================================
// Client Component : Formulaire d'ajout de dépense
// Calcule automatiquement la répartition selon les tantièmes
// ============================================================
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import { formatEuros, calculerPart, LABELS_CATEGORIE } from '@/lib/utils';
import { Plus, Calculator, Upload, Pencil, Trash2, Paperclip, X, ExternalLink } from 'lucide-react';

interface Copropriete {
  id: string;
  nom: string;
}

interface Depense {
  id: string;
  copropriete_id: string;
  titre: string;
  categorie: string;
  montant: number;
  date_depense: string;
  description: string | null;
  piece_jointe_url: string | null;
}

interface DepenseActionsProps {
  coproprietes: Copropriete[];
  depensesDossierId?: string;
  depense?: Depense;
  showLabel?: boolean;
}

export default function DepenseActions({ coproprietes, depensesDossierId, depense, showLabel }: DepenseActionsProps) {
  const router = useRouter();
  const supabase = createClient();
  const isEdit = !!depense;

  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showRepartition, setShowRepartition] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pieceJointeActuelle, setPieceJointeActuelle] = useState<string | null>(depense?.piece_jointe_url ?? null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Données chargées dynamiquement
  const [lots, setLots] = useState<{ id: string; numero: string; tantiemes: number; coproprietaire?: { id: string; nom: string; prenom: string } }[]>([]);

  const [formData, setFormData] = useState({
    copropriete_id: depense?.copropriete_id ?? coproprietes[0]?.id ?? '',
    titre: depense?.titre ?? '',
    categorie: depense?.categorie ?? 'entretien',
    montant: depense ? String(depense.montant) : '',
    date_depense: depense?.date_depense ?? new Date().toISOString().split('T')[0],
    description: depense?.description ?? '',
  });

  // Chargement des lots avec leurs copropriétaires quand la copropriété change
  useEffect(() => {
    if (!formData.copropriete_id) return;

    const fetchLots = async () => {
      const { data } = await supabase
        .from('lots')
        .select('id, numero, tantiemes, coproprietaires(id, nom, prenom)')
        .eq('copropriete_id', formData.copropriete_id);

      // Aplatir la relation (Supabase renvoie un tableau pour coproprietaires)
      const lotsFlat = (data ?? []).map((lot) => ({
        ...lot,
        coproprietaire: Array.isArray(lot.coproprietaires)
          ? lot.coproprietaires[0]
          : lot.coproprietaires,
      }));

      setLots(lotsFlat);
    };

    fetchLots();
  }, [formData.copropriete_id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Calcul de la répartition à afficher à l'utilisateur
  const totalTantiemes = lots.reduce((sum, l) => sum + (l.tantiemes ?? 0), 0);
  const montantNum = parseFloat(formData.montant) || 0;

  const repartition = lots.map((lot) => ({
    lot,
    montant: calculerPart(montantNum, lot.tantiemes ?? 0, totalTantiemes),
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Upload pièce jointe si présente
    let pieceJointeUrl: string | null = null;
    if (selectedFile) {
      const fd = new FormData();
      fd.append('file', selectedFile);
      fd.append('copropriete_id', formData.copropriete_id);
      fd.append('nom', `${formData.titre.trim()} — ${formData.date_depense}`);
      fd.append('type', 'facture');
      if (depensesDossierId) fd.append('dossier_id', depensesDossierId);

      const res = await fetch('/api/upload-document', { method: 'POST', body: fd });
      const json = await res.json();

      if (!res.ok) {
        setError('Erreur upload : ' + (json.error ?? res.statusText));
        setLoading(false);
        return;
      }
      pieceJointeUrl = json.url;
    }

    if (isEdit) {
      // Mode édition : mise à jour de la dépense
      const updatePayload: Record<string, unknown> = {
        titre: formData.titre.trim(),
        categorie: formData.categorie,
        montant: montantNum,
        date_depense: formData.date_depense,
        description: formData.description.trim() || null,
      };
      if (pieceJointeUrl) updatePayload.piece_jointe_url = pieceJointeUrl;
      if (!pieceJointeActuelle && !pieceJointeUrl) updatePayload.piece_jointe_url = null;

      const { error: depError } = await supabase
        .from('depenses')
        .update(updatePayload)
        .eq('id', depense.id);

      if (depError) {
        setError('Erreur : ' + depError.message);
        setLoading(false);
        return;
      }
    } else {
      // Mode création : insertion de la dépense + répartitions
      const { data: newDepense, error: depError } = await supabase
        .from('depenses')
        .insert({
          copropriete_id: formData.copropriete_id,
          titre: formData.titre.trim(),
          categorie: formData.categorie,
          montant: montantNum,
          date_depense: formData.date_depense,
          description: formData.description.trim() || null,
          piece_jointe_url: pieceJointeUrl,
          created_by: user.id,
        })
        .select('id')
        .single();

      if (depError) {
        setError('Erreur : ' + depError.message);
        setLoading(false);
        return;
      }

      if (newDepense && lots.length > 0) {
        const lignes = repartition
          .filter((r) => r.lot.coproprietaire)
          .map((r) => ({
            depense_id: newDepense.id,
            coproprietaire_id: r.lot.coproprietaire!.id,
            lot_id: r.lot.id,
            montant_du: r.montant,
            paye: false,
            date_paiement: null,
          }));

        if (lignes.length > 0) {
          await supabase.from('repartitions_depenses').insert(lignes);
        }
      }
    }

    setIsOpen(false);
    setSelectedFile(null);
    if (!isEdit) {
      setFormData({
        copropriete_id: coproprietes[0]?.id ?? '',
        titre: '',
        categorie: 'entretien',
        montant: '',
        date_depense: new Date().toISOString().split('T')[0],
        description: '',
      });
    }
    router.refresh();
  };

  return (
    <>
      {isEdit ? (
        <button
          onClick={() => setIsOpen(true)}
          className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
          title="Modifier"
        >
          <Pencil size={15} />
        </button>
      ) : (
        <Button onClick={() => setIsOpen(true)} size={showLabel ? 'md' : 'sm'}>
          <Plus size={16} /> {showLabel ? 'Ajouter une dépense' : 'Ajouter'}
        </Button>
      )}

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={isEdit ? 'Modifier la dépense' : 'Ajouter une dépense'} size="xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Catégorie"
            name="categorie"
            value={formData.categorie}
            onChange={handleChange}
            options={Object.entries(LABELS_CATEGORIE).map(([v, l]) => ({ value: v, label: l }))}
            required
          />

          <Input
            label="Titre de la dépense"
            name="titre"
            value={formData.titre}
            onChange={handleChange}
            placeholder="Nettoyage des parties communes"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Montant (€)"
              name="montant"
              type="number"
              min="0"
              step="0.01"
              value={formData.montant}
              onChange={handleChange}
              placeholder="250.00"
              required
            />
            <Input
              label="Date"
              name="date_depense"
              type="date"
              value={formData.date_depense}
              onChange={handleChange}
              required
            />
          </div>

          <Textarea
            label="Description (optionnel)"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Détails supplémentaires..."
          />

          {/* Pièce jointe */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Pièce jointe <span className="text-gray-400 font-normal">(facultatif)</span>
            </label>

            {/* Pièce jointe existante (mode édition) */}
            {isEdit && pieceJointeActuelle && !selectedFile && (
              <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                <Paperclip size={14} className="text-gray-400 shrink-0" />
                <a
                  href={pieceJointeActuelle}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline flex items-center gap-1 truncate"
                >
                  {decodeURIComponent(pieceJointeActuelle.split('/').pop()?.replace(/^\d+-/, '') ?? 'Pièce jointe')}
                  <ExternalLink size={12} className="shrink-0" />
                </a>
                <button
                  type="button"
                  onClick={() => setPieceJointeActuelle(null)}
                  className="ml-auto shrink-0 text-gray-400 hover:text-red-500 transition-colors"
                  title="Supprimer la pièce jointe"
                >
                  <X size={15} />
                </button>
              </div>
            )}
            <div
              className="border border-dashed border-gray-300 rounded-lg p-3 flex items-center gap-3 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={16} className="text-gray-400 shrink-0" />
              {selectedFile ? (
                <span className="text-sm text-gray-700">
                  {selectedFile.name}{' '}
                  <span className="text-gray-400">({(selectedFile.size / 1024).toFixed(0)} Ko)</span>
                </span>
              ) : (
                <span className="text-sm text-gray-400">Facture, reçu, devis… (PDF, image)</span>
              )}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>

          {/* Affichage de la répartition calculée */}
          {montantNum > 0 && lots.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => setShowRepartition(!showRepartition)}
                className="text-sm text-blue-600 hover:underline flex items-center gap-1"
              >
                <Calculator size={14} />
                {showRepartition ? 'Masquer' : 'Voir'} la répartition calculée ({lots.length} lots, {totalTantiemes} tantièmes)
              </button>

              {showRepartition && (
                <div className="mt-3 border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-3 py-2 text-gray-500">Lot</th>
                        <th className="text-left px-3 py-2 text-gray-500">Copropriétaire</th>
                        <th className="text-right px-3 py-2 text-gray-500">Tantièmes</th>
                        <th className="text-right px-3 py-2 text-gray-500">Part</th>
                      </tr>
                    </thead>
                    <tbody>
                      {repartition.map(({ lot, montant }) => (
                        <tr key={lot.id} className="border-t border-gray-100">
                          <td className="px-3 py-2">{lot.numero}</td>
                          <td className="px-3 py-2 text-gray-600">
                            {lot.coproprietaire
                              ? `${lot.coproprietaire.prenom} ${lot.coproprietaire.nom}`
                              : <span className="text-gray-400 italic">Non assigné</span>}
                          </td>
                          <td className="px-3 py-2 text-right">{lot.tantiemes}</td>
                          <td className="px-3 py-2 text-right font-semibold">{formatEuros(montant)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3 pt-1">
            <Button type="submit" loading={loading}>Enregistrer</Button>
            <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>Annuler</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

// ── Named export : suppression d'une dépense ──────────────────────────────────

export function DepenseDelete({ depenseId }: { depenseId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Supprimer cette dépense ? Cette action est irréversible.')) return;
    setLoading(true);
    await supabase.from('repartitions_depenses').delete().eq('depense_id', depenseId);
    await supabase.from('depenses').delete().eq('id', depenseId);
    router.refresh();
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
      title="Supprimer"
    >
      <Trash2 size={15} />
    </button>
  );
}
