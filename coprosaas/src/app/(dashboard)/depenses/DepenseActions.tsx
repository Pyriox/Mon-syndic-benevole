// ============================================================
// Client Component : Formulaire d'ajout de dépense
// Calcule automatiquement la répartition selon les tantièmes
// ============================================================
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import { revalidateCoproFinance } from '@/lib/actions/revalidate-copro-finance';
import {
  calculerPart,
  collectAvailableRepartitionGroups,
  filterLotsByRepartitionScope,
  formatEuros,
  formatRepartitionScope,
  getLotTantiemesForRepartitionScope,
  LABELS_CATEGORIE,
} from '@/lib/utils';
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
  repartition_type?: 'generale' | 'groupe';
  repartition_cible?: string | null;
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
  const [lots, setLots] = useState<{
    id: string;
    numero: string;
    tantiemes: number;
    coproprietaire_id: string | null;
    batiment?: string | null;
    groupes_repartition?: string[] | null;
    tantiemes_groupes?: Record<string, number> | null;
    coproprietaire?: { id: string; nom: string; prenom: string };
  }[]>([]);

  const [formData, setFormData] = useState({
    copropriete_id: depense?.copropriete_id ?? coproprietes[0]?.id ?? '',
    titre: depense?.titre ?? '',
    categorie: depense?.categorie ?? 'entretien',
    montant: depense ? String(depense.montant) : '',
    date_depense: depense?.date_depense ?? new Date().toISOString().split('T')[0],
    description: depense?.description ?? '',
    repartition_type: depense?.repartition_type ?? 'generale',
    repartition_cible: depense?.repartition_cible ?? '',
  });

  // Chargement des lots avec leurs copropriétaires quand la copropriété change
  useEffect(() => {
    if (!formData.copropriete_id) return;

    const fetchLots = async () => {
      const { data } = await supabase
        .from('lots')
        .select('id, numero, tantiemes, batiment, groupes_repartition, tantiemes_groupes, coproprietaires(id, nom, prenom)')
        .eq('copropriete_id', formData.copropriete_id);

      // Aplatir la relation (Supabase renvoie un tableau pour coproprietaires)
      const lotsFlat = (data ?? []).map((lot) => {
        const coproprietaire = Array.isArray(lot.coproprietaires)
          ? lot.coproprietaires[0]
          : lot.coproprietaires;

        return {
          ...lot,
          coproprietaire_id: coproprietaire?.id ?? null,
          coproprietaire,
        };
      });

      setLots(lotsFlat);
    };

    fetchLots();
  }, [formData.copropriete_id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const availableRepartitionGroups = useMemo(() => collectAvailableRepartitionGroups(lots), [lots]);

  // Calcul de la répartition à afficher à l'utilisateur
  const lotsRepartition = useMemo(
    () => filterLotsByRepartitionScope(lots, formData.repartition_type, formData.repartition_cible),
    [formData.repartition_cible, formData.repartition_type, lots],
  );
  const lotsRepartitionPonderee = useMemo(
    () => lotsRepartition.map((lot) => ({
      lot,
      tantiemes: getLotTantiemesForRepartitionScope(lot, formData.repartition_type, formData.repartition_cible),
    })),
    [formData.repartition_cible, formData.repartition_type, lotsRepartition],
  );
  const totalTantiemes = lotsRepartitionPonderee.reduce((sum, row) => sum + row.tantiemes, 0);
  const montantNum = parseFloat(formData.montant) || 0;

  const repartition = lotsRepartitionPonderee.map(({ lot, tantiemes }) => ({
    lot,
    tantiemes,
    montant: calculerPart(montantNum, tantiemes, totalTantiemes),
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const repartitionCible = formData.repartition_type === 'groupe'
      ? (formData.repartition_cible || null)
      : null;

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
        repartition_type: formData.repartition_type,
        repartition_cible: repartitionCible,
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

      await supabase.from('repartitions_depenses').delete().eq('depense_id', depense.id);
      const lignes = repartition
        .filter((r) => r.lot.coproprietaire)
        .map((r) => ({
          depense_id: depense.id,
          coproprietaire_id: r.lot.coproprietaire!.id,
          lot_id: r.lot.id,
          montant_du: r.montant,
          paye: false,
          date_paiement: null,
        }));

      if (lignes.length > 0) {
        await supabase.from('repartitions_depenses').insert(lignes);
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
          repartition_type: formData.repartition_type,
          repartition_cible: repartitionCible,
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

    setLoading(false);
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
        repartition_type: 'generale',
        repartition_cible: '',
      });
    }
    await revalidateCoproFinance(formData.copropriete_id);
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

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={isEdit ? 'Modifier la dépense' : 'Ajouter une dépense'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Catégorie"
              name="categorie"
              value={formData.categorie}
              onChange={handleChange}
              options={Object.entries(LABELS_CATEGORIE)
                // Le fonds travaux ALUR n'est pas une dépense de gestion : c'est une épargne
                // réglementaire (compte 103, compte bancaire séparé). Il est exclu ici pour
                // éviter toute confusion avec les dépenses réelles régularisables.
                .filter(([v]) => v !== 'fonds_travaux_alur')
                .map(([v, l]) => ({ value: v, label: l }))}
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
          </div>

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

          <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 space-y-2">
            <Select
              label="Répartition de la dépense"
              name="repartition_type"
              value={formData.repartition_type === 'groupe' && formData.repartition_cible ? `groupe:${formData.repartition_cible}` : 'generale'}
              onChange={(e) => {
                const value = e.target.value;
                setFormData((prev) => ({
                  ...prev,
                  repartition_type: value.startsWith('groupe:') ? 'groupe' : 'generale',
                  repartition_cible: value.startsWith('groupe:') ? value.slice(7) : '',
                }));
              }}
              options={[
                { value: 'generale', label: 'Charges communes' },
                ...availableRepartitionGroups.map((group) => ({ value: `groupe:${group}`, label: `Seulement ${group}` })),
              ]}
              required
            />
            <p className="text-xs text-blue-700">
              Cette dépense sera imputée selon : <span className="font-semibold">{formatRepartitionScope(formData.repartition_type, formData.repartition_cible)}</span>
            </p>
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
                {showRepartition ? 'Masquer' : 'Voir'} la répartition calculée ({repartition.length} lots concernés, {totalTantiemes} tantièmes)
              </button>

              {showRepartition && (
                <div className="mt-3 border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-blue-50 px-3 py-2 text-[11px] text-blue-700 border-b border-blue-100">
                    Clé utilisée : {formatRepartitionScope(formData.repartition_type, formData.repartition_cible)}
                  </div>
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

export function DepenseDelete({ depenseId, coproprieteId }: { depenseId: string; coproprieteId?: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Supprimer cette dépense ? Cette action est irréversible.')) return;
    setLoading(true);
    await supabase.from('repartitions_depenses').delete().eq('depense_id', depenseId);
    await supabase.from('depenses').delete().eq('id', depenseId);
    await revalidateCoproFinance(coproprieteId);
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
