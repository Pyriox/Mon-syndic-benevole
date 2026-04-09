// ============================================================
// Client Component : Vote par coproprietaire pour une resolution
// Modes : designation (cartes) | standard (boutons pour/contre)
// Affiche le resultat confirme apres enregistrement
// ============================================================
'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import { Save, SkipForward, Plus, Trash2, CheckCircle2, Pencil, Users, AlertTriangle, Zap } from 'lucide-react';
import { formatEuros, TYPES_RESOLUTION } from '@/lib/utils';

type Vote = 'pour' | 'contre' | 'abstention';

interface Copro { id: string; nom: string; prenom: string; }
interface Presence { coproprietaire_id: string; statut: string; represente_par_id: string | null; }
interface VoteCopro { coproprietaire_id: string; vote: Vote; }

interface VoteParCoproProps {
  resolutionId: string;
  resolutionStatut: string;
  majorite: string | null;
  typeResolution?: string | null;
  tantiemesMap: Record<string, number>;
  totalTantiemes: number;
  initialVotes: VoteCopro[];
  presences: Presence[];
  coproprietaires: Copro[];
  canEdit: boolean;
  designationResultats?: { id: string; nom: string; prenom: string }[] | null;
  initialBudgetPostes?: {
    libelle: string;
    montant: number;
    repartition_type?: 'generale' | 'groupe' | null;
    repartition_cible?: string | null;
  }[] | null;
  initialFondsTravaux?: number | null;
}

const VOTE_OPTIONS: { value: Vote; label: string; activeClass: string }[] = [
  { value: 'pour',       label: 'POUR',   activeClass: 'bg-green-100 border-green-300 text-green-700' },
  { value: 'contre',     label: 'CONTRE', activeClass: 'bg-red-100 border-red-300 text-red-700' },
  { value: 'abstention', label: 'ABST.',  activeClass: 'bg-gray-200 border-gray-300 text-gray-600' },
];

