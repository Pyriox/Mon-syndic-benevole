// ============================================================
// Client Component : Wizard 2 étapes pour créer une AG
// Étape 1 : infos de base   |   Étape 2 : ordre du jour
// ============================================================
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import { logCurrentUserEvent } from '@/lib/actions/log-user-event';
import { collectAvailableRepartitionGroups, formatEuros, getDefaultFundingCallDate, toParisISOString } from '@/lib/utils';
import {
  Plus, AlertTriangle, Video, Calendar, Zap,
  ChevronDown, ChevronUp, Trash2, Users, Check,
} from 'lucide-react';

interface Copropriete { id: string; nom: string; }
interface AGActionsProps { coproprietes: Copropriete[]; showLabel?: boolean; specialChargesEnabled?: boolean; }

// -------------------------------------------------------
// Types du wizard
// -------------------------------------------------------
type WizardStep = 1 | 2;

type WizardBudgetPoste = {
  libelle: string;
  montant: string;
  repartition_type?: 'generale' | 'groupe';
  repartition_cible?: string;
};

const EMPTY_BUDGET_POSTE: WizardBudgetPoste = {
  libelle: '',
  montant: '',
  repartition_type: 'generale',
  repartition_cible: '',
};

interface WizardResolution {
  id: string;
  numero: number;
  titre: string;
  description: string | null;
  majorite: string;
  type_resolution: string | null;
  optional: boolean;
  inclure: boolean;
  hasBudget: boolean;
  hasFondsTravaux: boolean;
  isDesignation: boolean;
  hasEcheancier?: boolean;
  budgetPostes: WizardBudgetPoste[];
  fondsTravaux: string;
  echeancierDates: string[];
  expanded: boolean;
}

