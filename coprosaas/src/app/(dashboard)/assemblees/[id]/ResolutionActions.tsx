// ============================================================
// Client Component : Formulaire d'ajout de résolution à une AG
// ============================================================
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { collectAvailableRepartitionGroups, formatEuros, TYPES_RESOLUTION } from '@/lib/utils';

function replaceCurrentRoute(router: ReturnType<typeof useRouter>) {
  if (typeof window === 'undefined') return;
  router.replace(`${window.location.pathname}${window.location.search}`);
}

type PosteBudget = {
  libelle: string;
  montant: number;
  repartition_type?: 'generale' | 'groupe' | null;
  repartition_cible?: string | null;
};

type PosteBudgetForm = {
  libelle: string;
  montant: string;
  repartition_type: 'generale' | 'groupe';
  repartition_cible: string;
};

const EMPTY_BUDGET_POSTE_FORM: PosteBudgetForm = {
  libelle: '',
  montant: '',
  repartition_type: 'generale',
  repartition_cible: '',
};

function mapBudgetPostesToForm(postes?: PosteBudget[] | null): PosteBudgetForm[] {
  return (postes ?? []).map((poste) => ({
    libelle: poste.libelle,
    montant: String(poste.montant),
    repartition_type: poste.repartition_type === 'groupe' ? 'groupe' : 'generale',
    repartition_cible: poste.repartition_cible ?? '',
  }));
}

function buildBudgetPostesPayload(postes: PosteBudgetForm[]): PosteBudget[] {
  return postes
    .filter((poste) => poste.libelle.trim())
    .map((poste) => ({
      libelle: poste.libelle.trim(),
      montant: parseFloat(poste.montant) || 0,
      repartition_type: poste.repartition_type,
      repartition_cible: poste.repartition_type === 'groupe' ? (poste.repartition_cible || null) : null,
    }));
}

interface ResolutionActionsProps {
  agId: string;
  showLabel?: boolean;
  nextNumero?: number;
  specialChargesEnabled?: boolean;
}

const TYPE_OPTIONS = [
  { value: 'libre', label: '— Résolution libre —' },
  { value: 'president_seance',    label: 'Désignation du président de séance' },
  { value: 'secretaire_seance',   label: 'Désignation du secrétaire de séance' },
  { value: 'scrutateurs',         label: 'Désignation des scrutateurs' },
  { value: 'approbation_comptes', label: "Approbation des comptes de l'exercice" },
  { value: 'quitus_syndic',       label: 'Quitus au syndic' },
  { value: 'revision_budget',        label: "Révision du budget de l'exercice en cours" },
  { value: 'revision_fonds_travaux', label: "Révision du fonds de travaux de l'exercice en cours" },
  { value: 'budget_previsionnel',    label: 'Vote du budget prévisionnel' },
  { value: 'fonds_travaux',       label: 'Cotisation fonds de travaux (ALUR)' },
  { value: 'designation_syndic',  label: 'Désignation ou renouvellement du syndic' },
  { value: 'conseil_syndical',    label: 'Désignation ou renouvellement du conseil syndical' },
];

const MAJORITE_OPTIONS = [
  { value: '', label: 'Non défini' },
  { value: 'article_24', label: 'Majorité simple — Art. 24' },
  { value: 'article_25', label: 'Majorité absolue — Art. 25' },
  { value: 'article_26', label: 'Double majorité — Art. 26' },
];

const HINTS: Record<string, string> = {
  president_seance:    '🧑‍⚖️ Un copropriétaire présent sera désigné comme président de séance lors du vote.',
  secretaire_seance:   '📝 Un copropriétaire présent sera désigné comme secrétaire lors du vote.',
  scrutateurs:         '🔍 Un ou plusieurs copropriétaires présents seront désignés scrutateurs lors du vote.',
  approbation_comptes: '📊 Vote pour/contre l\'approbation des comptes de l\'exercice écoulé.',
  quitus_syndic:       '✅ Vote donnant décharge au syndic pour sa gestion.',
  revision_budget:     '🔄 Modification éventuelle du budget en cours — postes modifiables. Une fois à l’ordre du jour, doit être votée.',
  revision_fonds_travaux: '🏗️ Révision du montant du fonds de travaux pour l’année en cours. Une fois à l’ordre du jour, doit être votée.',
  budget_previsionnel: '💰 Vote du budget prévisionnel — à détailler par poste de dépense.',
  fonds_travaux:       '🏗️ Cotisation obligatoire au fonds de travaux (art. L.731-4 ALUR) — indiquer le montant.',
  designation_syndic:  '🏢 Désignation ou renouvellement du syndic — majorité absolue Art. 25 requise.',
  conseil_syndical:    '👥 Désignation ou renouvellement du conseil syndical — facultatif.',
};