export default function VoteParCopro({
  resolutionId,
  resolutionStatut,
  majorite,
  typeResolution,
  tantiemesMap,
  totalTantiemes,
  initialVotes,
  presences,
  coproprietaires,
  canEdit,
  designationResultats,
  initialBudgetPostes,
  initialFondsTravaux,
}: VoteParCoproProps) {
  const supabase = createClient();

  const typeConfig      = typeResolution ? (TYPES_RESOLUTION[typeResolution] ?? null) : null;
  const isDesignation   = typeConfig?.designation === true;
  const isMultiple      = typeConfig?.multiple === true;
  const isOptional      = typeConfig?.optional === true;
  const hasBudget       = typeConfig?.hasBudget === true;
  const hasFondsTravaux = typeConfig?.hasFondsTravaux === true;

  const [votes, setVotes] = useState<Record<string, Vote | null>>(() => {
    const m: Record<string, Vote | null> = {};
    presences.forEach((p) => { m[p.coproprietaire_id] = null; });
    initialVotes.forEach((v) => { m[v.coproprietaire_id] = v.vote; });
    return m;
  });

  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    (designationResultats ?? []).map((d) => d.id)
  );
  const [autreTexte, setAutreTexte] = useState<string>(() => {
    const a = (designationResultats ?? []).find((d) => d.id === '__autre__');
    return a ? `${a.prenom} ${a.nom}`.trim() : '';
  });
  const isSyndic = typeResolution === 'designation_syndic';

  const [budgetPostes, setBudgetPostes] = useState<{
    libelle: string;
    montant: string;
    repartition_type: 'generale' | 'groupe';
    repartition_cible: string;
  }[]>(() =>
    (initialBudgetPostes ?? []).map((p) => ({
      libelle: p.libelle,
      montant: String(p.montant),
      repartition_type: p.repartition_type === 'groupe' ? 'groupe' : 'generale',
      repartition_cible: p.repartition_cible ?? '',
    }))
  );

  const [fondsTravaux, setFondsTravaux] = useState(
    initialFondsTravaux != null ? String(initialFondsTravaux) : ''
  );

  const [passerelleActive, setPasserelleActive] = useState(false);
  const [savedDesignationResultats, setSavedDesignationResultats] = useState<{ id: string; nom: string; prenom: string }[] | null | undefined>(undefined);
  const [savedBudgetPostes, setSavedBudgetPostes] = useState<{
    libelle: string;
    montant: number;
    repartition_type?: 'generale' | 'groupe' | null;
    repartition_cible?: string | null;
  }[] | null | undefined>(undefined);
  const [savedFondsTravaux, setSavedFondsTravaux] = useState<number | null | undefined>(undefined);

  const [dirty,   setDirty]   = useState(false);
  const [saving,  setSaving]  = useState(false);
  // "saved" : affiche le panneau de resultat confirme
  const [saved,   setSaved]   = useState(
    resolutionStatut === 'approuvee' || resolutionStatut === 'refusee' || resolutionStatut === 'reportee'
  );
  // Statut optimiste : mis à jour immédiatement après enregistrement,
  // sans attendre un rerender serveur de la page.
  const [savedStatut, setSavedStatut] = useState<string | null>(null);

  // -- Helpers --
  const getName = (id: string) => {
    const c = coproprietaires.find((x) => x.id === id);
    return c ? `${c.prenom} ${c.nom}` : '?';
  };

  const handleVote = (coproId: string, vote: Vote) => {
    if (!canEdit) return;
    setVotes((p) => ({ ...p, [coproId]: p[coproId] === vote ? null : vote }));
    setDirty(true);
    setSaved(false);
  };

  const toggleDesignation = (id: string) => {
    if (!canEdit) return;
    setSelectedIds((p) => isMultiple
      ? (p.includes(id) ? p.filter((x) => x !== id) : [...p, id])
      : (p.includes(id) ? [] : [id])
    );
    setDirty(true);
    setSaved(false);
  };

  const calcTantiemes = (voteFilter: Vote) =>
    Object.entries(votes)
      .filter(([, v]) => v === voteFilter)
      .reduce((s, [id]) => s + (tantiemesMap[id] ?? 0), 0);

  const computeStatut = (v: Record<string, Vote | null>): string => {
    const tPour    = Object.entries(v).filter(([, x]) => x === 'pour').reduce((s, [id]) => s + (tantiemesMap[id] ?? 0), 0);
    const tContre  = Object.entries(v).filter(([, x]) => x === 'contre').reduce((s, [id]) => s + (tantiemesMap[id] ?? 0), 0);
    const exprimes = tPour + tContre;
    const pourNb    = Object.values(v).filter((x) => x === 'pour').length;
    const votantsNb = Object.values(v).filter((x) => x !== null).length;
    switch (majorite) {
      case 'article_24': return exprimes === 0 ? resolutionStatut : tPour > tContre ? 'approuvee' : 'refusee';
      case 'article_25': {
        if (totalTantiemes === 0) return resolutionStatut;
        if (passerelleActive) return exprimes === 0 ? resolutionStatut : tPour > tContre ? 'approuvee' : 'refusee';
        return tPour > totalTantiemes / 2 ? 'approuvee' : 'refusee';
      }
      case 'article_26': {
        if (exprimes === 0) return resolutionStatut;
        return (tPour / exprimes >= 2 / 3) && (votantsNb > 0 && pourNb > votantsNb / 2) ? 'approuvee' : 'refusee';
      }
      default: return exprimes === 0 ? resolutionStatut : tPour > tContre ? 'approuvee' : 'refusee';
    }
  };

  // -- Save designation --
  const handleSaveDesignation = async () => {
    setSaving(true);
    const resultats = selectedIds.map((id) => {      if (id === '__autre__') return { id: '__autre__', nom: autreTexte.trim(), prenom: '' };      const c = coproprietaires.find((x) => x.id === id);
      return { id, nom: c?.nom ?? '', prenom: c?.prenom ?? '' };
    });
    // voix_pour = total tantièmes des voteurs présents (tous approuvent la désignation)
    const tantTotal = presences.reduce((s, p) => s + (tantiemesMap[p.coproprietaire_id] ?? 0), 0);
    const desigStatut = resultats.length > 0 ? 'approuvee' : resolutionStatut;
    await supabase.from('resolutions').update({
      designation_resultats: resultats.length > 0 ? resultats : null,
      statut: desigStatut,
      voix_pour: tantTotal,
      voix_contre: 0,
      voix_abstention: 0,
    }).eq('id', resolutionId);
    setSavedDesignationResultats(resultats);
    setSavedStatut(desigStatut);
    setDirty(false);
    setSaving(false);
    setSaved(true);
  };

  // -- Save vote standard --
  const handleSave = async () => {
    setSaving(true);
    const toUpsert = Object.entries(votes).filter(([, v]) => v !== null).map(([coproprietaire_id, vote]) => ({
      resolution_id: resolutionId, coproprietaire_id, vote: vote!,
    }));
    const toDeleteIds = Object.entries(votes).filter(([, v]) => v === null).map(([id]) => id);
    if (toUpsert.length > 0)   await supabase.from('votes_coproprietaires').upsert(toUpsert, { onConflict: 'resolution_id,coproprietaire_id' });
    if (toDeleteIds.length > 0) await supabase.from('votes_coproprietaires').delete().eq('resolution_id', resolutionId).in('coproprietaire_id', toDeleteIds);

    const tantPour  = calcTantiemes('pour');
    const tantContre = calcTantiemes('contre');
    const tantAbst  = calcTantiemes('abstention');
    const newStatut = computeStatut(votes);

    const extraFields: Record<string, unknown> = {};
    if (hasBudget) {
      const pv = budgetPostes.filter((p) => p.libelle.trim()).map((p) => ({
        libelle: p.libelle.trim(),
        montant: parseFloat(p.montant) || 0,
        repartition_type: p.repartition_type,
        repartition_cible: p.repartition_type === 'groupe' ? (p.repartition_cible || null) : null,
      }));
      extraFields.budget_postes = pv.length > 0 ? pv : null;
    }
    if (hasFondsTravaux) extraFields.fonds_travaux_montant = fondsTravaux ? parseFloat(fondsTravaux) : null;

    await supabase.from('resolutions')
      .update({ voix_pour: tantPour, voix_contre: tantContre, voix_abstention: tantAbst, statut: newStatut, ...extraFields })
      .eq('id', resolutionId);

    setSavedBudgetPostes(
      hasBudget
        ? budgetPostes.filter((p) => p.libelle.trim()).map((p) => ({
          libelle: p.libelle.trim(),
          montant: parseFloat(p.montant) || 0,
          repartition_type: p.repartition_type,
          repartition_cible: p.repartition_type === 'groupe' ? (p.repartition_cible || null) : null,
        }))
        : []
    );
    setSavedFondsTravaux(hasFondsTravaux ? (fondsTravaux ? parseFloat(fondsTravaux) : null) : null);
    setSavedStatut(newStatut);
    setDirty(false);
    setSaving(false);
    setSaved(true);
  };

  const handleSkip = async () => {
    if (!confirm('Passer cette résolution ? Elle sera marquée comme reportée.')) return;
    setSaving(true);
    await supabase.from('resolutions').update({ statut: 'reportee' }).eq('id', resolutionId);
    setSavedStatut('reportee');
    setSaving(false);
    setSaved(true);
  };

  if (presences.length === 0) {
    return <p className="mt-2 text-xs text-gray-400 italic">Aucun copropriétaire présent enregistré.</p>;
  }

  // ==============================================================
  // PANNEAU RESULTAT (apres enregistrement ou resolution deja votee)
  // ==============================================================
  // effectiveStatut : utilise savedStatut (mis à jour optimistiquement après save)
  // plutôt que d'attendre un nouveau rendu serveur de la page.
  const effectiveStatut = savedStatut ?? resolutionStatut;
  const effectiveDesignationResultats = savedDesignationResultats ?? (designationResultats ?? []);
  const effectiveBudgetPostes = savedBudgetPostes ?? (initialBudgetPostes ?? []);
  const effectiveFondsTravaux = savedFondsTravaux !== undefined ? savedFondsTravaux : initialFondsTravaux;
  const isApproved = effectiveStatut === 'approuvee';
  const isRefused  = effectiveStatut === 'refusee';
  const isReported = effectiveStatut === 'reportee';

  if (saved && !dirty && (isApproved || isRefused || isReported)) {
    return (
      <div className={`mt-3 rounded-xl border px-4 py-3 flex items-start justify-between gap-3 ${
        isApproved ? 'bg-green-50 border-green-200'
        : isRefused ? 'bg-red-50 border-red-200'
        : 'bg-gray-50 border-gray-200'
      }`}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={15} className={isApproved ? 'text-green-600' : isRefused ? 'text-red-500' : 'text-gray-400'} />
            <span className={`text-sm font-semibold ${isApproved ? 'text-green-700' : isRefused ? 'text-red-600' : 'text-gray-600'}`}>
              {isApproved ? 'Résolution approuvée' : isRefused ? 'Résolution refusée' : 'Résolution reportée'}
            </span>
          </div>

          {/* Designation result */}
          {isDesignation && effectiveDesignationResultats.length > 0 && (
            <p className="text-xs text-gray-700 mt-1.5 flex items-center gap-1.5">
              <Users size={11} className="shrink-0" />
              <span>
                <span className="font-medium">Désigné{effectiveDesignationResultats.length > 1 ? 's' : ''} :</span>{' '}
                {effectiveDesignationResultats.map((d) => `${d.prenom} ${d.nom}`.trim()).join(', ')}
              </span>
            </p>
          )}

          {/* Budget result */}
          {hasBudget && effectiveBudgetPostes.length > 0 && (
            <p className="text-xs text-gray-700 mt-1.5">
              <span className="font-medium">Budget voté :</span>{' '}
              {formatEuros(effectiveBudgetPostes.reduce((s, p) => s + p.montant, 0))}
              {' '}<span className="text-gray-400">({effectiveBudgetPostes.length} poste{effectiveBudgetPostes.length > 1 ? 's' : ''})</span>
            </p>
          )}

          {/* Fonds travaux result */}
          {hasFondsTravaux && effectiveFondsTravaux != null && (
            <p className="text-xs text-gray-700 mt-1.5">
              <span className="font-medium">Cotisation fonds de travaux :</span> {formatEuros(effectiveFondsTravaux)}
            </p>
          )}

          {/* Vote counts (non-designation) */}
          {!isDesignation && (
            <div className="flex items-center gap-3 text-xs text-gray-500 mt-1.5">
              <span className="text-green-600 font-medium">Pour : {calcTantiemes('pour')} tant.</span>
              <span className="text-red-500 font-medium">Contre : {calcTantiemes('contre')} tant.</span>
              <span>Abst. : {calcTantiemes('abstention')} tant.</span>
            </div>
          )}
        </div>

        {canEdit && (
          <button onClick={() => setSaved(false)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 font-medium shrink-0 mt-0.5">
            <Pencil size={12} /> Modifier
          </button>
        )}
      </div>
    );
  }

  // ==============================================================
  // MODE DESIGNATION — liste compacte + votes pour/contre/abst
  // ==============================================================
  if (isDesignation) {
    const pourCountD       = Object.values(votes).filter((v) => v === 'pour').length;
    const contreCountD     = Object.values(votes).filter((v) => v === 'contre').length;
    const abstentionCountD = Object.values(votes).filter((v) => v === 'abstention').length;
    const votesCountD      = pourCountD + contreCountD + abstentionCountD;

    const tantPourLiveD   = calcTantiemes('pour');
    const tantContreLiveD = calcTantiemes('contre');
    const tantAbstLiveD   = calcTantiemes('abstention');

    return (
      <div className="mt-3 border border-gray-200 rounded-xl overflow-hidden">
        {/* En-tête désignation */}
        <div className="px-3 py-2 bg-indigo-50 border-b border-indigo-100 text-xs font-semibold text-indigo-700 flex items-center gap-2">
          <Users size={12} />
          {isMultiple ? 'Désigner une ou plusieurs personnes parmi les présents' : 'Désigner une personne parmi les présents'}
        </div>

        {/* Liste compacte de désignation */}
        <div className="divide-y divide-gray-100 max-h-56 overflow-y-auto">
          {presences.map((p) => {
            const isSelected = selectedIds.includes(p.coproprietaire_id);
            return (
              <button
                key={p.coproprietaire_id}
                type="button"
                disabled={!canEdit}
                onClick={() => toggleDesignation(p.coproprietaire_id)}
                className={`w-full flex items-center justify-between gap-2 px-3 py-1.5 text-left transition-colors focus:outline-none ${
                  isSelected ? 'bg-indigo-50' : 'bg-white hover:bg-gray-50'
                } ${canEdit ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                    isSelected ? (isMultiple ? 'bg-indigo-600 border-indigo-600' : 'bg-indigo-600 border-indigo-600') : 'border-gray-300 bg-white'
                  }`}>
                    {isSelected && <div className={`${isMultiple ? 'w-1.5 h-1.5 rounded-sm' : 'w-1.5 h-1.5 rounded-full'} bg-white`} />}
                  </div>
                  <span className="text-xs font-medium text-gray-800 truncate">{getName(p.coproprietaire_id)}</span>
                  {p.statut === 'represente' && p.represente_par_id && (
                    <span className="text-[10px] text-blue-500 shrink-0">↳ {getName(p.represente_par_id)}</span>
                  )}
                </div>
                <span className="text-[10px] text-gray-400 shrink-0">{tantiemesMap[p.coproprietaire_id] ?? 0} t.</span>
              </button>
            );
          })}

          {/* Option Autre (syndic uniquement) */}
          {isSyndic && (() => {
            const isSelected = selectedIds.includes('__autre__');
            return (
              <div className={`px-3 py-2 flex items-center gap-2 ${isSelected ? 'bg-indigo-50' : 'bg-white'}`}>
                <button type="button" disabled={!canEdit}
                  onClick={() => { toggleDesignation('__autre__'); }}
                  className={`flex items-center gap-2 min-w-0 flex-shrink-0 ${canEdit ? 'cursor-pointer' : 'cursor-default'}`}>
                  <div className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                    isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 bg-white'
                  }`}>
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <span className="text-xs font-medium text-gray-800">Autre (extérieur)</span>
                </button>
                {isSelected && (
                  <input
                    type="text"
                    value={autreTexte}
                    onChange={(e) => { setAutreTexte(e.target.value); setDirty(true); }}
                    placeholder="Nom du syndic extérieur..."
                    className="flex-1 text-xs rounded-md border border-indigo-300 bg-white px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    autoFocus
                  />
                )}
              </div>
            );
          })()}
        </div>

        {/* Section votes pour / contre / abstention */}
        <div className="border-t border-gray-200 bg-gray-50">
          <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
            Votes des présents
          </div>
          <div className="divide-y divide-gray-100 max-h-48 overflow-y-auto">
            {presences.map((p) => {
              const current = votes[p.coproprietaire_id] ?? null;
              return (
                <div key={p.coproprietaire_id}
                  className="flex items-center justify-between gap-2 px-3 py-1.5 hover:bg-white">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-xs text-gray-700 truncate">{getName(p.coproprietaire_id)}</span>
                    <span className="text-[10px] text-gray-400 shrink-0">{tantiemesMap[p.coproprietaire_id] ?? 0} t.</span>
                    {p.statut === 'represente' && p.represente_par_id && (
                      <span className="text-[10px] text-blue-500 shrink-0">↳ {getName(p.represente_par_id)}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {VOTE_OPTIONS.map((opt) => (
                      <button key={opt.value} type="button" disabled={!canEdit}
                        onClick={() => handleVote(p.coproprietaire_id, opt.value)}
                        className={`px-1.5 py-0.5 text-[10px] font-semibold rounded border transition-colors ${
                          current === opt.value ? opt.activeClass : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'
                        } ${canEdit ? 'cursor-pointer' : 'cursor-default'}`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Barre progression + récap votes */}
          {presences.length > 0 && (
            <div className="px-3 py-1.5 border-t border-gray-100 flex items-center gap-2 text-[10px] text-gray-500">
              <div className="flex-1 bg-gray-200 rounded-full h-1">
                <div className="bg-blue-400 h-1 rounded-full transition-all" style={{ width: `${Math.round((votesCountD / presences.length) * 100)}%` }} />
              </div>
              <span>{votesCountD}/{presences.length} ont voté</span>
              <span className="text-green-600 font-medium">{tantPourLiveD} t. POUR</span>
              <span className="text-red-500 font-medium">{tantContreLiveD} t. CONTRE</span>
              {tantAbstLiveD > 0 && <span>{tantAbstLiveD} t. ABST.</span>}
            </div>
          )}
        </div>

        {/* Actions */}
        {canEdit && (
          <div className="border-t border-gray-100 px-3 py-2 bg-white flex items-center gap-2 flex-wrap">
            {(() => {
              const allVoted = Object.values(votes).every((v) => v !== null);
              const hasValidDesignation =
                selectedIds.length > 0 &&
                (!selectedIds.includes('__autre__') || autreTexte.trim().length > 0);
              return (
                <Button
                  size="sm"
                  onClick={handleSaveDesignation}
                  loading={saving}
                  disabled={!hasValidDesignation || !allVoted}
                  title={
                    !hasValidDesignation
                      ? 'Sélectionnez au moins une personne'
                      : !allVoted
                      ? 'Saisissez le vote de tous les présents'
                      : undefined
                  }
                >
                  <Save size={12} /> Enregistrer la désignation
                </Button>
              );
            })()}
            {isOptional && (
              <Button size="sm" variant="secondary" onClick={handleSkip} loading={saving}>
                <SkipForward size={12} /> Passer
              </Button>
            )}
            {selectedIds.length > 0 && (
              <span className="text-xs text-indigo-600 font-medium">
                {selectedIds.length} sélectionné{selectedIds.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  // ==============================================================
  // MODE VOTE STANDARD
  // ==============================================================
  const pourCount       = Object.values(votes).filter((v) => v === 'pour').length;
  const contreCount     = Object.values(votes).filter((v) => v === 'contre').length;
  const abstentionCount = Object.values(votes).filter((v) => v === 'abstention').length;
  const votesCount      = pourCount + contreCount + abstentionCount;

  const tantPourLive   = calcTantiemes('pour');
  const tantContreLive = calcTantiemes('contre');
  const tantAbstLive   = calcTantiemes('abstention');
  const exprimesLive   = tantPourLive + tantContreLive;

  // Ne pas afficher de résultat tentative si aucun vote exprimé (pour/contre)
  const tentativeStatut: string | null = exprimesLive === 0
    ? null
    : computeStatut(votes);

  const majoriteLabel: Record<string, string> = {
    article_24: 'Art. 24 — majorité simple',
    article_25: passerelleActive ? 'Passerelle Art. 25-1 → Art. 24 (majorité simple)' : 'Art. 25 — majorité absolue',
    article_26: 'Art. 26 — double majorité',
  };

  // Passerelle Art. 25-1 : au moins 1/3 des tantiemes mais pas la majorite absolue
  const passerelleDisponible = majorite === 'article_25'
    && totalTantiemes > 0
    && exprimesLive > 0
    && tantPourLive * 3 >= totalTantiemes   // >= 1/3 des tantiemes totaux
    && tantPourLive * 2 <= totalTantiemes;  // < majorite absolue (50%)

  return (
    <div className="mt-3 space-y-2">

      {/* Fonds de travaux */}
      {hasFondsTravaux && canEdit && (
        <div className="border border-amber-200 rounded-xl p-3 bg-amber-50">
          <label className="block text-xs font-semibold text-amber-800 mb-1.5">
            Montant de la cotisation fonds de travaux (EUR)
          </label>
          <input type="number" min="0" step="0.01"
            value={fondsTravaux}
            onChange={(e) => { setFondsTravaux(e.target.value); setDirty(true); setSaved(false); }}
            className="w-40 text-sm rounded-lg border border-amber-300 bg-white px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
            placeholder="0.00" />
        </div>
      )}

      {/* Postes budgetaires */}
      {hasBudget && canEdit && (
        <div className="border border-indigo-200 rounded-xl p-3 bg-indigo-50">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-indigo-800">
              Postes du budget{typeConfig?.optional ? ' (optionnel)' : ''}
            </label>
            <button type="button"
              onClick={() => {
                setBudgetPostes((p) => [...p, {
                  libelle: '',
                  montant: '',
                  repartition_type: 'generale',
                  repartition_cible: '',
                }]);
                setDirty(true);
                setSaved(false);
              }}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1">
              <Plus size={12} /> Ajouter
            </button>
          </div>
          <div className="space-y-1.5">
            {budgetPostes.length === 0 && (
              <p className="text-xs text-indigo-400 text-center py-1">Aucun poste</p>
            )}
            {budgetPostes.map((p, i) => (
              <div key={i} className="grid grid-cols-[1fr_auto_auto] gap-1.5 items-center">
                <input type="text" placeholder="Libellé du poste" value={p.libelle}
                  onChange={(e) => { setBudgetPostes((prev) => prev.map((x, idx) => idx === i ? { ...x, libelle: e.target.value } : x)); setDirty(true); setSaved(false); }}
                  className="text-xs rounded-lg border border-indigo-200 bg-white px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <input type="number" placeholder="0.00" min="0" step="0.01" value={p.montant}
                  onChange={(e) => { setBudgetPostes((prev) => prev.map((x, idx) => idx === i ? { ...x, montant: e.target.value } : x)); setDirty(true); setSaved(false); }}
                  className="w-24 text-xs rounded-lg border border-indigo-200 bg-white px-2 py-1.5 text-right focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <button type="button"
                  onClick={() => { setBudgetPostes((prev) => prev.filter((_, idx) => idx !== i)); setDirty(true); setSaved(false); }}
                  className="p-1 text-indigo-400 hover:text-red-500 transition-colors">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
            {budgetPostes.length > 0 && (
              <div className="text-right text-xs font-bold text-indigo-700 pt-1 border-t border-indigo-100">
                Total : {formatEuros(budgetPostes.reduce((s, p) => s + (parseFloat(p.montant) || 0), 0))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Progression du vote */}
      {presences.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-gray-500 px-1">
          <div className="flex-1 bg-gray-100 rounded-full h-1.5">
            <div className="bg-blue-400 h-1.5 rounded-full transition-all" style={{ width: `${presences.length > 0 ? Math.round((votesCount / presences.length) * 100) : 0}%` }} />
          </div>
          <span>{votesCount}/{presences.length} ont voté</span>
        </div>
      )}

      {/* Grille de vote */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="divide-y divide-gray-100">
          {presences.map((p) => {
            const current = votes[p.coproprietaire_id] ?? null;
            return (
              <div key={p.coproprietaire_id}
                className="flex items-center justify-between gap-2 px-3 py-2 hover:bg-gray-50">
                <div className="min-w-0 flex items-baseline gap-1.5 flex-wrap">
                  <span className="text-sm text-gray-800 font-medium">{getName(p.coproprietaire_id)}</span>
                  <span className="text-[11px] text-gray-400 shrink-0">{tantiemesMap[p.coproprietaire_id] ?? 0} tant.</span>
                  {p.statut === 'represente' && p.represente_par_id && (
                    <span className="text-xs text-blue-500 shrink-0">(Repr. par {getName(p.represente_par_id)})</span>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {VOTE_OPTIONS.map((opt) => (
                    <button key={opt.value} type="button" disabled={!canEdit}
                      onClick={() => handleVote(p.coproprietaire_id, opt.value)}
                      className={`px-2 py-0.5 text-xs font-semibold rounded-md border transition-colors ${
                        current === opt.value ? opt.activeClass : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'
                      } ${canEdit ? 'cursor-pointer' : 'cursor-default'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Barre basse */}
        <div className="border-t border-gray-100 px-3 py-2 bg-gray-50 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
              <span>Pour : <strong className="text-green-700">{tantPourLive}</strong> tant. ({pourCount})</span>
              <span>Contre : <strong className="text-red-600">{tantContreLive}</strong> tant. ({contreCount})</span>
              <span>Abst. : {tantAbstLive} tant. ({abstentionCount})</span>
              {majorite === 'article_25' && totalTantiemes > 0 && (
                <span className="text-gray-400">/ {totalTantiemes} tot.</span>
              )}
            </div>
            {canEdit && (
              <div className="flex items-center gap-1.5">
                {isOptional && (
                  <Button size="sm" variant="secondary" onClick={handleSkip} loading={saving}>
                    <SkipForward size={12} /> Passer
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={handleSave}
                  loading={saving}
                  disabled={!dirty || votesCount < presences.length || (passerelleDisponible && !passerelleActive)}
                  title={
                    votesCount < presences.length
                      ? `${presences.length - votesCount} vote(s) manquant(s) — tous les présents doivent voter`
                      : (passerelleDisponible && !passerelleActive)
                      ? 'La passerelle Art. 25-1 est disponible — activez-la ou ignorez-la avant d\'enregistrer'
                      : undefined
                  }
                >
                  <Save size={12} /> Enregistrer
                </Button>
              </div>
            )}
          </div>
          {tentativeStatut && (
            <div className={`text-xs font-semibold flex items-center gap-1.5 ${
              tentativeStatut === 'approuvee' ? 'text-green-600' : 'text-red-600'
            }`}>
              {tentativeStatut === 'approuvee' ? 'Serait adoptée' : 'Serait refusée'}
              {majorite && <span className="font-normal text-gray-400">({majoriteLabel[majorite]})</span>}
            </div>
          )}

          {/* Passerelle Art. 25-1 */}
          {passerelleDisponible && !passerelleActive && (
            <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-900 flex items-start gap-2">
              <AlertTriangle size={13} className="shrink-0 mt-0.5 text-amber-700" />
              <div className="flex-1 space-y-1">
                <p className="font-semibold">⚠️ Passerelle Art. 25-1 disponible — décision requise avant d&apos;enregistrer</p>
                <p className="text-amber-800">
                  La résolution a obtenu <strong>{tantPourLive}</strong> tant. sur <strong>{totalTantiemes}</strong> (≥ 1/3),
                  sans atteindre la majorité absolue (&gt; 50 %). L&apos;assemblée peut immédiatement voter à la majorité simple (Art. 24).
                </p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <button type="button"
                    onClick={() => { setPasserelleActive(true); setDirty(true); setSaved(false); }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-600 text-white rounded-md font-semibold text-[11px] hover:bg-amber-700 transition-colors">
                    <Zap size={11} /> Activer la passerelle (vote Art. 24)
                  </button>
                  <button type="button"
                    onClick={() => { setPasserelleActive(false); setDirty(true); setSaved(false); }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-200 text-gray-700 rounded-md font-semibold text-[11px] hover:bg-gray-300 transition-colors">
                    Ne pas utiliser — résolution refusée
                  </button>
                </div>
              </div>
            </div>
          )}
          {passerelleActive && (
            <div className="p-2 bg-amber-100 border border-amber-400 rounded-lg text-xs text-amber-900 flex items-center gap-2">
              <Zap size={12} className="text-amber-600 shrink-0" />
              <span className="font-semibold flex-1">Passerelle Art. 25-1 active — vote évalué à la majorité simple (Art. 24)</span>
              <button type="button"
                onClick={() => { setPasserelleActive(false); setDirty(true); setSaved(false); }}
                className="text-[11px] text-amber-700 underline hover:text-amber-900 shrink-0">
                Désactiver
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}