// -------------------------------------------------------
// Templates de résolutions
// -------------------------------------------------------
function buildOrdinaryTemplates(referenceYear: number): Omit<WizardResolution, 'inclure' | 'budgetPostes' | 'fondsTravaux' | 'expanded' | 'echeancierDates'>[] {
  const currentExerciseYear = referenceYear;
  const previousExerciseYear = referenceYear - 1;
  const nextExerciseYear = referenceYear + 1;

  return [
    { id: 'r1', numero: 1, titre: 'Désignation du président de séance',
      description: "Élu par l'assemblée pour diriger les débats. Le syndic ne peut être président.",
      majorite: 'article_24', type_resolution: 'president_seance', optional: false, hasBudget: false, hasFondsTravaux: false, isDesignation: true },
    { id: 'r2', numero: 2, titre: 'Désignation du secrétaire de séance',
      description: 'Chargé de rédiger le procès-verbal. Souvent le syndic.',
      majorite: 'article_24', type_resolution: 'secretaire_seance', optional: false, hasBudget: false, hasFondsTravaux: false, isDesignation: true },
    { id: 'r3', numero: 3, titre: 'Désignation du ou des scrutateurs',
      description: 'Contrôlent les votes et la feuille de présence. Peuvent être copropriétaires ou mandataires.',
      majorite: 'article_24', type_resolution: 'scrutateurs', optional: false, hasBudget: false, hasFondsTravaux: false, isDesignation: true },
    { id: 'r4', numero: 4, titre: `Approbation des comptes de l'exercice ${previousExerciseYear}`,
      description: `Validation des comptes de gestion de la copropriété pour l'exercice ${previousExerciseYear}.`,
      majorite: 'article_24', type_resolution: 'approbation_comptes', optional: false, hasBudget: false, hasFondsTravaux: false, isDesignation: false },
    { id: 'r5', numero: 5, titre: 'Quitus au syndic',
      description: `Les copropriétaires approuvent la gestion du syndic pour l'exercice ${previousExerciseYear}.`,
      majorite: 'article_24', type_resolution: 'quitus_syndic', optional: false, hasBudget: false, hasFondsTravaux: false, isDesignation: false },
    { id: 'r6', numero: 6, titre: `Révision du budget prévisionnel ${currentExerciseYear}`,
      description: `Ajustement facultatif du budget de l'exercice ${currentExerciseYear}. Indiquez les postes modifiés si nécessaire.`,
      majorite: 'article_24', type_resolution: 'revision_budget', optional: true, hasBudget: true, hasFondsTravaux: false, isDesignation: false },
    { id: 'r7', numero: 7, titre: `Vote du budget prévisionnel ${nextExerciseYear}`,
      description: `Budget pour les dépenses courantes de l'exercice ${nextExerciseYear}. Détaillez les postes par ligne.`,
      majorite: 'article_24', type_resolution: 'budget_previsionnel', optional: false, hasBudget: true, hasFondsTravaux: false, isDesignation: false },
    { id: 'r8', numero: 8, titre: `Cotisation au fonds de travaux (ALUR) ${nextExerciseYear}`,
      description: `Cotisation obligatoire pour l'exercice ${nextExerciseYear}. Minimum recommandé : 5 % du budget prévisionnel.`,
      majorite: 'article_25', type_resolution: 'fonds_travaux', optional: false, hasBudget: false, hasFondsTravaux: true, isDesignation: false },
    { id: 'r9', numero: 9, titre: 'Autorisation de travaux sur parties communes',
      description: "Vote d'autorisation et de financement de travaux sur les parties communes (hors entretien courant déjà budgété). Détaillez les postes et le montant estimatif.",
      majorite: 'article_25', type_resolution: null, optional: true, hasBudget: true, hasFondsTravaux: false, isDesignation: false },
    { id: 'r10', numero: 10, titre: `Calendrier de financement ${nextExerciseYear} (budget prévisionnel + fonds travaux)`,
      description: `Dates auxquelles les appels de fonds de l'exercice ${nextExerciseYear} seront émis suite aux votes du budget et du fonds de travaux. Au moins une date requise.`,
      majorite: 'article_24', type_resolution: 'calendrier_financement', optional: false, hasBudget: false, hasFondsTravaux: false, isDesignation: false, hasEcheancier: true },
    { id: 'r11', numero: 11, titre: 'Désignation ou renouvellement du syndic',
      description: 'Facultatif, mais conseillé si le mandat arrive à échéance. Précisez ensuite la date de fin du nouveau mandat.',
      majorite: 'article_25', type_resolution: 'designation_syndic', optional: true, hasBudget: false, hasFondsTravaux: false, isDesignation: true },
    { id: 'r12', numero: 12, titre: 'Désignation ou renouvellement du conseil syndical',
      description: 'Élection des membres du conseil syndical. Facultatif.',
      majorite: 'article_24', type_resolution: 'conseil_syndical', optional: true, hasBudget: false, hasFondsTravaux: false, isDesignation: true },
  ];
}

function initResolutions(type: 'ordinaire' | 'exceptionnelle', referenceYear: number): WizardResolution[] {
  const templates = type === 'ordinaire'
    ? buildOrdinaryTemplates(referenceYear)
    : buildOrdinaryTemplates(referenceYear).slice(0, 3);

  return templates.map((t) => ({
    ...t,
    inclure: !t.optional || t.type_resolution === 'designation_syndic',
    budgetPostes: t.hasBudget ? [{ ...EMPTY_BUDGET_POSTE }] : [],
    fondsTravaux: '',
    echeancierDates: t.hasEcheancier ? [''] : [],
    expanded: t.hasBudget || t.hasFondsTravaux || !!t.hasEcheancier,
  }));
}

const MAJORITE_CHIPS: Record<string, string> = {
  article_24: 'Art. 24',
  article_25: 'Art. 25 + 25-1',
  article_26: 'Art. 26',
};

