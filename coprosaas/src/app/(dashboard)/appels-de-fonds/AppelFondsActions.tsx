// ============================================================
// Client Component : Formulaire de création d'un appel de fonds
// Flux en 2 étapes : (1) sélection de l'AG source →
// (2) révision du budget et de l'échéancier importés.
// ============================================================
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { formatEuros, calculerPart } from '@/lib/utils';
import { Plus, Trash2, AlertTriangle, Calendar, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface Copropriete { id: string; nom: string; }
interface AppelFondsActionsProps { coproprietes: Copropriete[]; showLabel?: boolean; }

interface Poste { libelle: string; categorie: string; montant: string; }
const POSTE_VIDE: Poste = { libelle: '', categorie: 'autre', montant: '' };

interface BudgetResolution {
  id: string;
  titre: string;
  type_resolution: string | null;
  budget_postes: { libelle: string; montant: number }[] | null;
  fonds_travaux_montant: number | null;
}

interface AGWithBudgets {
  ag_id: string;
  ag_titre: string;
  ag_date: string;
  resolutions: BudgetResolution[];
  votedDates: string[]; // dates extraites du calendrier_financement voté
}

function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

const PERIODICITE_MOIS: Record<string, number> = {
  mensuel: 1, trimestriel: 3, semestriel: 6, annuel: 12,
};

function detectPeriodicite(dates: string[]): 'mensuel' | 'trimestriel' | 'semestriel' | 'annuel' {
  if (dates.length < 2) return 'trimestriel';
  const d1 = new Date(dates[0] + 'T00:00:00');
  const d2 = new Date(dates[1] + 'T00:00:00');
  const diff = (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth());
  if (diff <= 1) return 'mensuel';
  if (diff <= 3) return 'trimestriel';
  if (diff <= 6) return 'semestriel';
  return 'annuel';
}

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

  const [agsDisponibles, setAgsDisponibles] = useState<AGWithBudgets[]>([]);
  const [loadingAGs, setLoadingAGs] = useState(false);

  // Copropriété courante
  const coproprieteId = coproprietes[0]?.id ?? '';

  // Étape 1 : AG choisie (null = pas encore sélectionnée)
  const [agImportee, setAgImportee] = useState<AGWithBudgets | null>(null);
  const [isExceptionnel, setIsExceptionnel] = useState(false);
  const [resolutionLieeId, setResolutionLieeId] = useState('');

  // Étape 2 : données du formulaire
  const [titre, setTitre] = useState('');
  const [postes, setPostes] = useState<Poste[]>([{ ...POSTE_VIDE }]);
  const [postesExpanded, setPostesExpanded] = useState(false);
  const [repartitionExpanded, setRepartitionExpanded] = useState(false);

  // Échéancier
  const [useEcheancier, setUseEcheancier] = useState(false);
  const [dateSingle, setDateSingle] = useState('');             // versement unique
  const [editableDates, setEditableDates] = useState<string[]>([]); // versements multiples (éditables)
  const [fromAGDates, setFromAGDates] = useState(false);
  // Générateur automatique
  const [genDateDebut, setGenDateDebut] = useState('');
  const [genNb, setGenNb] = useState(4);
  const [genPeriodicite, setGenPeriodicite] = useState<'mensuel' | 'trimestriel' | 'semestriel' | 'annuel'>('trimestriel');

  // -- Charger les lots ----------------------------------------
  useEffect(() => {
    if (!coproprieteId) return;
    supabase
      .from('lots')
      .select('id, numero, tantiemes, coproprietaires(id, nom, prenom)')
      .eq('copropriete_id', coproprieteId)
      .then(({ data }) => {
        setLots((data ?? []).map((lot) => ({
          ...lot,
          coproprietaire: Array.isArray(lot.coproprietaires)
            ? lot.coproprietaires[0]
            : (lot.coproprietaires as unknown as { id: string; nom: string; prenom: string } | undefined),
        })));
      });
  }, [coproprieteId]); // eslint-disable-line react-hooks/exhaustive-deps

  // -- Charger les AGs terminées avec budgets approuvés --------
  useEffect(() => {
    if (!isOpen || !coproprieteId) return;
    const fetchAGs = async () => {
      setLoadingAGs(true);
      const { data: ags } = await supabase
        .from('assemblees_generales')
        .select('id, titre, date_ag')
        .eq('copropriete_id', coproprieteId)
        .eq('statut', 'terminee')
        .order('date_ag', { ascending: false });

      if (!ags?.length) { setLoadingAGs(false); return; }

      const { data: resolutions } = await supabase
        .from('resolutions')
        .select('id, titre, type_resolution, budget_postes, fonds_travaux_montant, ag_id')
        .in('ag_id', ags.map((a) => a.id))
        .in('type_resolution', ['budget_previsionnel', 'revision_budget', 'fonds_travaux', 'calendrier_financement'])
        .eq('statut', 'approuvee');

      const grouped: AGWithBudgets[] = ags
        .map((ag) => {
          const agRes = (resolutions ?? []).filter((r) => r.ag_id === ag.id);
          const calendrier = agRes.find((r) => r.type_resolution === 'calendrier_financement');
          return {
            ag_id: ag.id,
            ag_titre: ag.titre,
            ag_date: ag.date_ag,
            votedDates: (calendrier?.budget_postes ?? []).map((p: { libelle: string }) => p.libelle).filter(Boolean),
            resolutions: agRes
              .filter((r) => r.type_resolution !== 'calendrier_financement')
              .map((r) => ({
                id: r.id,
                titre: r.titre,
                type_resolution: r.type_resolution,
                budget_postes: r.budget_postes as { libelle: string; montant: number }[] | null,
                fonds_travaux_montant: r.fonds_travaux_montant,
              })),
          };
        })
        .filter((ag) => ag.resolutions.length > 0);

      setAgsDisponibles(grouped);
      setLoadingAGs(false);
    };
    fetchAGs();
  }, [isOpen, coproprieteId]); // eslint-disable-line react-hooks/exhaustive-deps

  // -- Sélection d'une AG --------------------------------------
  const selectAG = (ag: AGWithBudgets) => {
    setAgImportee(ag);
    setIsExceptionnel(false);

    const agDateISO = ag.ag_date.slice(0, 10); // toujours YYYY-MM-DD

    // Construire les postes depuis toutes les résolutions budgétaires
    const newPostes: Poste[] = [];
    let primaryResId = '';
    let hasBudgetPrev = false;
    for (const res of ag.resolutions) {
      if (!primaryResId) primaryResId = res.id;
      if (res.type_resolution === 'budget_previsionnel' || res.type_resolution === 'revision_budget') {
        hasBudgetPrev = true;
        if (res.budget_postes?.length) {
          newPostes.push(...res.budget_postes.map((p) => ({ libelle: p.libelle, categorie: 'autre', montant: String(p.montant) })));
        }
      }
      if (res.type_resolution === 'fonds_travaux' && res.fonds_travaux_montant) {
        newPostes.push({ libelle: 'Fonds de travaux (ALUR)', categorie: 'fonds_travaux_alur', montant: String(res.fonds_travaux_montant) });
      }
    }
    setPostes(newPostes.length > 0 ? newPostes : [{ ...POSTE_VIDE }]);
    setResolutionLieeId(primaryResId);
    setTitre(`Appel de fonds ${new Date(agDateISO + 'T00:00:00').getFullYear()}`);

    // Échéancier voté en AG
    if (ag.votedDates.length >= 2) {
      setEditableDates([...ag.votedDates]);
      setFromAGDates(true);
      setUseEcheancier(true);
      setDateSingle(ag.votedDates[0]);
      setGenDateDebut(ag.votedDates[0]);
      setGenNb(ag.votedDates.length);
      setGenPeriodicite(detectPeriodicite(ag.votedDates));
    } else if (ag.votedDates.length === 1) {
      setEditableDates([]);
      setFromAGDates(false);
      setUseEcheancier(false);
      setDateSingle(ag.votedDates[0]);
      setGenDateDebut(ag.votedDates[0]);
    } else {
      setEditableDates([]);
      setFromAGDates(false);
      setUseEcheancier(hasBudgetPrev);
      setDateSingle('');
      setGenDateDebut('');
      setGenNb(4);
      setGenPeriodicite('trimestriel');
    }
    setPostesExpanded(false);
  };

  // -- Réinitialiser le choix d'AG -----------------------------
  const resetAG = () => {
    setAgImportee(null);
    setIsExceptionnel(false);
    setResolutionLieeId('');
    setPostes([{ ...POSTE_VIDE }]);
    setEditableDates([]);
    setFromAGDates(false);
    setDateSingle('');
    setUseEcheancier(false);
    setGenDateDebut('');
    setGenNb(4);
    setGenPeriodicite('trimestriel');
    setTitre('');
    setPostesExpanded(false);
  };

  const startExceptionnel = () => {
    resetAG();
    setIsExceptionnel(true);
    setTitre('Appel de fonds exceptionnel');
    setPostesExpanded(true);
  };

  // -- Générer l'échéancier depuis les contrôles ---------------
  const genererEcheancier = () => {
    if (!genDateDebut) return;
    setEditableDates(Array.from({ length: genNb }, (_, i) => addMonths(genDateDebut, i * PERIODICITE_MOIS[genPeriodicite])));
    setFromAGDates(false);
  };

  // -- Calculs -------------------------------------------------
  const totalTantiemsVal = lots.reduce((s, l) => s + (l.tantiemes ?? 0), 0);
  const montantTotal = postes.reduce((s, p) => s + (parseFloat(p.montant) || 0), 0);
  const repartition = useMemo(() =>
    lots.filter((l) => l.coproprietaire)
      .map((lot) => ({ lot, montant: calculerPart(montantTotal, lot.tantiemes ?? 0, totalTantiemsVal) })),
  [lots, montantTotal, totalTantiemsVal]); // eslint-disable-line react-hooks/exhaustive-deps

  const montantParVers = useEcheancier && editableDates.length > 0
    ? Math.round((montantTotal / editableDates.length) * 100) / 100
    : montantTotal;

  const typeAppel = isExceptionnel ? 'exceptionnel'
    : agImportee?.resolutions.find((r) => r.id === resolutionLieeId)?.type_resolution ?? 'exceptionnel';

  const finalDatesCount = useEcheancier ? editableDates.length : 1;

  // -- Soumission ----------------------------------------------
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

    const finalDates = useEcheancier ? editableDates : (dateSingle ? [dateSingle] : []);
    if (finalDates.length === 0 || finalDates.some((d) => !d)) {
      setError("Renseignez toutes les dates de versement.");
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (finalDates.length > 1) {
      for (let i = 0; i < finalDates.length; i++) {
        const { data: appel, error: err } = await supabase
          .from('appels_de_fonds')
          .insert({
            copropriete_id: coproprieteId,
            titre: `${titre.trim()} — ${i + 1}/${finalDates.length}`,
            montant_total: montantParVers,
            date_echeance: finalDates[i],
            description: JSON.stringify(postesValides.map((p) => ({
              ...p, montant: String(Math.round((parseFloat(p.montant) / finalDates.length) * 100) / 100),
            }))),
            ag_resolution_id: resolutionLieeId || null,
            type_appel: typeAppel,
            created_by: user.id,
          })
          .select('id')
          .single();

        if (err) { setError(`Erreur versement ${i + 1} : ${err.message}`); setLoading(false); return; }
        if (appel) {
          await supabase.from('lignes_appels_de_fonds').insert(
            lots.filter((l) => l.coproprietaire).map((lot) => ({
              appel_de_fonds_id: appel.id,
              coproprietaire_id: lot.coproprietaire!.id,
              lot_id: lot.id,
              montant_du: calculerPart(montantParVers, lot.tantiemes ?? 0, totalTantiemsVal),
              paye: false,
              date_paiement: null,
            }))
          );
          // Débit du solde (l'appel crée une créance sur chaque copropriétaire)
          for (const lot of lots.filter((l) => l.coproprietaire)) {
            const montant = calculerPart(montantParVers, lot.tantiemes ?? 0, totalTantiemsVal);
            const { data: cop } = await supabase.from('coproprietaires').select('solde').eq('id', lot.coproprietaire!.id).single();
            await supabase.from('coproprietaires').update({
              solde: Math.round(((cop?.solde ?? 0) - montant) * 100) / 100,
            }).eq('id', lot.coproprietaire!.id);
          }
        }
      }
    } else {
      const { data: appel, error: err } = await supabase
        .from('appels_de_fonds')
        .insert({
          copropriete_id: coproprieteId,
          titre: titre.trim(),
          montant_total: montantTotal,
          date_echeance: finalDates[0],
          description: JSON.stringify(postesValides),
          ag_resolution_id: resolutionLieeId || null,
          type_appel: typeAppel,
          created_by: user.id,
        })
        .select('id')
        .single();

      if (err) { setError('Erreur : ' + err.message); setLoading(false); return; }
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
        // Débit du solde (l'appel crée une créance sur chaque copropriétaire)
        for (const r of repartition) {
          const { data: cop } = await supabase.from('coproprietaires').select('solde').eq('id', r.lot.coproprietaire!.id).single();
          await supabase.from('coproprietaires').update({
            solde: Math.round(((cop?.solde ?? 0) - r.montant) * 100) / 100,
          }).eq('id', r.lot.coproprietaire!.id);
        }
      }
    }

    close();
    router.refresh();
  };

  const close = () => {
    setIsOpen(false);
    resetAG();
    setIsExceptionnel(false);
    setError('');
    setRepartitionExpanded(false);
    setPostesExpanded(false);
  };

  const etape1 = !agImportee && !isExceptionnel;

  return (
    <>
      <Button onClick={() => setIsOpen(true)} size={showLabel ? 'md' : 'sm'}>
        <Plus size={16} /> {showLabel ? 'Créer un appel de fonds' : 'Créer'}
      </Button>

      <Modal isOpen={isOpen} onClose={close} title="Nouvel appel de fonds" size="xl">
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* ── ÉTAPE 1 : Sélection de l'AG ─────────────────── */}
          {etape1 && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">Depuis quelle AG ?</p>
              {loadingAGs ? (
                <p className="text-xs text-gray-400 py-4 text-center">Chargement des assemblées…</p>
              ) : agsDisponibles.length === 0 ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
                  Aucune AG terminée avec un budget approuvé. Vous pouvez créer un appel exceptionnel ci-dessous.
                </div>
              ) : (
                <div className="space-y-2">
                  {agsDisponibles.map((ag, i) => {
                    const total = ag.resolutions.reduce((s, r) =>
                      s + (r.fonds_travaux_montant ?? (r.budget_postes ?? []).reduce((x, p) => x + p.montant, 0)), 0);
                    const agDate = new Date(ag.ag_date.slice(0, 10) + 'T00:00:00');
                    return (
                      <button key={ag.ag_id} type="button" onClick={() => selectAG(ag)}
                        className="w-full flex items-center justify-between gap-3 bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-xl px-4 py-3 text-left transition-colors">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {i === 0 && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">Dernière AG</span>}
                            <span className="text-sm font-semibold text-gray-800">{ag.ag_titre}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {agDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                            {ag.votedDates.length > 0 && (
                              <span className="ml-2 text-indigo-600 font-medium">
                                · {ag.votedDates.length} versement{ag.votedDates.length > 1 ? 's' : ''} votés
                              </span>
                            )}
                          </p>
                        </div>
                        <span className="text-base font-bold text-blue-700 shrink-0">{formatEuros(total)}</span>
                      </button>
                    );
                  })}
                </div>
              )}
              <button type="button" onClick={startExceptionnel}
                className="mt-4 text-xs text-gray-500 hover:text-gray-700 underline underline-offset-2 flex items-center gap-1">
                <AlertTriangle size={12} className="text-amber-500" />
                Créer un appel exceptionnel sans AG
              </button>
            </div>
          )}

          {/* ── ÉTAPE 2 : Configuration ─────────────────────── */}
          {(agImportee || isExceptionnel) && (
            <>
              {/* En-tête AG ou exceptionnel */}
              {agImportee ? (
                <div className="flex items-center justify-between bg-blue-50 rounded-xl px-4 py-3 border border-blue-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-blue-600 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-blue-800">{agImportee.ag_titre}</p>
                      <p className="text-xs text-blue-500">
                        {new Date(agImportee.ag_date.slice(0, 10) + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <button type="button" onClick={resetAG}
                    className="text-xs text-blue-600 hover:text-blue-800 underline underline-offset-2 shrink-0">
                    Changer
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                  <AlertTriangle size={15} className="text-amber-600 shrink-0" />
                  <span className="text-xs text-amber-800 flex-1">Appel exceptionnel — non lié à une résolution AG</span>
                  <button type="button" onClick={resetAG}
                    className="text-xs text-amber-700 hover:text-amber-900 underline underline-offset-2 shrink-0">
                    Annuler
                  </button>
                </div>
              )}

              {/* Titre */}
              <Input
                label="Titre de l'appel de fonds"
                value={titre}
                onChange={(e) => setTitre(e.target.value)}
                placeholder="Appel de fonds 2026"
                required
              />

              {/* ── Budget ──────────────────────────────────── */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <button type="button" onClick={() => setPostesExpanded((v) => !v)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-700">Budget</span>
                    {agImportee && <span className="text-xs text-gray-400 font-normal">importé depuis l&apos;AG</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-base font-bold text-blue-700">{formatEuros(montantTotal)}</span>
                    {postesExpanded
                      ? <ChevronUp size={16} className="text-gray-400" />
                      : <ChevronDown size={16} className="text-gray-400" />}
                  </div>
                </button>

                {postesExpanded && (
                  <div className="p-3 space-y-2 border-t border-gray-200 bg-white">
                    <div className="grid grid-cols-[1fr_auto] gap-2 text-xs text-gray-400 px-1">
                      <span>Libellé</span><span className="w-28 text-right pr-8">Montant (€)</span>
                    </div>
                    {postes.map((poste, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input type="text" placeholder="Ex : Entretien ascenseur" value={poste.libelle}
                          onChange={(e) => setPostes((p) => p.map((x, i) => i === idx ? { ...x, libelle: e.target.value } : x))}
                          className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        <input type="number" min="0" step="0.01" placeholder="0,00" value={poste.montant}
                          onChange={(e) => setPostes((p) => p.map((x, i) => i === idx ? { ...x, montant: e.target.value } : x))}
                          className="w-28 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        {postes.length > 1 && (
                          <button type="button" onClick={() => setPostes((p) => p.filter((_, i) => i !== idx))}
                            className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                    <button type="button" onClick={() => setPostes((p) => [...p, { ...POSTE_VIDE }])}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 pt-1">
                      <Plus size={13} /> Ajouter un poste
                    </button>
                  </div>
                )}
              </div>

              {/* ── Échéancier ──────────────────────────────── */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Calendar size={15} className="text-indigo-600" />
                    <span className="text-sm font-semibold text-gray-700">Échéancier</span>
                    {fromAGDates && editableDates.length > 0 && (
                      <span className="text-xs text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full font-medium">
                        importé de l&apos;AG · modifiable
                      </span>
                    )}
                  </div>
                  <label className="flex items-center gap-1.5 cursor-pointer select-none shrink-0">
                    <input type="checkbox" checked={useEcheancier}
                      onChange={(e) => {
                        setUseEcheancier(e.target.checked);
                        if (!e.target.checked) setEditableDates([]);
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span className="text-xs text-gray-600">Plusieurs versements</span>
                  </label>
                </div>

                <div className="p-4 space-y-3 bg-white">
                  {!useEcheancier ? (
                    /* ── Versement unique ── */
                    <Input
                      label="Date d'échéance"
                      type="date"
                      value={dateSingle}
                      onChange={(e) => setDateSingle(e.target.value)}
                      required
                    />
                  ) : (
                    /* ── Plusieurs versements ── */
                    <>
                      {editableDates.length > 0 ? (
                        /* Liste éditable des versements */
                        <div className="space-y-2">
                          {editableDates.map((d, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <span className="text-xs text-gray-500 shrink-0 w-24">Versement {i + 1}</span>
                              <input
                                type="date"
                                value={d}
                                onChange={(e) => setEditableDates((prev) => prev.map((x, j) => j === i ? e.target.value : x))}
                                className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                              {montantTotal > 0 && (
                                <span className="text-xs font-bold text-indigo-700 shrink-0 w-20 text-right">{formatEuros(montantParVers)}</span>
                              )}
                              {editableDates.length > 2 && (
                                <button type="button"
                                  onClick={() => setEditableDates((prev) => prev.filter((_, j) => j !== i))}
                                  className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          ))}
                          <button type="button"
                            onClick={() => {
                              const last = editableDates[editableDates.length - 1] || genDateDebut || '';
                              setEditableDates((prev) => [...prev, last ? addMonths(last, PERIODICITE_MOIS[genPeriodicite]) : '']);
                            }}
                            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 pt-1">
                            <Plus size={13} /> Ajouter un versement
                          </button>
                        </div>
                      ) : (
                        /* Générateur automatique */
                        <div className="bg-gray-50 rounded-xl p-3 space-y-3">
                          <p className="text-xs text-gray-500">Définissez l&apos;échéancier automatiquement, puis modifiez les dates si besoin.</p>
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">1er versement</label>
                              <input type="date" value={genDateDebut}
                                onChange={(e) => setGenDateDebut(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
                              <input type="number" min="2" max="12" value={genNb}
                                onChange={(e) => setGenNb(Math.max(2, Math.min(12, parseInt(e.target.value) || 2)))}
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Périodicité</label>
                              <select value={genPeriodicite}
                                onChange={(e) => setGenPeriodicite(e.target.value as typeof genPeriodicite)}
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                <option value="mensuel">Mensuel</option>
                                <option value="trimestriel">Trimestriel</option>
                                <option value="semestriel">Semestriel</option>
                                <option value="annuel">Annuel</option>
                              </select>
                            </div>
                          </div>
                          <button type="button" onClick={genererEcheancier} disabled={!genDateDebut}
                            className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-xs font-semibold py-2 transition-colors">
                            Générer l&apos;échéancier
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* ── Répartition (collapsible) ─────────────────── */}
              {montantTotal > 0 && repartition.length > 0 && (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <button type="button" onClick={() => setRepartitionExpanded((v) => !v)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors">
                    <span className="text-sm font-semibold text-gray-700">Répartition</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">{repartition.length} lot(s){finalDatesCount > 1 ? ` · par versement : ${formatEuros(montantParVers)}` : ` · total : ${formatEuros(montantTotal)}`}</span>
                      {repartitionExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                    </div>
                  </button>
                  {repartitionExpanded && (
                    <table className="w-full text-xs border-t border-gray-200">
                      <tbody>
                        {repartition.map(({ lot, montant }) => (
                          <tr key={lot.id} className="border-t border-gray-100 hover:bg-gray-50">
                            <td className="px-4 py-2 font-medium text-gray-700">Lot {lot.numero}</td>
                            <td className="px-4 py-2 text-gray-500">{lot.coproprietaire!.prenom} {lot.coproprietaire!.nom}</td>
                            <td className="px-4 py-2 text-right font-bold text-gray-800">
                              {formatEuros(useEcheancier && editableDates.length > 0
                                ? Math.round((montant / editableDates.length) * 100) / 100
                                : montant)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex gap-3 pt-1">
                <Button type="submit" loading={loading}>
                  {useEcheancier && editableDates.length > 1
                    ? `Créer ${editableDates.length} appels de fonds`
                    : "Créer l'appel de fonds"}
                </Button>
                <Button type="button" variant="secondary" onClick={close}>Annuler</Button>
              </div>
            </>
          )}
        </form>
      </Modal>
    </>
  );
}
