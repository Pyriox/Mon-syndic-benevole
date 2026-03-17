// ============================================================
// Client Component : Formulaire de création d'un appel de fonds
// Calcule automatiquement les parts selon les tantièmes
// Peut être lié à une résolution AG votée ou être exceptionnel
// ============================================================
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { formatEuros, calculerPart, LABELS_CATEGORIE } from '@/lib/utils';
import { Plus, Trash2, AlertTriangle, Link2, Calendar } from 'lucide-react';

interface Copropriete { id: string; nom: string; }
interface AppelFondsActionsProps { coproprietes: Copropriete[]; showLabel?: boolean; }

interface Poste { libelle: string; categorie: string; montant: string; }
const POSTE_VIDE: Poste = { libelle: '', categorie: 'entretien', montant: '' };

interface AGResolutionOption {
  id: string;
  titre: string;
  type_resolution: string | null;
  budget_postes: { libelle: string; montant: number }[] | null;
  fonds_travaux_montant: number | null;
  ag_titre: string;
  ag_date: string;
}

function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

const PERIODICITE_MOIS: Record<string, number> = {
  mensuel: 1, trimestriel: 3, semestriel: 6, annuel: 12,
};

export default function AppelFondsActions({ coproprietes, showLabel }: AppelFondsActionsProps) {
  const router = useRouter();
  const supabase = createClient();

  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [lots, setLots] = useState<{
    id: string; numero: string; tantiemes: number;
    coproprietaire?: { id: string; nom: string; prenom: string };
  }[]>([]);

  const [resolutionsDisponibles, setResolutionsDisponibles] = useState<AGResolutionOption[]>([]);
  const [loadingResolutions, setLoadingResolutions] = useState(false);

  const [modeExceptionnel, setModeExceptionnel] = useState(false);
  const [resolutionLieeId, setResolutionLieeId] = useState('');

  const [formData, setFormData] = useState({
    copropriete_id: coproprietes[0]?.id ?? '',
    titre: 'Appel de fonds',
    date_echeance: '',
  });

  const [postes, setPostes] = useState<Poste[]>([{ ...POSTE_VIDE }]);
  const [echeancier, setEcheancier] = useState<{
    enabled: boolean;
    nb: number;
    periodicite: 'mensuel' | 'trimestriel' | 'semestriel' | 'annuel';
  }>({ enabled: false, nb: 4, periodicite: 'trimestriel' });

  useEffect(() => {
    if (!formData.copropriete_id) return;
    supabase
      .from('lots')
      .select('id, numero, tantiemes, coproprietaires(id, nom, prenom)')
      .eq('copropriete_id', formData.copropriete_id)
      .then(({ data }) => {
        setLots((data ?? []).map((lot) => ({
          ...lot,
          coproprietaire: Array.isArray(lot.coproprietaires)
            ? lot.coproprietaires[0]
            : (lot.coproprietaires as unknown as { id: string; nom: string; prenom: string } | undefined),
        })));
      });
  }, [formData.copropriete_id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isOpen || !formData.copropriete_id) return;
    const fetchResolutions = async () => {
      setLoadingResolutions(true);
      const { data: ags } = await supabase
        .from('assemblees_generales')
        .select('id, titre, date_ag')
        .eq('copropriete_id', formData.copropriete_id)
        .eq('statut', 'terminee');

      if (!ags?.length) { setLoadingResolutions(false); return; }

      const { data: resolutions } = await supabase
        .from('resolutions')
        .select('id, titre, type_resolution, budget_postes, fonds_travaux_montant, ag_id')
        .in('ag_id', ags.map((a) => a.id))
        .in('type_resolution', ['budget_previsionnel', 'revision_budget', 'fonds_travaux'])
        .eq('statut', 'approuvee');

      const opts: AGResolutionOption[] = (resolutions ?? []).map((r) => {
        const ag = ags.find((a) => a.id === r.ag_id)!;
        return {
          id: r.id,
          titre: r.titre,
          type_resolution: r.type_resolution,
          budget_postes: r.budget_postes as { libelle: string; montant: number }[] | null,
          fonds_travaux_montant: r.fonds_travaux_montant,
          ag_titre: ag.titre,
          ag_date: ag.date_ag,
        };
      });
      setResolutionsDisponibles(opts);
      setLoadingResolutions(false);
    };
    fetchResolutions();
  }, [isOpen, formData.copropriete_id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleResolutionChange = (resolutionId: string) => {
    setResolutionLieeId(resolutionId);
    const res = resolutionsDisponibles.find((r) => r.id === resolutionId);
    if (!res) return;
    // Regroupe budget prévisionnel ET fonds de travaux ALUR s'ils sont tous les deux présents
    const newPostes: Poste[] = [];
    if (res.budget_postes && res.budget_postes.length > 0) {
      newPostes.push(...res.budget_postes.map((p) => ({ libelle: p.libelle, categorie: 'autre', montant: String(p.montant) })));
    }
    if (res.fonds_travaux_montant) {
      newPostes.push({ libelle: 'Fonds de travaux (ALUR)', categorie: 'fonds_travaux_alur', montant: String(res.fonds_travaux_montant) });
    }
    if (newPostes.length > 0) setPostes(newPostes);
  };

  const totalTantiemsVal = lots.reduce((s, l) => s + (l.tantiemes ?? 0), 0);
  const montantNum = postes.reduce((s, p) => s + (parseFloat(p.montant) || 0), 0);
  const repartition = lots
    .filter((l) => l.coproprietaire)
    .map((lot) => ({ lot, montant: calculerPart(montantNum, lot.tantiemes ?? 0, totalTantiemsVal) }));

  const dateEcheancePast = !!formData.date_echeance && formData.date_echeance < new Date().toISOString().slice(0, 10);
  const echeancierDates = echeancier.enabled && formData.date_echeance
    ? Array.from({ length: echeancier.nb }, (_, i) =>
        addMonths(formData.date_echeance, i * PERIODICITE_MOIS[echeancier.periodicite])
      )
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const postesValides = postes.filter((p) => p.libelle.trim() && parseFloat(p.montant) > 0);
    if (postesValides.length === 0) {
      setError('Ajoutez au moins un poste avec un montant.');
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const resolutionLiee = resolutionsDisponibles.find((r) => r.id === resolutionLieeId);
    const typeAppel = resolutionLiee?.type_resolution ?? 'exceptionnel';

    if (echeancier.enabled) {
      // ── Échéancier : créer N appels de fonds ────────────────
      const mois = PERIODICITE_MOIS[echeancier.periodicite];
      const montantVers = Math.round((montantNum / echeancier.nb) * 100) / 100;

      for (let i = 0; i < echeancier.nb; i++) {
        const dateVers = addMonths(formData.date_echeance, i * mois);
        const titreVers = `${formData.titre.trim()} – ${i + 1}/${echeancier.nb}`;
        const postesDiv = postesValides.map((p) => ({
          ...p,
          montant: String(Math.round((parseFloat(p.montant) / echeancier.nb) * 100) / 100),
        }));

        const { data: appelVers, error: appelVersError } = await supabase
          .from('appels_de_fonds')
          .insert({
            copropriete_id: formData.copropriete_id,
            titre: titreVers,
            montant_total: montantVers,
            date_echeance: dateVers,
            description: JSON.stringify(postesDiv),
            ag_resolution_id: resolutionLieeId || null,
            type_appel: typeAppel,
            created_by: user.id,
          })
          .select('id')
          .single();

        if (appelVersError) {
          setError(`Erreur versement ${i + 1} : ${appelVersError.message}`);
          setLoading(false);
          return;
        }

        if (appelVers) {
          const repartitionVers = lots
            .filter((l) => l.coproprietaire)
            .map((lot) => ({ lot, montant: calculerPart(montantVers, lot.tantiemes ?? 0, totalTantiemsVal) }));
          await supabase.from('lignes_appels_de_fonds').insert(
            repartitionVers.map((r) => ({
              appel_de_fonds_id: appelVers.id,
              coproprietaire_id: r.lot.coproprietaire!.id,
              lot_id: r.lot.id,
              montant_du: r.montant,
              paye: false,
              date_paiement: null,
            }))
          );
        }
      }
    } else {
      // ── Appel unique ─────────────────────────────────────────
      const { data: appel, error: appelError } = await supabase
        .from('appels_de_fonds')
        .insert({
          copropriete_id: formData.copropriete_id,
          titre: formData.titre.trim(),
          montant_total: montantNum,
          date_echeance: formData.date_echeance,
          description: JSON.stringify(postesValides),
          ag_resolution_id: resolutionLieeId || null,
          type_appel: typeAppel,
          created_by: user.id,
        })
        .select('id')
        .single();

      if (appelError) {
        setError('Erreur : ' + appelError.message);
        setLoading(false);
        return;
      }

      if (appel && repartition.length > 0) {
        await supabase.from('lignes_appels_de_fonds').insert(
          repartition.map((r) => ({
            appel_de_fonds_id: appel.id,
            coproprietaire_id: r.lot.coproprietaire!.id,
            lot_id: r.lot.id,
            montant_du: r.montant,
            paye: false,
            date_paiement: null,
          }))
        );
      }
    }

    resetAndClose();
    router.refresh();
  };

  const categorieOptions = Object.entries(LABELS_CATEGORIE).map(([v, l]) => ({ value: v, label: l }));
  const hasResolutions = resolutionsDisponibles.length > 0;

  const resetAndClose = () => {
    setIsOpen(false);
    setModeExceptionnel(false);
    setResolutionLieeId('');
    setPostes([{ ...POSTE_VIDE }]);
    setFormData({ copropriete_id: coproprietes[0]?.id ?? '', titre: 'Appel de fonds', date_echeance: '' });
    setEcheancier({ enabled: false, nb: 4, periodicite: 'trimestriel' });
    setError('');
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)} size={showLabel ? 'md' : 'sm'}>
        <Plus size={16} /> {showLabel ? 'Créer un appel de fonds' : 'Créer'}
      </Button>

      <Modal isOpen={isOpen} onClose={resetAndClose} title="Nouvel appel de fonds" size="xl">
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Origine */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Origine de l&apos;appel de fonds</p>
            <div className="grid grid-cols-2 gap-2">
              <button type="button"
                onClick={() => { setModeExceptionnel(false); setResolutionLieeId(''); setPostes([{ ...POSTE_VIDE }]); }}
                className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors flex items-center justify-center gap-2 ${!modeExceptionnel ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                <Link2 size={14} /> Lier à une résolution AG
              </button>
              <button type="button"
                onClick={() => { setModeExceptionnel(true); setResolutionLieeId(''); }}
                className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors flex items-center justify-center gap-2 ${modeExceptionnel ? 'bg-amber-50 border-amber-300 text-amber-700' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                <AlertTriangle size={14} /> Appel exceptionnel
              </button>
            </div>
          </div>

          {modeExceptionnel && (
            <div className="flex gap-2 items-start bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 text-xs text-amber-800">
              <AlertTriangle size={13} className="mt-0.5 shrink-0 text-amber-600" />
              <span>Un appel de fonds doit normalement être basé sur un budget voté en assemblée générale (art. 14-1 loi 65-557). Cet appel exceptionnel sera signalé comme non lié à une résolution.</span>
            </div>
          )}

          {!modeExceptionnel && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Résolution budgétaire approuvée en AG
              </label>
              {loadingResolutions ? (
                <p className="text-xs text-gray-400">Chargement des résolutions&hellip;</p>
              ) : !hasResolutions ? (
                <div className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2.5 border border-gray-200">
                  Aucune résolution de budget approuvée trouvée. Finalisez d&apos;abord une AG avec un budget voté, ou créez un appel exceptionnel.
                </div>
              ) : (
                <select
                  value={resolutionLieeId}
                  onChange={(e) => handleResolutionChange(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required={!modeExceptionnel}
                >
                  <option value="">— Sélectionner une résolution —</option>
                  {resolutionsDisponibles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {new Date(r.ag_date).toLocaleDateString('fr-FR')} — {r.ag_titre} — {r.titre}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <Input
            label="Titre"
            name="titre"
            value={formData.titre}
            onChange={(e) => setFormData((p) => ({ ...p, titre: e.target.value }))}
            placeholder="Appel de fonds T1 2026"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label={echeancier.enabled ? "Date de la première échéance" : "Date d'échéance"}
              name="date_echeance"
              type="date"
              value={formData.date_echeance}
              onChange={(e) => setFormData((p) => ({ ...p, date_echeance: e.target.value }))}
              required
            />
            <div className="flex items-end pb-1">
              <div className="text-sm text-gray-700">
                <span className="block text-xs text-gray-500 mb-1 font-medium">Montant total calculé</span>
                <span className="text-xl font-bold text-blue-700">{formatEuros(montantNum)}</span>
              </div>
            </div>
          </div>

          {dateEcheancePast && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800">
              <AlertTriangle size={13} className="shrink-0 text-amber-600" />
              La date d&apos;échéance choisie est déjà passée.
            </div>
          )}

          {/* Postes de charges */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Postes de charges <span className="text-red-500">*</span></label>
              <button type="button"
                onClick={() => setPostes((p) => [...p, { ...POSTE_VIDE }])}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
                <Plus size={13} /> Ajouter un poste
              </button>
            </div>
            <div className="space-y-2 border border-gray-200 rounded-xl p-3 bg-gray-50">
              {postes.map((poste, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_1fr_auto_auto] gap-2 items-end">
                  <div>
                    {idx === 0 && <label className="block text-xs text-gray-500 mb-1">Libellé</label>}
                    <input type="text" placeholder="Ex : Entretien ascenseur" value={poste.libelle}
                      onChange={(e) => setPostes((p) => p.map((x, i) => i === idx ? { ...x, libelle: e.target.value } : x))}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    {idx === 0 && <label className="block text-xs text-gray-500 mb-1">Catégorie</label>}
                    <select value={poste.categorie}
                      onChange={(e) => setPostes((p) => p.map((x, i) => i === idx ? { ...x, categorie: e.target.value } : x))}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {categorieOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div>
                    {idx === 0 && <label className="block text-xs text-gray-500 mb-1">Montant</label>}
                    <input type="number" min="0" step="0.01" placeholder="0.00" value={poste.montant}
                      onChange={(e) => setPostes((p) => p.map((x, i) => i === idx ? { ...x, montant: e.target.value } : x))}
                      className="w-28 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className={idx === 0 ? 'pt-5' : ''}>
                    {postes.length > 1 && (
                      <button type="button"
                        onClick={() => setPostes((p) => p.filter((_, i) => i !== idx))}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Échéancier */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={echeancier.enabled}
                onChange={(e) => setEcheancier((p) => ({ ...p, enabled: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                <Calendar size={14} className="text-blue-600" />
                Créer un échéancier (plusieurs versements)
              </span>
            </label>
            {echeancier.enabled && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1 font-medium">Nombre de versements</label>
                    <input
                      type="number"
                      min="2"
                      max="12"
                      value={echeancier.nb}
                      onChange={(e) => setEcheancier((p) => ({ ...p, nb: Math.max(2, Math.min(12, parseInt(e.target.value) || 2)) }))}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1 font-medium">Périodicité</label>
                    <select
                      value={echeancier.periodicite}
                      onChange={(e) => setEcheancier((p) => ({ ...p, periodicite: e.target.value as typeof echeancier.periodicite }))}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="mensuel">Mensuel (tous les mois)</option>
                      <option value="trimestriel">Trimestriel (tous les 3 mois)</option>
                      <option value="semestriel">Semestriel (tous les 6 mois)</option>
                      <option value="annuel">Annuel (tous les ans)</option>
                    </select>
                  </div>
                </div>
                {echeancierDates.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-blue-700 mb-1.5">{echeancierDates.length} appels de fonds seront créés&nbsp;:</p>
                    <div className="space-y-1">
                      {echeancierDates.map((date, i) => (
                        <div key={i} className="flex items-center justify-between text-xs bg-white rounded-lg px-3 py-1.5 border border-blue-100">
                          <span className="font-medium text-gray-700">{formData.titre || 'Appel de fonds'} – {i + 1}/{echeancier.nb}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-gray-500">{new Date(date + 'T00:00:00').toLocaleDateString('fr-FR')}</span>
                            <span className="font-semibold text-blue-700">{formatEuros(Math.round((montantNum / echeancier.nb) * 100) / 100)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Prévisualisation de la répartition */}
          {montantNum > 0 && repartition.length > 0 && (
            <div className="border border-blue-200 rounded-lg overflow-hidden">
              <div className="bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700">
                {echeancier.enabled
                  ? `Répartition par versement — ${formatEuros(Math.round((montantNum / echeancier.nb) * 100) / 100)} (sur ${totalTantiemsVal} tantièmes)`
                  : `Répartition calculée (${totalTantiemsVal} tantièmes au total)`}
              </div>
              <table className="w-full text-xs">
                <tbody>
                  {repartition.map(({ lot, montant }) => (
                    <tr key={lot.id} className="border-t border-gray-100">
                      <td className="px-3 py-2">{lot.numero}</td>
                      <td className="px-3 py-2 text-gray-600">{lot.coproprietaire!.prenom} {lot.coproprietaire!.nom}</td>
                      <td className="px-3 py-2 text-right font-semibold">
                        {formatEuros(echeancier.enabled ? Math.round((montant / echeancier.nb) * 100) / 100 : montant)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3 pt-1">
            <Button type="submit" loading={loading}>
              {echeancier.enabled ? `Créer l'échéancier (${echeancier.nb} appels)` : "Créer l'appel de fonds"}
            </Button>
            <Button type="button" variant="secondary" onClick={resetAndClose}>Annuler</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}