// -------------------------------------------------------
// Composant principal
// -------------------------------------------------------
export default function AGActions({ coproprietes, showLabel, specialChargesEnabled = true }: AGActionsProps) {
  const router = useRouter();
  const supabase = createClient();

  const [isOpen,      setIsOpen]      = useState(false);
  const [wizardStep,  setWizardStep]  = useState<WizardStep>(1);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');

  // -- Étape 1 --
  const [typeAG,     setTypeAG]     = useState<'ordinaire' | 'exceptionnelle'>('ordinaire');
  const [isVisio,    setIsVisio]    = useState(false);
  const [dateVal,    setDateVal]    = useState('');
  const [heureVal,   setHeureVal]   = useState('09');
  const [minuteVal,  setMinuteVal]  = useState('00');
  const [formData,   setFormData]   = useState({
    copropriete_id: coproprietes[0]?.id ?? '',
    titre: '',
    date_ag: '',
    lieu: '',
    notes: '',
  });

  // -- Étape 2 --
  const [resolutions, setResolutions] = useState<WizardResolution[]>([]);
  const [availableRepartitionGroups, setAvailableRepartitionGroups] = useState<string[]>([]);

  useEffect(() => {
    if (!isOpen || !formData.copropriete_id) return;

    const loadGroups = async () => {
      const { data: lots } = await supabase
        .from('lots')
        .select('id, tantiemes, coproprietaire_id, batiment, groupes_repartition, tantiemes_groupes')
        .eq('copropriete_id', formData.copropriete_id);

      setAvailableRepartitionGroups(collectAvailableRepartitionGroups((lots ?? []).map((lot) => ({
        ...lot,
        coproprietaire_id: lot.coproprietaire_id ?? null,
        batiment: lot.batiment ?? null,
        groupes_repartition: lot.groupes_repartition ?? [],
      }))));
    };

    void loadGroups();
  }, [formData.copropriete_id, isOpen, supabase]);

  // -- Helpers --
  const updateDateTime = (d: string, h: string, m: string) =>
    setFormData((p) => ({ ...p, date_ag: d ? `${d}T${h}:${m}` : '' }));

  const joursAvantAG = formData.date_ag
    ? Math.ceil((new Date(formData.date_ag).getTime() - Date.now()) / 86400000)
    : null;
  const avertissementDelai = joursAvantAG !== null && joursAvantAG >= 0 && joursAvantAG < 21;
  const datePassee = joursAvantAG !== null && joursAvantAG < 0;
  const titreFinal = typeAG === 'ordinaire'
    ? `Assemblée Générale Ordinaire ${dateVal ? new Date(dateVal).getFullYear() : new Date().getFullYear()}`
    : formData.titre.trim();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));

  const updateResolution = (id: string, changes: Partial<WizardResolution>) =>
    setResolutions((prev) => prev.map((r) => r.id === id ? { ...r, ...changes } : r));

  const totalBudget = resolutions
    .filter((r) => r.inclure && r.hasBudget && r.id !== 'r9')
    .flatMap((r) => r.budgetPostes)
    .reduce((s, p) => s + (parseFloat(p.montant) || 0), 0);
  const hasLockedSpecialBudget = !specialChargesEnabled && resolutions.some((resolution) =>
    resolution.inclure && resolution.budgetPostes.some((poste) => poste.repartition_type === 'groupe' && Boolean(poste.repartition_cible))
  );

  // -- Navigation --
  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    const planningYear = dateVal ? new Date(dateVal).getFullYear() : new Date().getFullYear();
    const initialized = initResolutions(typeAG, planningYear).map((r) =>
      r.hasEcheancier ? { ...r, echeancierDates: [getDefaultFundingCallDate([], dateVal)] } : r
    );
    setResolutions(initialized);
    setWizardStep(2);
  };

  // -- Soumission finale --
  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    if (!specialChargesEnabled && resolutions.some((resolution) =>
      resolution.inclure && resolution.budgetPostes.some((poste) => poste.repartition_type === 'groupe' && Boolean(poste.repartition_cible))
    )) {
      setError('Activez l’option Charges spéciales pour enregistrer un budget d’AG avec clé spéciale.');
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const lieu = isVisio ? 'Visioconférence' : formData.lieu.trim() || null;

    const { data: ag, error: dbError } = await supabase
      .from('assemblees_generales')
      .insert({
        copropriete_id: formData.copropriete_id,
        titre: titreFinal,
        date_ag: toParisISOString(dateVal, heureVal, minuteVal),
        lieu,
        notes: formData.notes.trim() || null,
        statut: 'creation',
        quorum_atteint: false,
        created_by: user.id,
      })
      .select('id')
      .single();

    if (dbError || !ag) {
      setError('Erreur : ' + dbError?.message);
      setLoading(false);
      return;
    }

    const toInsert = resolutions
      .filter((r) => r.inclure)
      .map((r, idx) => {
        const postesValides = r.hasBudget
          ? r.budgetPostes
              .filter((p) => p.libelle.trim())
              .map((p) => ({
                libelle: p.libelle.trim(),
                montant: parseFloat(p.montant) || 0,
                repartition_type: p.repartition_type === 'groupe' ? 'groupe' : 'generale',
                repartition_cible: p.repartition_type === 'groupe' ? (p.repartition_cible || null) : null,
              }))
          : r.hasEcheancier
            ? r.echeancierDates.filter((d) => d.trim()).map((d) => ({ libelle: d, montant: 0 }))
            : [];
        return {
          ag_id: ag.id,
          numero: idx + 1,
          titre: r.titre,
          description: r.description,
          majorite: r.majorite || null,
          statut: 'en_attente',
          voix_pour: 0,
          voix_contre: 0,
          voix_abstention: 0,
          type_resolution: r.type_resolution,
          budget_postes: postesValides.length > 0 ? postesValides : null,
          fonds_travaux_montant: r.hasFondsTravaux && r.fondsTravaux ? parseFloat(r.fondsTravaux) : null,
        };
      });

    if (toInsert.length > 0) {
      await supabase.from('resolutions').insert(toInsert);
    }

    // Log événement (fire-and-forget via action serveur)
    void logCurrentUserEvent({
      eventType: 'ag_created',
      label: `AG créée — ${titreFinal}`,
    }).catch(() => undefined);

    const createdAgId = ag.id;
    resetAndClose();
    router.push(`/assemblees/${createdAgId}`);
  };

  const resetAndClose = () => {
    setIsOpen(false);
    setWizardStep(1);
    setTypeAG('ordinaire');
    setIsVisio(false);
    setDateVal('');
    setHeureVal('09');
    setMinuteVal('00');
    setFormData({ copropriete_id: coproprietes[0]?.id ?? '', titre: '', date_ag: '', lieu: '', notes: '' });
    setResolutions([]);
    setError('');
    setLoading(false);
  };

  const includedCount = resolutions.filter((r) => r.inclure).length;

  // ======================================================
  return (
    <>
      <Button onClick={() => setIsOpen(true)} size={showLabel ? 'md' : 'sm'}>
        <Plus size={16} /> {showLabel ? 'Créer le brouillon d’AG' : 'Nouvelle AG'}
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={resetAndClose}
        title={wizardStep === 1
          ? "Créer le brouillon d'une Assemblée Générale"
          : `Ordre du jour du brouillon — ${includedCount} résolution(s)`}
        size="xl"
      >
        {/* ==================== ÉTAPE 1 ==================== */}
        {wizardStep === 1 && (
          <form onSubmit={handleNextStep} className="space-y-3">

            {/* Type d'AG */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Type d’assemblée générale</p>
              <div className="grid grid-cols-2 gap-2">
                <button type="button"
                  onClick={() => setTypeAG('ordinaire')}
                  className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                    typeAG === 'ordinaire' ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}>
                  <Calendar size={14} /> AG Ordinaire
                </button>
                <button type="button"
                  onClick={() => setTypeAG('exceptionnelle')}
                  className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                    typeAG === 'exceptionnelle' ? 'bg-amber-50 border-amber-300 text-amber-700' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}>
                  <Zap size={14} /> AG Exceptionnelle
                </button>
              </div>
              {typeAG === 'exceptionnelle' && (
                <div className="mt-2 flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                  <AlertTriangle size={13} className="shrink-0 mt-0.5 text-amber-600" />
                  <span>Convoquée en dehors du calendrier annuel pour un point urgent. Seules 3 résolutions de bureau seront pré-remplies — vous ajouterez l’objet spécifique ensuite.</span>
                </div>
              )}
            </div>

            {typeAG === 'exceptionnelle' && (
              <Input
                label="Titre de l'AG"
                name="titre"
                value={formData.titre}
                onChange={handleChange}
                placeholder="AG Extraordinaire – Travaux toiture"
                required
              />
            )}

            {/* Date & heure */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date et heure prévisionnelles <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="flex gap-2">
                <input type="date" value={dateVal}
                  onChange={(e) => { setDateVal(e.target.value); updateDateTime(e.target.value, heureVal, minuteVal); }}
                  required
                  className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-400 transition-colors"
                />
                <select value={heureVal}
                  onChange={(e) => { setHeureVal(e.target.value); updateDateTime(dateVal, e.target.value, minuteVal); }}
                  className="w-[5.5rem] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map((h) => (
                    <option key={h} value={h}>{h}h</option>
                  ))}
                </select>
                <select value={minuteVal}
                  onChange={(e) => { setMinuteVal(e.target.value); updateDateTime(dateVal, heureVal, e.target.value); }}
                  className="w-[5.5rem] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {['00','05','10','15','20','25','30','35','40','45','50','55'].map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              {datePassee && (
                <div className="mt-2 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                  <AlertTriangle size={15} className="shrink-0 mt-0.5 text-red-500" />
                  <span>
                    <strong>Date passée :</strong> la date sélectionnée est antérieure à aujourd’hui.
                  </span>
                </div>
              )}
              {avertissementDelai && (
                <div className="mt-2 flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                  <AlertTriangle size={15} className="shrink-0 mt-0.5 text-amber-700" />
                  <span>
                    <strong>Délai insuffisant :</strong> la convocation doit être envoyée au moins 21 jours avant l’AG (art. 9 décret 17/03/1967).
                    Actuellement : <strong>{joursAvantAG} jour{joursAvantAG! > 1 ? 's' : ''}</strong> restant{joursAvantAG! > 1 ? 's' : ''}.
                  </span>
                </div>
              )}
            </div>

            {/* Lieu */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lieu</label>
              <div className="flex items-center gap-3 mb-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={isVisio} onChange={(e) => setIsVisio(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  <Video size={14} className="text-blue-500" />
                  <span className="text-sm text-gray-700">Visioconférence</span>
                </label>
              </div>
              {!isVisio && (
                <Input name="lieu" value={formData.lieu} onChange={handleChange}
                  placeholder="Salle des fêtes, 12 rue de la Paix, Paris" />
              )}
            </div>

            <Textarea label="Notes / Ordre du jour complémentaire" name="notes"
              value={formData.notes} onChange={handleChange} rows={2}
              placeholder="Informations complémentaires pour la convocation..." />

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex gap-3 pt-1">
              <Button type="submit">Suivant — Configurer l’ordre du jour</Button>
              <Button type="button" variant="secondary" onClick={resetAndClose}>Annuler</Button>
            </div>
          </form>
        )}

        {/* ==================== ÉTAPE 2 ==================== */}
        {wizardStep === 2 && (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              {typeAG === 'ordinaire'
                ? "Vérifiez et complétez chaque résolution. Les désignations se feront lors du vote en sélectionnant les copropriétaires présents."
                : "Configurez les résolutions de bureau. Ajoutez les résolutions spécifiques depuis la page de l'AG."}
            </p>

            {/* Numérotation dynamique selon les résolutions incluses */}
            {(() => {
              let counter = 0;
              const effectiveNumeros: Record<string, number> = {};
              resolutions.forEach((r) => { if (r.inclure) effectiveNumeros[r.id] = ++counter; });

              return (
            <div className="space-y-2 max-h-[52vh] overflow-y-auto pr-1">
              {resolutions.map((r) => (
                <div key={r.id} className={`rounded-xl border transition-colors overflow-hidden ${
                  !r.inclure           ? 'border-gray-200 bg-gray-50 opacity-60'
                  : r.hasBudget        ? 'border-indigo-200 bg-indigo-50'
                  : r.hasFondsTravaux  ? 'border-amber-200 bg-amber-50'
                  : r.hasEcheancier    ? 'border-green-200 bg-green-50'
                  : r.isDesignation    ? 'border-blue-200 bg-blue-50'
                  : 'border-slate-200 bg-slate-50'
                }`}>

                  {/* -- En-tête de la résolution -- */}
                  <div className="flex items-start justify-between px-4 py-3 gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                          !r.inclure ? 'bg-gray-200 text-gray-400'
                          : r.hasBudget ? 'bg-indigo-100 text-indigo-500'
                          : r.hasFondsTravaux ? 'bg-amber-100 text-amber-600'
                          : r.hasEcheancier ? 'bg-green-100 text-green-600'
                          : r.isDesignation ? 'bg-blue-100 text-blue-500'
                          : 'bg-slate-200 text-slate-500'
                        }`}>{r.inclure ? `#${effectiveNumeros[r.id]}` : `#${r.numero}`}</span>
                        <span className={`text-sm font-semibold ${!r.inclure ? 'text-gray-400' : 'text-gray-800'}`}>{r.titre}</span>
                        {r.majorite && (
                          <span className={`text-[11px] px-1.5 py-0.5 rounded font-mono font-medium ${
                            r.majorite === 'article_25' ? 'bg-orange-100 text-orange-600'
                            : r.majorite === 'article_26' ? 'bg-red-100 text-red-600'
                            : 'bg-slate-100 text-slate-500'
                          }`}>
                            {MAJORITE_CHIPS[r.majorite] ?? r.majorite}
                          </span>
                        )}
                      </div>
                      {r.description && r.inclure && (
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">{r.description}</p>
                      )}
                    </div>

                    {/* Contrôles droite */}
                    <div className="flex items-center gap-2 ml-2 shrink-0">
                      {!r.optional ? (
                        <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-100 px-2 py-0.5 rounded-full">Obligatoire</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => updateResolution(r.id, { inclure: !r.inclure, expanded: !r.inclure && (r.hasBudget || r.hasFondsTravaux) })}
                          className="flex items-center gap-1.5 cursor-pointer"
                        >
                          <span className={`text-[11px] font-medium ${r.inclure ? 'text-blue-600' : 'text-gray-400'}`}>{r.inclure ? 'Inclus' : 'Exclu'}</span>
                          <div className={`relative w-9 h-5 rounded-full transition-colors ${r.inclure ? 'bg-blue-500' : 'bg-gray-300'}`}>
                            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${r.inclure ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
                          </div>
                        </button>
                      )}
                      {(r.hasBudget || r.hasFondsTravaux || r.hasEcheancier) && r.inclure && (
                        <button type="button" onClick={() => updateResolution(r.id, { expanded: !r.expanded })}
                          className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                          {r.expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* -- Hint désignation -- */}
                  {r.isDesignation && r.inclure && !r.hasBudget && (
                    <div className="px-4 pb-3">
                      <p className="text-xs text-blue-600 bg-white/70 rounded-lg px-3 py-1.5 flex items-center gap-1.5">
                        <Users size={11} className="shrink-0" />
                        La désignation se fera lors du vote en sélectionnant le copropriétaire désigné parmi les présents.
                      </p>
                    </div>
                  )}

                  {/* -- Calendrier de financement -- */}
                  {r.hasEcheancier && r.inclure && r.expanded && (
                    <div className="px-4 pb-4 border-t border-green-200/60 pt-3">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-semibold text-green-800">
                          Dates d’appel de fonds <span className="text-red-500">*</span>
                          <span className="text-gray-400 font-normal ml-1">(minimum 1 date)</span>
                        </label>
                        <button type="button"
                          onClick={() => updateResolution(r.id, {
                            echeancierDates: [...r.echeancierDates, getDefaultFundingCallDate(r.echeancierDates, dateVal)],
                          })}
                          className="text-xs text-green-600 hover:text-green-800 flex items-center gap-1 font-medium">
                          <Plus size={12} /> Ajouter une date
                        </button>
                      </div>
                      <div className="space-y-1.5 bg-white/60 rounded-lg p-2 border border-green-100">
                        {r.echeancierDates.map((date, i) => {
                          const datePassee = date && new Date(date) < new Date(new Date().toDateString());
                          return (
                            <div key={i} className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 w-20 shrink-0">Versement {i + 1}</span>
                                <input type="date" value={date}
                                  onChange={(e) => updateResolution(r.id, {
                                    echeancierDates: r.echeancierDates.map((d, idx) => idx === i ? e.target.value : d),
                                  })}
                                  className={`flex-1 text-xs rounded-lg border bg-white px-2 py-1.5 focus:outline-none focus:ring-2 ${
                                    datePassee ? 'border-red-300 focus:ring-red-400' : 'border-green-200 focus:ring-green-500'
                                  }`} />
                                {r.echeancierDates.length > 1 && (
                                  <button type="button"
                                    onClick={() => updateResolution(r.id, { echeancierDates: r.echeancierDates.filter((_, idx) => idx !== i) })}
                                    className="p-1 text-green-400 hover:text-red-500 transition-colors">
                                    <Trash2 size={13} />
                                  </button>
                                )}
                              </div>
                              {datePassee && (
                                <p className="text-[11px] text-red-600 flex items-center gap-1 pl-[5.5rem]">
                                  <AlertTriangle size={11} className="shrink-0" /> Date passée
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* -- Fonds de travaux -- */}
                  {r.hasFondsTravaux && r.inclure && r.expanded && (
                    <div className="px-4 pb-4 border-t border-amber-200/60 pt-3">
                      <label className="block text-xs font-semibold text-amber-800 mb-2">
                        Montant de la cotisation fonds de travaux (EUR) <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center gap-3 flex-wrap">
                        <input type="number" min="0" step="0.01" placeholder="0.00"
                          value={r.fondsTravaux}
                          onChange={(e) => updateResolution(r.id, { fondsTravaux: e.target.value })}
                          className="w-44 text-sm rounded-lg border border-amber-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500" />
                        {totalBudget > 0 && (
                          <button type="button"
                            onClick={() => updateResolution(r.id, { fondsTravaux: String((totalBudget * 0.05).toFixed(2)) })}
                            className="text-xs text-amber-700 hover:text-amber-900 underline underline-offset-2">
                            Suggérer 5% du budget ({formatEuros(totalBudget * 0.05)})
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* -- Postes budgétaires -- */}
                  {r.hasBudget && r.inclure && r.expanded && (
                    <div className="px-4 pb-4 border-t border-indigo-200/60 pt-3">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-semibold text-indigo-800">
                          Postes du budget <span className="text-gray-400 font-normal">(vous pouvez compléter plus tard)</span>
                        </label>
                        <button type="button"
                          onClick={() => updateResolution(r.id, { budgetPostes: [...r.budgetPostes, { ...EMPTY_BUDGET_POSTE }] })}
                          className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium">
                          <Plus size={12} /> Ajouter un poste
                        </button>
                      </div>
                      <div className="space-y-1.5 bg-white/60 rounded-lg p-2 border border-indigo-100">
                        <div className={`rounded-lg border bg-white px-3 py-2 text-[11px] ${specialChargesEnabled ? 'border-indigo-100 text-indigo-700' : 'border-amber-200 text-amber-800'}`}>
                          {specialChargesEnabled
                            ? (
                              availableRepartitionGroups.length > 0
                                ? `Charges communes par défaut. Vous pouvez aussi cibler : ${availableRepartitionGroups.join(', ')}.`
                                : 'Charges communes par défaut. Ajoutez d’abord une clé spéciale dans le paramétrage de la copropriété.'
                            )
                            : 'Les clés spéciales sont réservées à l’option payante Charges spéciales. Vous pouvez garder un budget entièrement en charges communes.'}
                        </div>
                        {hasLockedSpecialBudget && (
                          <p className="text-[11px] text-amber-700 px-1">
                            Certaines lignes utilisent encore une clé spéciale. Activez l’option dédiée ou repassez-les en charges communes pour poursuivre.
                          </p>
                        )}
                        {r.budgetPostes.length === 0 && (
                          <p className="text-xs text-gray-400 text-center py-2">Aucun poste — cliquez sur &quot;Ajouter un poste&quot;</p>
                        )}
                        {r.budgetPostes.map((p, i) => (
                          <div key={i} className="grid grid-cols-[1fr_7rem_12rem_auto] gap-1.5 items-center">
                            <input type="text" placeholder="Ex : Gardiennage, Entretien ascenseur..."
                              value={p.libelle}
                              onChange={(e) => updateResolution(r.id, {
                                budgetPostes: r.budgetPostes.map((x, idx) => idx === i ? { ...x, libelle: e.target.value } : x),
                              })}
                              className="text-xs rounded-lg border border-indigo-200 bg-white px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            <input type="number" placeholder="0.00" min="0" step="0.01"
                              value={p.montant}
                              onChange={(e) => updateResolution(r.id, {
                                budgetPostes: r.budgetPostes.map((x, idx) => idx === i ? { ...x, montant: e.target.value } : x),
                              })}
                              className="w-full text-xs rounded-lg border border-indigo-200 bg-white px-2 py-1.5 text-right focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            {((specialChargesEnabled && availableRepartitionGroups.length > 0) || (p.repartition_type === 'groupe' && p.repartition_cible)) ? (
                              <select
                                value={p.repartition_type === 'groupe' && p.repartition_cible ? `groupe:${p.repartition_cible}` : 'generale'}
                                onChange={(e) => updateResolution(r.id, {
                                  budgetPostes: r.budgetPostes.map((x, idx) => idx === i ? {
                                    ...x,
                                    repartition_type: e.target.value.startsWith('groupe:') ? 'groupe' : 'generale',
                                    repartition_cible: e.target.value.startsWith('groupe:') ? e.target.value.slice(7) : '',
                                  } : x),
                                })}
                                className="text-xs rounded-lg border border-indigo-200 bg-white px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              >
                                <option value="generale">Charges communes</option>
                                {p.repartition_type === 'groupe' && p.repartition_cible && (!specialChargesEnabled || !availableRepartitionGroups.includes(p.repartition_cible)) && (
                                  <option value={`groupe:${p.repartition_cible}`}>
                                    {specialChargesEnabled ? p.repartition_cible : `Lecture seule · ${p.repartition_cible}`}
                                  </option>
                                )}
                                {specialChargesEnabled && availableRepartitionGroups.map((group) => (
                                  <option key={group} value={`groupe:${group}`}>{group}</option>
                                ))}
                              </select>
                            ) : (
                              <div className="text-xs rounded-lg border border-indigo-200 bg-indigo-50 px-2 py-1.5 text-indigo-700">
                                Charges communes
                              </div>
                            )}
                            <button type="button"
                              onClick={() => updateResolution(r.id, { budgetPostes: r.budgetPostes.filter((_, idx) => idx !== i) })}
                              className="p-1 text-indigo-400 hover:text-red-500 transition-colors">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))}
                        {r.budgetPostes.some((p) => p.montant) && (
                          <div className="text-right text-xs font-bold text-indigo-700 pt-1.5 border-t border-indigo-100 mt-1">
                            Total : {formatEuros(r.budgetPostes.reduce((s, p) => s + (parseFloat(p.montant) || 0), 0))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
              );
            })()}

            {/* Récapitulatif */}
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs text-gray-600 flex items-center gap-4 flex-wrap">
              <span><strong className="text-gray-800">{includedCount}</strong> résolution(s) à l’ordre du jour</span>
              {totalBudget > 0 && (
                <span>Budget prévisionnel : <strong className="text-indigo-700">{formatEuros(totalBudget)}</strong></span>
              )}
              {resolutions.find((r) => r.hasFondsTravaux && r.inclure && r.fondsTravaux) && (
                <span>Fonds de travaux : <strong className="text-amber-700">
                  {formatEuros(parseFloat(resolutions.find((r) => r.hasFondsTravaux && r.inclure)!.fondsTravaux || '0'))}
                </strong></span>
              )}
              {resolutions.find((r) => r.hasEcheancier && r.inclure && r.echeancierDates.some((d) => d)) && (
                <span>Calendrier : <strong className="text-green-700">
                  {resolutions.find((r) => r.hasEcheancier && r.inclure)!.echeancierDates.filter((d) => d).length} date(s)
                </strong></span>
              )}
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex gap-3 pt-1">
              <Button onClick={handleSubmit} loading={loading}>
                <Check size={15} /> Créer le brouillon d’AG
              </Button>
              <Button type="button" variant="secondary" onClick={() => setWizardStep(1)}>Retour</Button>
              <Button type="button" variant="secondary" onClick={resetAndClose}>Annuler</Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}