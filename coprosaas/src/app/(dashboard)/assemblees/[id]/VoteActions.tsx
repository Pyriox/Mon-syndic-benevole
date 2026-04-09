// ============================================================
// Client Component : Saisie rapide des votes d'une résolution
// Affiché inline dans la page AG quand statut = en_cours ou terminee
// Inclut la saisie du budget par poste de dépense
// ============================================================
'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CheckCircle, XCircle, MinusCircle, Plus, Trash2 } from 'lucide-react';
import { formatEuros, formatRepartitionScope } from '@/lib/utils';

type PosteBudget = {
  libelle: string;
  montant: number;
  repartition_type?: 'generale' | 'groupe' | null;
  repartition_cible?: string | null;
};

interface VoteActionsProps {
  resolutionId: string;
  voixPour: number;
  voixContre: number;
  voixAbstention: number;
  statut: string;
  budgetPostes?: PosteBudget[];
}

export default function VoteActions({
  resolutionId,
  voixPour,
  voixContre,
  voixAbstention,
  statut,
  budgetPostes = [],
}: VoteActionsProps) {
  const supabase = createClient();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [optimisticState, setOptimisticState] = useState<{
    votes: { voixPour: number; voixContre: number; voixAbstention: number; statut: string };
    budgetPostes: PosteBudget[];
  } | null>(null);
  const [form, setForm] = useState({
    voix_pour: String(voixPour),
    voix_contre: String(voixContre),
    voix_abstention: String(voixAbstention),
    statut,
  });

  const [postes, setPostes] = useState<{
    libelle: string;
    montant: string;
    repartition_type: 'generale' | 'groupe';
    repartition_cible: string;
  }[]>(
    budgetPostes.length > 0
      ? budgetPostes.map((p) => ({
        libelle: p.libelle,
        montant: String(p.montant),
        repartition_type: p.repartition_type === 'groupe' ? 'groupe' : 'generale',
        repartition_cible: p.repartition_cible ?? '',
      }))
      : []
  );
  const [showPostes, setShowPostes] = useState(budgetPostes.length > 0);

  const displayedVotes = optimisticState?.votes ?? {
    voixPour,
    voixContre,
    voixAbstention,
    statut,
  };
  const displayedBudgetPostes = optimisticState?.budgetPostes ?? budgetPostes;

  const openEditor = () => {
    setForm({
      voix_pour: String(displayedVotes.voixPour),
      voix_contre: String(displayedVotes.voixContre),
      voix_abstention: String(displayedVotes.voixAbstention),
      statut: displayedVotes.statut,
    });
    setPostes(
      displayedBudgetPostes.length > 0
        ? displayedBudgetPostes.map((p) => ({
          libelle: p.libelle,
          montant: String(p.montant),
          repartition_type: p.repartition_type === 'groupe' ? 'groupe' : 'generale',
          repartition_cible: p.repartition_cible ?? '',
        }))
        : []
    );
    setShowPostes(displayedBudgetPostes.length > 0);
    setEditing(true);
  };

  const totalBudget = postes.reduce((s, p) => s + (parseFloat(p.montant) || 0), 0);
  const addPoste = () => setPostes((prev) => [...prev, {
    libelle: '',
    montant: '',
    repartition_type: 'generale',
    repartition_cible: '',
  }]);
  const removePoste = (i: number) => setPostes((prev) => prev.filter((_, idx) => idx !== i));
  const updatePoste = (i: number, field: 'libelle' | 'montant', val: string) =>
    setPostes((prev) => prev.map((p, idx) => (idx === i ? { ...p, [field]: val } : p)));

  const handleSave = async () => {
    setLoading(true);
    const pour = parseInt(form.voix_pour) || 0;
    const contre = parseInt(form.voix_contre) || 0;

    let newStatut = form.statut;
    if (newStatut === 'en_attente' && (pour > 0 || contre > 0)) {
      newStatut = pour > contre ? 'approuvee' : 'refusee';
    }

    const postesValides = showPostes
      ? postes.filter((p) => p.libelle.trim()).map((p) => ({
        libelle: p.libelle.trim(),
        montant: parseFloat(p.montant) || 0,
        repartition_type: p.repartition_type,
        repartition_cible: p.repartition_type === 'groupe' ? (p.repartition_cible || null) : null,
      }))
      : [];

    await supabase.from('resolutions').update({
      voix_pour: pour,
      voix_contre: contre,
      voix_abstention: parseInt(form.voix_abstention) || 0,
      statut: newStatut,
      budget_postes: postesValides.length > 0 ? postesValides : null,
    }).eq('id', resolutionId);

    setOptimisticState({
      votes: {
        voixPour: pour,
        voixContre: contre,
        voixAbstention: parseInt(form.voix_abstention) || 0,
        statut: newStatut,
      },
      budgetPostes: postesValides,
    });
    setEditing(false);
    setLoading(false);
  };

  if (!editing) {
    return (
      <div className="mt-2">
        <button
          onClick={openEditor}
          className="flex items-center gap-3 text-xs text-gray-400 hover:text-blue-600 transition-colors group"
        >
          <span className="flex items-center gap-1 text-green-600">
            <CheckCircle size={12} /> {displayedVotes.voixPour}
          </span>
          <span className="flex items-center gap-1 text-red-500">
            <XCircle size={12} /> {displayedVotes.voixContre}
          </span>
          <span className="flex items-center gap-1 text-gray-400">
            <MinusCircle size={12} /> {displayedVotes.voixAbstention}
          </span>
          <span className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity text-[11px]">
            Modifier les votes
          </span>
        </button>
        {/* Affichage read-only des postes */}
        {displayedBudgetPostes.length > 0 && (
          <div className="mt-2 border border-indigo-100 rounded-lg overflow-hidden">
            <div className="bg-indigo-50 px-3 py-1.5 text-[11px] font-semibold text-indigo-700 uppercase tracking-wide">
              Budget voté — {formatEuros(displayedBudgetPostes.reduce((s, p) => s + p.montant, 0))}
            </div>
            <table className="w-full text-xs">
              <tbody>
                {displayedBudgetPostes.map((p, i) => (
                  <tr key={i} className="border-t border-gray-100">
                    <td className="px-3 py-1.5 text-gray-700">
                      <div>
                        <div>{p.libelle}</div>
                        <div className="text-[10px] text-gray-400">{formatRepartitionScope(p.repartition_type, p.repartition_cible)}</div>
                      </div>
                    </td>
                    <td className="px-3 py-1.5 text-right font-semibold text-gray-900">{formatEuros(p.montant)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Saisie des votes</p>
      <div className="grid grid-cols-4 gap-2">
        {/* Pour */}
        <div>
          <label className="block text-[11px] text-green-600 font-semibold mb-1">✓ Pour</label>
          <input
            type="number"
            min="0"
            value={form.voix_pour}
            onChange={(e) => setForm((p) => ({ ...p, voix_pour: e.target.value }))}
            className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
        {/* Contre */}
        <div>
          <label className="block text-[11px] text-red-500 font-semibold mb-1">✗ Contre</label>
          <input
            type="number"
            min="0"
            value={form.voix_contre}
            onChange={(e) => setForm((p) => ({ ...p, voix_contre: e.target.value }))}
            className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
        {/* Abstention */}
        <div>
          <label className="block text-[11px] text-gray-400 font-semibold mb-1">○ Abst.</label>
          <input
            type="number"
            min="0"
            value={form.voix_abstention}
            onChange={(e) => setForm((p) => ({ ...p, voix_abstention: e.target.value }))}
            className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
        {/* Résultat forcé */}
        <div>
          <label className="block text-[11px] text-gray-500 font-semibold mb-1">Décision</label>
          <select
            value={form.statut}
            onChange={(e) => setForm((p) => ({ ...p, statut: e.target.value }))}
            className="w-full text-xs border border-gray-200 rounded-lg px-1 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
          >
            <option value="en_attente">En attente</option>
            <option value="approuvee">Approuvée</option>
            <option value="refusee">Refusée</option>
            <option value="reportee">Reportée</option>
          </select>
        </div>
      </div>

      {/* Budget par poste de dépense */}
      <div className="border-t border-gray-200 pt-3">
        <div className="flex items-center justify-between mb-2">
          <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showPostes}
              onChange={(e) => {
                setShowPostes(e.target.checked);
                if (e.target.checked && postes.length === 0) addPoste();
              }}
              className="rounded"
            />
            <span className="font-semibold text-indigo-700">Résolution budgétaire — détailler par poste</span>
          </label>
          {showPostes && (
            <button
              type="button"
              onClick={addPoste}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
            >
              <Plus size={12} /> Ajouter
            </button>
          )}
        </div>
        {showPostes && (
          <div className="space-y-1.5 border border-indigo-100 rounded-lg p-2 bg-white">
            {postes.map((p, i) => (
              <div key={i} className="grid grid-cols-[1fr_auto_auto] gap-2 items-center">
                <input
                  type="text"
                  placeholder="Libellé du poste (ex : Entretien courant)"
                  value={p.libelle}
                  onChange={(e) => updatePoste(i, 'libelle', e.target.value)}
                  className="text-xs rounded-md border border-gray-200 px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                />
                <input
                  type="number"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  value={p.montant}
                  onChange={(e) => updatePoste(i, 'montant', e.target.value)}
                  className="w-24 text-xs rounded-md border border-gray-200 px-2 py-1.5 text-right focus:outline-none focus:ring-1 focus:ring-indigo-400"
                />
                <button
                  type="button"
                  onClick={() => removePoste(i)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
            {postes.length > 0 && (
              <div className="text-right text-xs font-bold text-indigo-700 pt-1 border-t border-indigo-100">
                Total : {formatEuros(totalBudget)}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        <button
          onClick={() => setEditing(false)}
          className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-200 transition-colors"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}