export default function ResolutionActions({ agId, showLabel, nextNumero, specialChargesEnabled = true }: ResolutionActionsProps) {
  const router = useRouter();
  const supabase = createClient();

  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [typeResolution, setTypeResolution] = useState('libre');
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    majorite: '',
    statut: 'en_attente',
  });
  const [budgetPostes, setBudgetPostes] = useState<PosteBudgetForm[]>([]);
  const [fondsTravaux, setFondsTravaux] = useState('');
  const [availableRepartitionGroups, setAvailableRepartitionGroups] = useState<string[]>([]);

  const typeConfig = TYPES_RESOLUTION[typeResolution] ?? TYPES_RESOLUTION['libre'];

  useEffect(() => {
    if (!isOpen) return;

    const loadGroups = async () => {
      const { data: ag } = await supabase
        .from('assemblees_generales')
        .select('copropriete_id')
        .eq('id', agId)
        .maybeSingle();

      if (!ag?.copropriete_id) {
        setAvailableRepartitionGroups([]);
        return;
      }

      const { data: lots } = await supabase
        .from('lots')
        .select('id, tantiemes, coproprietaire_id, batiment, groupes_repartition, tantiemes_groupes')
        .eq('copropriete_id', ag.copropriete_id);

      setAvailableRepartitionGroups(collectAvailableRepartitionGroups((lots ?? []).map((lot) => ({
        ...lot,
        coproprietaire_id: lot.coproprietaire_id ?? null,
        batiment: lot.batiment ?? null,
        groupes_repartition: lot.groupes_repartition ?? [],
      }))));
    };

    void loadGroups();
  }, [agId, isOpen, supabase]);

  const handleTypeChange = (newType: string) => {
    setTypeResolution(newType);
    const cfg = TYPES_RESOLUTION[newType];
    if (cfg && newType !== 'libre') {
      setFormData((p) => ({
        ...p,
        titre: cfg.label,
        majorite: cfg.majorite,
      }));
      if (cfg.hasBudget && budgetPostes.length === 0) {
        setBudgetPostes([{ ...EMPTY_BUDGET_POSTE_FORM }]);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const postesValides = typeConfig.hasBudget
      ? buildBudgetPostesPayload(budgetPostes)
      : [];

    if (!specialChargesEnabled && postesValides.some((poste) => poste.repartition_type === 'groupe' && Boolean(poste.repartition_cible))) {
      setError('Activez l’option Charges spéciales pour enregistrer une résolution avec clé spéciale.');
      setLoading(false);
      return;
    }

    const { error: dbError } = await supabase.from('resolutions').insert({
      ag_id: agId,
      numero: nextNumero ?? 1,
      titre: formData.titre.trim(),
      description: formData.description.trim() || null,
      majorite: formData.majorite || null,
      statut: formData.statut,
      voix_pour: 0,
      voix_contre: 0,
      voix_abstention: 0,
      type_resolution: typeResolution === 'libre' ? null : typeResolution,
      budget_postes: postesValides.length > 0 ? postesValides : null,
      fonds_travaux_montant: typeConfig.hasFondsTravaux && fondsTravaux ? parseFloat(fondsTravaux) : null,
    });

    if (dbError) {
      setError('Erreur : ' + dbError.message);
      setLoading(false);
      return;
    }

    setIsOpen(false);
    setTypeResolution('libre');
    setFormData({ titre: '', description: '', majorite: '', statut: 'en_attente' });
    setBudgetPostes([]);
    setFondsTravaux('');
    replaceCurrentRoute(router);
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)} size="sm">
        <Plus size={14} /> {showLabel ? 'Ajouter une résolution' : 'Ajouter'}
      </Button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Ajouter une résolution" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Type prédéfini */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type de résolution</label>
            <select
              value={typeResolution}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            {typeResolution !== 'libre' && HINTS[typeResolution] && (
              <p className="mt-1.5 text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2">{HINTS[typeResolution]}</p>
            )}
          </div>

          <Input label="Titre" name="titre" value={formData.titre} onChange={handleChange} placeholder="Titre de la résolution" required />

          <div className="grid grid-cols-2 gap-3">
            <Select label="Statut" name="statut" value={formData.statut} onChange={handleChange}
              options={[
                { value: 'en_attente', label: 'En attente' },
                { value: 'approuvee', label: 'Approuvée' },
                { value: 'refusee', label: 'Refusée' },
                { value: 'reportee', label: 'Reportée' },
              ]}
            />
            <Select label="Type de majorité" name="majorite" value={formData.majorite} onChange={handleChange} options={MAJORITE_OPTIONS} />
          </div>

          <Textarea label="Description (optionnel)" name="description" value={formData.description} onChange={handleChange} rows={2} />

          {/* Fonds travaux */}
          {typeConfig.hasFondsTravaux && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Montant de la cotisation (€) <span className="text-red-500">*</span></label>
              <input
                type="number" min="0" step="0.01" placeholder="0.00"
                value={fondsTravaux} onChange={(e) => setFondsTravaux(e.target.value)}
                className="w-48 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          )}

          {/* Postes budgétaires */}
          {typeConfig.hasBudget && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Postes de dépenses {typeConfig.optional ? '(optionnel)' : <span className="text-red-500">*</span>}</label>
                <button type="button" onClick={() => setBudgetPostes((p) => [...p, { ...EMPTY_BUDGET_POSTE_FORM }])}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1">
                  <Plus size={12} /> Ajouter un poste
                </button>
              </div>
              <div className="space-y-2 border border-gray-200 rounded-xl p-3 bg-gray-50">
                <div className={`rounded-lg border bg-white px-3 py-2 text-[11px] ${specialChargesEnabled ? 'border-indigo-100 text-indigo-700' : 'border-amber-200 text-amber-800'}`}>
                  {specialChargesEnabled
                    ? (
                      availableRepartitionGroups.length > 0
                        ? `Par défaut, chaque ligne est répartie en charges communes. Vous pouvez aussi viser : ${availableRepartitionGroups.join(', ')}.`
                        : 'Par défaut, chaque ligne est répartie en charges communes. Ajoutez d’abord une clé spéciale dans le paramétrage de la copropriété.'
                    )
                    : 'Les clés spéciales sont réservées à l’option payante Charges spéciales. Vous pouvez garder une résolution entièrement en charges communes.'}
                </div>
                {budgetPostes.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-1">Aucun poste ajouté</p>
                )}
                {budgetPostes.map((p, i) => (
                  <div key={i} className="grid grid-cols-[1fr_6rem_9rem_auto] gap-2 items-center">
                    <input type="text" placeholder="Libellé du poste" value={p.libelle}
                      onChange={(e) => setBudgetPostes((prev) => prev.map((x, idx) => idx === i ? { ...x, libelle: e.target.value } : x))}
                      className="text-sm rounded-lg border border-gray-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <input type="number" placeholder="0.00" min="0" step="0.01" value={p.montant}
                      onChange={(e) => setBudgetPostes((prev) => prev.map((x, idx) => idx === i ? { ...x, montant: e.target.value } : x))}
                      className="w-full text-sm rounded-lg border border-gray-300 bg-white px-3 py-2 text-right focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {((specialChargesEnabled && availableRepartitionGroups.length > 0) || (p.repartition_type === 'groupe' && p.repartition_cible)) ? (
                      <select
                        value={p.repartition_type === 'groupe' && p.repartition_cible ? `groupe:${p.repartition_cible}` : 'generale'}
                        onChange={(e) => setBudgetPostes((prev) => prev.map((x, idx) => idx === i ? {
                          ...x,
                          repartition_type: e.target.value.startsWith('groupe:') ? 'groupe' : 'generale',
                          repartition_cible: e.target.value.startsWith('groupe:') ? e.target.value.slice(7) : '',
                        } : x))}
                        className="text-sm rounded-lg border border-gray-300 bg-white px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                      <div className="text-sm rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-2 text-gray-600">
                        Charges communes
                      </div>
                    )}
                    <button type="button" onClick={() => setBudgetPostes((prev) => prev.filter((_, idx) => idx !== i))}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                {budgetPostes.length > 0 && (
                  <div className="text-right text-xs font-bold text-indigo-700 pt-1 border-t border-gray-100">
                    Total : {formatEuros(budgetPostes.reduce((s, p) => s + (parseFloat(p.montant) || 0), 0))}
                  </div>
                )}
              </div>
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

// ── Edition d'une résolution ──────────────────────────────────────────────────

interface Resolution {
  id: string;
  numero: number;
  titre: string;
  description: string | null;
  majorite: string | null;
  statut: string;
  voix_pour: number;
  voix_contre: number;
  voix_abstention: number;
  budget_postes?: PosteBudget[] | null;
  type_resolution?: string | null;
  fonds_travaux_montant?: number | null;
}

export function ResolutionEdit({
  resolution,
  agStatut,
  onUpdated,
  specialChargesEnabled = true,
}: {
  resolution: Resolution;
  agStatut?: string;
  onUpdated?: (resolution: Resolution) => void;
  specialChargesEnabled?: boolean;
}) {
  const isPreLaunch = agStatut === 'creation' || agStatut === 'planifiee';
  const supabase = createClient();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    titre: resolution.titre,
    description: resolution.description ?? '',
    majorite: resolution.majorite ?? '',
    statut: resolution.statut,
    voix_pour: String(resolution.voix_pour),
    voix_contre: String(resolution.voix_contre),
    voix_abstention: String(resolution.voix_abstention),
  });
  const [budgetPostes, setBudgetPostes] = useState<PosteBudgetForm[]>(
    mapBudgetPostesToForm(resolution.budget_postes ?? [])
  );
  const [fondsTravaux, setFondsTravaux] = useState(resolution.fonds_travaux_montant ? String(resolution.fonds_travaux_montant) : '');
  const [availableRepartitionGroups, setAvailableRepartitionGroups] = useState<string[]>([]);

  const typeResolution = resolution.type_resolution ?? 'libre';
  const typeConfig = TYPES_RESOLUTION[typeResolution] ?? TYPES_RESOLUTION['libre'];

  useEffect(() => {
    if (!isOpen) return;

    const loadGroups = async () => {
      const { data: currentResolution } = await supabase
        .from('resolutions')
        .select('ag_id')
        .eq('id', resolution.id)
        .maybeSingle();

      if (!currentResolution?.ag_id) {
        setAvailableRepartitionGroups([]);
        return;
      }

      const { data: ag } = await supabase
        .from('assemblees_generales')
        .select('copropriete_id')
        .eq('id', currentResolution.ag_id)
        .maybeSingle();

      if (!ag?.copropriete_id) {
        setAvailableRepartitionGroups([]);
        return;
      }

      const { data: lots } = await supabase
        .from('lots')
        .select('id, tantiemes, coproprietaire_id, batiment, groupes_repartition, tantiemes_groupes')
        .eq('copropriete_id', ag.copropriete_id);

      setAvailableRepartitionGroups(collectAvailableRepartitionGroups((lots ?? []).map((lot) => ({
        ...lot,
        coproprietaire_id: lot.coproprietaire_id ?? null,
        batiment: lot.batiment ?? null,
        groupes_repartition: lot.groupes_repartition ?? [],
      }))));
    };

    void loadGroups();
  }, [isOpen, resolution.id, supabase]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const editPostesValides = typeConfig.hasBudget
      ? buildBudgetPostesPayload(budgetPostes)
      : (resolution.budget_postes ?? []);
    const specialBudgetChanged = JSON.stringify(editPostesValides) !== JSON.stringify(resolution.budget_postes ?? []);

    if (!specialChargesEnabled && specialBudgetChanged && editPostesValides.some((poste) => poste.repartition_type === 'groupe' && Boolean(poste.repartition_cible))) {
      setError('Activez l’option Charges spéciales pour modifier une clé spéciale dans cette résolution.');
      setLoading(false);
      return;
    }

    const nextStatut = isPreLaunch ? 'en_attente' : formData.statut;
    const nextVoixPour = isPreLaunch ? 0 : (parseInt(formData.voix_pour) || 0);
    const nextVoixContre = isPreLaunch ? 0 : (parseInt(formData.voix_contre) || 0);
    const nextVoixAbstention = isPreLaunch ? 0 : (parseInt(formData.voix_abstention) || 0);
    const nextBudgetPostes = editPostesValides.length > 0 ? editPostesValides : null;
    const nextFondsTravaux = typeConfig.hasFondsTravaux && fondsTravaux ? parseFloat(fondsTravaux) : null;

    const { error: dbError } = await supabase.from('resolutions').update({
      titre: formData.titre.trim(),
      description: formData.description.trim() || null,
      majorite: formData.majorite || null,
      statut: nextStatut,
      voix_pour: nextVoixPour,
      voix_contre: nextVoixContre,
      voix_abstention: nextVoixAbstention,
      budget_postes: nextBudgetPostes,
      fonds_travaux_montant: nextFondsTravaux,
    }).eq('id', resolution.id);

    if (dbError) { setError('Erreur : ' + dbError.message); setLoading(false); return; }
    onUpdated?.({
      ...resolution,
      titre: formData.titre.trim(),
      description: formData.description.trim() || null,
      majorite: formData.majorite || null,
      statut: nextStatut,
      voix_pour: nextVoixPour,
      voix_contre: nextVoixContre,
      voix_abstention: nextVoixAbstention,
      budget_postes: nextBudgetPostes,
      fonds_travaux_montant: nextFondsTravaux,
    });
    setLoading(false);
    setIsOpen(false);
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)}
        className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors" title="Modifier">
        <Pencil size={14} />
      </button>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Modifier la résolution" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          {typeResolution !== 'libre' && (
            <div className="px-3 py-2 bg-blue-50 rounded-lg text-xs text-blue-700 font-medium">
              Type : {TYPES_RESOLUTION[typeResolution]?.label ?? typeResolution}
            </div>
          )}
          {!isPreLaunch && (
            <Select label="Statut" name="statut" value={formData.statut} onChange={handleChange}
              options={[
                { value: 'en_attente', label: 'En attente' },
                { value: 'approuvee', label: 'Approuvée' },
                { value: 'refusee', label: 'Refusée' },
                { value: 'reportee', label: 'Reportée' },
              ]}
            />
          )}
          <Input label="Titre" name="titre" value={formData.titre} onChange={handleChange} required />
          {typeResolution === 'libre' ? (
            <Select label="Type de majorité" name="majorite" value={formData.majorite} onChange={handleChange} options={MAJORITE_OPTIONS} />
          ) : (
            <div>
              <p className="block text-sm font-medium text-gray-700 mb-1">Type de majorité</p>
              <div className="px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-500">
                {MAJORITE_OPTIONS.find((o) => o.value === formData.majorite)?.label ?? formData.majorite ?? '—'}
                <span className="ml-2 text-xs text-gray-400">(défini par le type de résolution)</span>
              </div>
            </div>
          )}
          <Textarea label="Description (optionnel)" name="description" value={formData.description} onChange={handleChange} rows={2} />

          {typeConfig.hasFondsTravaux && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Montant de la cotisation (€)</label>
              <input type="number" min="0" step="0.01" value={fondsTravaux} onChange={(e) => setFondsTravaux(e.target.value)}
                className="w-48 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {typeConfig.hasBudget && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Postes de dépenses</label>
                <button type="button" onClick={() => setBudgetPostes((p) => [...p, { ...EMPTY_BUDGET_POSTE_FORM }])}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1">
                  <Plus size={12} /> Ajouter
                </button>
              </div>
              <div className="space-y-2 border border-gray-200 rounded-xl p-3 bg-gray-50">
                <div className={`rounded-lg border bg-white px-3 py-2 text-[11px] ${specialChargesEnabled ? 'border-indigo-100 text-indigo-700' : 'border-amber-200 text-amber-800'}`}>
                  {specialChargesEnabled
                    ? (
                      availableRepartitionGroups.length > 0
                        ? `Charges communes par défaut. Vous pouvez cibler : ${availableRepartitionGroups.join(', ')}.`
                        : 'Charges communes par défaut. Ajoutez d’abord une clé spéciale dans le paramétrage de la copropriété.'
                    )
                    : 'Les clés spéciales sont réservées à l’option payante Charges spéciales. Vous pouvez revenir à une répartition générale si besoin.'}
                </div>
                {budgetPostes.map((p, i) => (
                  <div key={i} className="grid grid-cols-[1fr_6rem_9rem_auto] gap-2 items-center">
                    <input type="text" value={p.libelle}
                      onChange={(e) => setBudgetPostes((prev) => prev.map((x, idx) => idx === i ? { ...x, libelle: e.target.value } : x))}
                      className="text-sm rounded-lg border border-gray-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <input type="number" min="0" step="0.01" value={p.montant}
                      onChange={(e) => setBudgetPostes((prev) => prev.map((x, idx) => idx === i ? { ...x, montant: e.target.value } : x))}
                      className="w-full text-sm rounded-lg border border-gray-300 bg-white px-3 py-2 text-right focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {((specialChargesEnabled && availableRepartitionGroups.length > 0) || (p.repartition_type === 'groupe' && p.repartition_cible)) ? (
                      <select
                        value={p.repartition_type === 'groupe' && p.repartition_cible ? `groupe:${p.repartition_cible}` : 'generale'}
                        onChange={(e) => setBudgetPostes((prev) => prev.map((x, idx) => idx === i ? {
                          ...x,
                          repartition_type: e.target.value.startsWith('groupe:') ? 'groupe' : 'generale',
                          repartition_cible: e.target.value.startsWith('groupe:') ? e.target.value.slice(7) : '',
                        } : x))}
                        className="text-sm rounded-lg border border-gray-300 bg-white px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                      <div className="text-sm rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-2 text-gray-600">
                        Charges communes
                      </div>
                    )}
                    <button type="button" onClick={() => setBudgetPostes((prev) => prev.filter((_, idx) => idx !== i))}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                {budgetPostes.length > 0 && (
                  <div className="text-right text-xs font-bold text-indigo-700 pt-1 border-t border-gray-100">
                    Total : {formatEuros(budgetPostes.reduce((s, p) => s + (parseFloat(p.montant) || 0), 0))}
                  </div>
                )}
              </div>
            </div>
          )}

          {!isPreLaunch && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Résultats du vote</p>
              <div className="grid grid-cols-3 gap-3">
                <Input label="Pour" name="voix_pour" type="number" min="0" value={formData.voix_pour} onChange={handleChange} />
                <Input label="Contre" name="voix_contre" type="number" min="0" value={formData.voix_contre} onChange={handleChange} />
                <Input label="Abstentions" name="voix_abstention" type="number" min="0" value={formData.voix_abstention} onChange={handleChange} />
              </div>
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

// ── Suppression d'une résolution ─────────────────────────────────────────────

export function ResolutionDelete({ resolutionId, onDeleted }: { resolutionId: string; onDeleted?: (resolutionId: string) => void }) {
  const supabase = createClient();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setLoading(true);
    setError('');
    const { error } = await supabase.from('resolutions').delete().eq('id', resolutionId);
    setLoading(false);

    if (error) {
      setError('Erreur : ' + error.message);
      return;
    }

    setIsOpen(false);
    onDeleted?.(resolutionId);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        disabled={loading}
        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
        title="Supprimer"
      >
        <Trash2 size={14} />
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Supprimer la résolution" size="sm">
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg border border-red-100 bg-red-50 p-3">
            <Trash2 size={16} className="mt-0.5 shrink-0 text-red-600" />
            <p className="text-sm text-red-700">
              Voulez-vous vraiment supprimer cette résolution ?
              <strong> Cette action est irréversible.</strong>
            </p>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3 pt-1">
            <Button variant="danger" loading={loading} onClick={handleDelete}>
              <Trash2 size={14} /> Supprimer définitivement
            </Button>
            <Button variant="secondary" onClick={() => setIsOpen(false)} disabled={loading}>
              Annuler
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
