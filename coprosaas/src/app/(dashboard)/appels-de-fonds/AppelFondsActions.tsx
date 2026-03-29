// ============================================================
// Client Component : Formulaire de création d'un appel de fonds
// Flux en 2 étapes : (1) choix source AG / exceptionnel →
// (2) confirmation budget + échéancier.
// ============================================================
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { formatEuros, calculerPart, repartirMontant } from '@/lib/utils';
import { Plus, Trash2, AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Calendar } from 'lucide-react';

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
const PERIODICITE_NB: Record<string, number> = {
  mensuel: 12, trimestriel: 4, semestriel: 2, annuel: 1,
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
  const [typeAppelExceptionnel, setTypeAppelExceptionnel] = useState<'budget_previsionnel' | 'fonds_travaux' | 'exceptionnel'>('budget_previsionnel');
  const [resolutionLieeId, setResolutionLieeId] = useState('');
  // Part fonds travaux ALUR dans cet appel (0 si non applicable)
  const [montantFondsTravaux, setMontantFondsTravaux] = useState(0);
  // Champ libre "dont fonds travaux" pour les appels sans AG
  const [montantFTManuel, setMontantFTManuel] = useState('');

  // Étape 2 : données du formulaire
  const [titre, setTitre] = useState('');
  const [postes, setPostes] = useState<Poste[]>([{ ...POSTE_VIDE }]);
  const [postesExpanded, setPostesExpanded] = useState(false);
  const [repartitionExpanded, setRepartitionExpanded] = useState(false);

  // Échéancier
  const [useEcheancier, setUseEcheancier] = useState(false);
  const [dateSingle, setDateSingle] = useState('');             // versement unique
  const [editableVersements, setEditableVersements] = useState<{ date: string; montant: string }[]>([]); // versements multiples (éditables)
  const [fromAGDates, setFromAGDates] = useState(false);
  // Générateur automatique
  const [genDateDebut, setGenDateDebut] = useState('');
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

      // Présélection automatique si une seule AG avec budget est disponible
      if (grouped.length === 1) {
        selectAG(grouped[0]);
      }
    };
    fetchAGs();
  }, [isOpen, coproprieteId]); // eslint-disable-line react-hooks/exhaustive-deps

  // -- Sélection d'une AG --------------------------------------
  const selectAG = (ag: AGWithBudgets) => {
    setAgImportee(ag);
    setIsExceptionnel(false);

    const agDateISO = ag.ag_date.slice(0, 10); // toujours YYYY-MM-DD
    const agYear = new Date(agDateISO + 'T00:00:00').getFullYear();
    const nextYear = agYear + 1; // les appels de fonds votés en AG concernent le budget n+1

    // Construire les postes depuis toutes les résolutions budgétaires
    const newPostes: Poste[] = [];
    let primaryResId = '';
    let hasBudgetPrev = false;
    let fondsTravauxTotal = 0;
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
        fondsTravauxTotal += res.fonds_travaux_montant;
      }
    }
    setMontantFondsTravaux(fondsTravauxTotal);
    setPostes(newPostes.length > 0 ? newPostes : [{ ...POSTE_VIDE }]);
    setResolutionLieeId(primaryResId);

    // Extraire l'année depuis le titre de la résolution budget (ex : "Budget prévisionnel 2026" → 2026)
    // Fallback sur agYear+1 si aucune année trouvée dans le titre
    let budgetYear = nextYear;
    for (const res of ag.resolutions) {
      if (res.type_resolution === 'budget_previsionnel' || res.type_resolution === 'revision_budget') {
        const match = res.titre.match(/\b(20\d{2})\b/);
        if (match) { budgetYear = parseInt(match[1], 10); break; }
      }
    }
    setTitre(`Calendrier de financement du budget prévisionnel et du fonds travaux ${budgetYear}`);

    // Montant local (dépenses + fonds travaux) pour initialiser les versements
    const localMontantTotal = (newPostes.length > 0 ? newPostes : [{ ...POSTE_VIDE }])
      .reduce((s, p) => p.categorie === 'fonds_travaux_alur' ? s : s + (parseFloat(p.montant) || 0), 0);
    const localTotalAvecFT = localMontantTotal + fondsTravauxTotal;

    // Échéancier voté en AG
    if (ag.votedDates.length >= 2) {
      const montantParVersAG = localTotalAvecFT > 0
        ? Math.round((localTotalAvecFT / ag.votedDates.length) * 100) / 100
        : 0;
      setEditableVersements(ag.votedDates.map((d) => ({ date: d, montant: String(montantParVersAG) })));
      setFromAGDates(true);
      setUseEcheancier(true);
      setDateSingle(ag.votedDates[0]);
      setGenDateDebut(ag.votedDates[0]);
      setGenPeriodicite(detectPeriodicite(ag.votedDates));
    } else if (ag.votedDates.length === 1) {
      setEditableVersements([]);
      setFromAGDates(false);
      setUseEcheancier(false);
      setDateSingle(ag.votedDates[0]);
      setGenDateDebut(ag.votedDates[0]);
    } else {
      // Pas de calendrier_financement voté : génération automatique d'un échéancier trimestriel
      const yearStart = `${budgetYear}-01-01`;
      if (localTotalAvecFT > 0 && (hasBudgetPrev || fondsTravauxTotal > 0)) {
        const nb = PERIODICITE_NB['trimestriel'];
        const baseAmount = Math.round((localTotalAvecFT / nb) * 100) / 100;
        setEditableVersements(
          Array.from({ length: nb }, (_, i) => ({
            date: addMonths(yearStart, i * PERIODICITE_MOIS['trimestriel']),
            montant: String(baseAmount),
          }))
        );
        setFromAGDates(false);
        setUseEcheancier(true);
      } else {
        setEditableVersements([]);
        setFromAGDates(false);
        setUseEcheancier(hasBudgetPrev || fondsTravauxTotal > 0);
      }
      setDateSingle(yearStart);
      setGenDateDebut(yearStart);
      setGenPeriodicite('trimestriel');
    }
    setPostesExpanded(false);
  };

  // -- Réinitialiser le choix d'AG -----------------------------
  const resetAG = () => {
    setAgImportee(null);
    setIsExceptionnel(false);
    setTypeAppelExceptionnel('budget_previsionnel');
    setResolutionLieeId('');
    setMontantFondsTravaux(0);
    setMontantFTManuel('');
    setPostes([{ ...POSTE_VIDE }]);
    setEditableVersements([]);
    setFromAGDates(false);
    setDateSingle('');
    setUseEcheancier(false);
    setGenDateDebut('');
    setGenPeriodicite('trimestriel');
    setTitre('');
    setPostesExpanded(false);
  };

  const startExceptionnel = () => {
    resetAG();
    setIsExceptionnel(true);
    setTypeAppelExceptionnel('budget_previsionnel');
    setMontantFTManuel('');
    setTitre('');
    setPostesExpanded(true);
  };

  // -- Générer l'échéancier depuis les contrôles ---------------
  const genererEcheancier = () => {
    if (!genDateDebut) return;
    const nb = PERIODICITE_NB[genPeriodicite] ?? 4;
    const ftEffectif = agImportee ? montantFondsTravaux : (parseFloat(montantFTManuel) || 0);
    const totalAvecFT = montantTotal + ftEffectif;
    const baseAmount = totalAvecFT > 0 ? Math.round((totalAvecFT / nb) * 100) / 100 : 0;
    setEditableVersements(Array.from({ length: nb }, (_, i) => ({
      date: addMonths(genDateDebut, i * PERIODICITE_MOIS[genPeriodicite]),
      montant: String(baseAmount),
    })));
    setFromAGDates(false);
  };

  // -- Calculs -------------------------------------------------
  const totalTantiemsVal = lots.reduce((s, l) => s + (l.tantiemes ?? 0), 0);
  const montantTotal = postes.reduce((s, p) => p.categorie === 'fonds_travaux_alur' ? s : s + (parseFloat(p.montant) || 0), 0);

  // Regrouper les lots par copropriétaire (cumul des tantièmes si multi-lots)
  const repartition = useMemo(() => {
    const map = new Map<string, { copId: string; cop: { id: string; nom: string; prenom: string }; tantiemes: number; lotId: string | null }>();
    for (const lot of lots) {
      if (!lot.coproprietaire) continue;
      const copId = lot.coproprietaire.id;
      if (map.has(copId)) {
        const e = map.get(copId)!;
        e.tantiemes += lot.tantiemes ?? 0;
        e.lotId = null; // plusieurs lots → pas de lot_id unique
      } else {
        map.set(copId, { copId, cop: lot.coproprietaire, tantiemes: lot.tantiemes ?? 0, lotId: lot.id });
      }
    }
    return repartirMontant(montantTotal, Array.from(map.values()));
  }, [lots, montantTotal, totalTantiemsVal]); // eslint-disable-line react-hooks/exhaustive-deps

  const typeAppel = isExceptionnel ? typeAppelExceptionnel
    : agImportee?.resolutions.find((r) => r.id === resolutionLieeId)?.type_resolution ?? 'exceptionnel';

  const finalDatesCount = useEcheancier ? editableVersements.length : 1;

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

    // Pour les appels sans AG (migration), le montant FT vient du champ manuel
    const ftEffectif = agImportee ? montantFondsTravaux : (parseFloat(montantFTManuel) || 0);

    const finalVersements = useEcheancier
      ? editableVersements
      : (dateSingle ? [{ date: dateSingle, montant: String(montantTotal + ftEffectif) }] : []);

    if (finalVersements.length === 0 || finalVersements.some((v) => !v.date)) {
      setError("Renseignez toutes les dates de versement.");
      setLoading(false);
      return;
    }
    if (useEcheancier && finalVersements.some((v) => !(parseFloat(v.montant) > 0))) {
      setError("Renseignez un montant positif pour chaque versement.");
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = new Date().toISOString().slice(0, 10);
    const isPast = (date: string) => date < today;

    if (finalVersements.length > 1) {
      const totalPlan = finalVersements.reduce((s, v) => s + (parseFloat(v.montant) || 0), 0);
      for (let i = 0; i < finalVersements.length; i++) {
        const vers = finalVersements[i];
        const versAmount = parseFloat(vers.montant) || 0;
        const shareRatio = totalPlan > 0 ? versAmount / totalPlan : 1 / finalVersements.length;
        const { error: err, data: inserted } = await supabase
          .from('appels_de_fonds')
          .insert({
            copropriete_id: coproprieteId,
            titre: `${titre.trim()} — ${i + 1}/${finalVersements.length}`,
            montant_total: versAmount,
            montant_fonds_travaux: ftEffectif > 0
              ? Math.round((ftEffectif * shareRatio) * 100) / 100
              : 0,
            date_echeance: vers.date,
            description: JSON.stringify(postesValides.map((p) => ({
              ...p, montant: String(Math.round(parseFloat(p.montant) * shareRatio * 100) / 100),
            }))),
            ag_resolution_id: resolutionLieeId || null,
            type_appel: typeAppel,
            statut: 'brouillon',
            created_by: user.id,
          })
          .select('id')
          .single();

        if (err) { setError(`Erreur versement ${i + 1} : ${err.message}`); setLoading(false); return; }

        // Appel dans le passé → import automatique (lignes payées, sans e-mail)
        if (inserted?.id && isPast(vers.date)) {
          await fetch(`/api/appels-de-fonds/${inserted.id}/importer`, { method: 'POST' });
        }
      }
    } else {
      const { error: err, data: inserted } = await supabase
        .from('appels_de_fonds')
        .insert({
          copropriete_id: coproprieteId,
          titre: titre.trim(),
          montant_total: montantTotal + ftEffectif,
          montant_fonds_travaux: ftEffectif,
          date_echeance: finalVersements[0].date,
          description: JSON.stringify(postesValides),
          ag_resolution_id: resolutionLieeId || null,
          type_appel: typeAppel,
          statut: 'brouillon',
          created_by: user.id,
        })
        .select('id')
        .single();

      if (err) { setError('Erreur : ' + err.message); setLoading(false); return; }

      // Appel dans le passé → import automatique (lignes payées, sans e-mail)
      if (inserted?.id && isPast(finalVersements[0].date)) {
        await fetch(`/api/appels-de-fonds/${inserted.id}/importer`, { method: 'POST' });
      }
    }

    close();
    // Log événement (fire-and-forget, politique RLS INSERT authés)
    if (user.email) {
      const nb = finalVersements.length;
      void Promise.resolve(
        supabase.from('user_events').insert({
          user_email: user.email.toLowerCase(),
          event_type: 'appel_fonds_created',
          label: `${nb} appel${nb > 1 ? 's' : ''} de fonds créé${nb > 1 ? 's' : ''} — ${titre.trim()}`,
        }),
      ).catch(() => undefined);
    }
    router.refresh();
  };

  const close = () => {
    setIsOpen(false);
    resetAG();
    setIsExceptionnel(false);
    setTypeAppelExceptionnel('budget_previsionnel');
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
                <AlertTriangle size={12} className="text-amber-700" />
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
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 space-y-3">
                  {/* En-tête */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle size={14} className="text-amber-600 shrink-0" />
                      <span className="text-xs font-medium text-amber-800">Appel sans AG</span>
                    </div>
                    <button type="button" onClick={resetAG}
                      className="text-xs text-amber-600 hover:text-amber-900 underline underline-offset-2">
                      Annuler
                    </button>
                  </div>

                  {/* Type + champ FT sur la même ligne */}
                  <div className="flex flex-wrap items-end gap-3">
                    {/* Sélecteur de type */}
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-medium text-amber-700">Type</span>
                      <div className="flex gap-1.5">
                        {([
                          { value: 'budget_previsionnel', label: 'Provisions' },
                          { value: 'exceptionnel',        label: 'Exceptionnel' },
                        ] as const).map((opt) => (
                          <button key={opt.value} type="button"
                            onClick={() => { setTypeAppelExceptionnel(opt.value); setMontantFTManuel(''); }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                              typeAppelExceptionnel === opt.value
                                ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                                : 'bg-white text-amber-700 border-amber-300 hover:border-amber-500'
                            }`}>
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Champ FT inline — uniquement pour provisions */}
                    {typeAppelExceptionnel === 'budget_previsionnel' && (
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-amber-700">
                          Dont fonds travaux ALUR
                          <span className="font-normal text-amber-500 ml-1">(optionnel)</span>
                        </span>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number" min="0" step="0.01" placeholder="0,00"
                            value={montantFTManuel}
                            onChange={(e) => setMontantFTManuel(e.target.value)}
                            className="w-28 rounded-lg border border-amber-200 bg-white px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                          />
                          <span className="text-xs text-amber-600">€</span>
                        </div>
                      </div>
                    )}
                  </div>
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
                    {fromAGDates && editableVersements.length > 0 && (
                      <span className="text-xs text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full font-medium">
                        importé de l&apos;AG · modifiable
                      </span>
                    )}
                  </div>
                  <label className="flex items-center gap-1.5 cursor-pointer select-none shrink-0">
                    <input type="checkbox" checked={useEcheancier}
                      onChange={(e) => {
                        setUseEcheancier(e.target.checked);
                        if (!e.target.checked) setEditableVersements([]);
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
                      {editableVersements.length > 0 ? (
                        /* Liste éditable des versements */
                        <div className="space-y-2">
                          <div className="hidden sm:grid grid-cols-[6rem_1fr_7rem_1.5rem] gap-2 text-xs text-gray-400 px-1">
                            <span /><span>Date</span><span className="text-right">Montant (€)</span><span />
                          </div>
                          {editableVersements.map((v, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <span className="text-xs text-gray-500 shrink-0 w-24">Versement {i + 1}</span>
                              <input
                                type="date"
                                value={v.date}
                                onChange={(e) => setEditableVersements((prev) => prev.map((x, j) => j === i ? { ...x, date: e.target.value } : x))}
                                className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={v.montant}
                                onChange={(e) => setEditableVersements((prev) => prev.map((x, j) => j === i ? { ...x, montant: e.target.value } : x))}
                                className="w-28 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="0,00"
                              />
                              {editableVersements.length > 1 && (
                                <button type="button"
                                  onClick={() => setEditableVersements((prev) => prev.filter((_, j) => j !== i))}
                                  className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          ))}
                          <div className="flex items-center justify-between pt-1">
                            <button type="button"
                              onClick={() => {
                                const last = editableVersements[editableVersements.length - 1];
                                const lastDate = last?.date || genDateDebut || '';
                                setEditableVersements((prev) => [...prev, {
                                  date: lastDate ? addMonths(lastDate, PERIODICITE_MOIS[genPeriodicite]) : '',
                                  montant: last?.montant ?? '',
                                }]);
                              }}
                              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1">
                              <Plus size={13} /> Ajouter un versement
                            </button>
                            {editableVersements.length > 1 && (
                              <span className="text-xs text-gray-500 tabular-nums">
                                Total : <span className="font-semibold text-gray-700">{formatEuros(editableVersements.reduce((s, v) => s + (parseFloat(v.montant) || 0), 0))}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        /* Générateur automatique */
                        <div className="bg-gray-50 rounded-xl p-3 space-y-3">
                          <p className="text-xs text-gray-500">Définissez l&apos;échéancier automatiquement, puis modifiez les dates si besoin.</p>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">1er versement</label>
                              <input type="date" value={genDateDebut}
                                onChange={(e) => setGenDateDebut(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Périodicité</label>
                              <select value={genPeriodicite}
                                onChange={(e) => setGenPeriodicite(e.target.value as typeof genPeriodicite)}
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                <option value="mensuel">Mensuel (12×)</option>
                                <option value="trimestriel">Trimestriel (4×)</option>
                                <option value="semestriel">Semestriel (2×)</option>
                                <option value="annuel">Annuel (1×)</option>
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

              {/* ── Aperçu répartition ──────────────────────── */}
              {montantTotal > 0 && repartition.length > 0 && (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <button type="button" onClick={() => setRepartitionExpanded((v) => !v)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors">
                    <span className="text-sm font-semibold text-gray-700">Répartition</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {repartition.length} copropriétaire{repartition.length > 1 ? 's' : ''}
                        {finalDatesCount > 1 && ` · ${finalDatesCount} versements`}
                      </span>
                      {repartitionExpanded
                        ? <ChevronUp size={16} className="text-gray-400" />
                        : <ChevronDown size={16} className="text-gray-400" />}
                    </div>
                  </button>
                  {repartitionExpanded && (
                    <table className="w-full text-xs border-t border-gray-200">
                      <tbody>
                        {repartition.map((r) => (
                          <tr key={r.copId} className="border-t border-gray-100 hover:bg-gray-50">
                            <td className="px-4 py-2 font-medium text-gray-700">
                              {r.cop.prenom} {r.cop.nom}
                            </td>
                            <td className="px-4 py-2 text-right font-bold text-gray-800 tabular-nums">
                              {formatEuros(r.montant)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {error && <p className="text-sm text-red-600">{error}</p>}

              {/* Bandeau appels passés */}
              {(() => {
                const today = new Date().toISOString().slice(0, 10);
                const finalDates = useEcheancier
                  ? editableVersements.map((v) => v.date)
                  : dateSingle ? [dateSingle] : [];
                const pastCount = finalDates.filter((d) => d && d < today).length;
                if (pastCount === 0) return null;
                return (
                  <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-xs text-blue-800">
                    <CheckCircle size={14} className="text-blue-500 shrink-0 mt-0.5" />
                    <span>
                      {pastCount === finalDates.length
                        ? 'Tous les versements sont dans le passé'
                        : `${pastCount} versement${pastCount > 1 ? 's' : ''} dans le passé`}
                      {' '}— les paiements seront automatiquement validés (sans notification).
                      Vous pourrez décocher les copropriétaires qui n&apos;ont pas encore payé.
                    </span>
                  </div>
                );
              })()}

              <div className="flex gap-3 pt-1">
                <Button type="submit" loading={loading}>
                  {finalDatesCount > 1 ? `Enregistrer ${finalDatesCount} appels` : 'Enregistrer'}
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
