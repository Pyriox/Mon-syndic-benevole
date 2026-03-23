'use client';

import { useState, useMemo } from 'react';
import { updateSoldeReprise, updateModeLigne } from './actions';
import Card from '@/components/ui/Card';
import { formatEuros } from '@/lib/utils';
import { CheckCircle2, Clock, RefreshCw, TrendingDown, TrendingUp, Minus } from 'lucide-react';

type CoproEntry = {
  id?: string;
  nom: string | null;
  prenom: string | null;
  raison_sociale: string | null;
} | null;

type LigneRaw = {
  id: string;
  coproprietaire_id: string;
  montant_appele: number;
  montant_reel: number;
  solde_reprise: number;
  balance: number;
  mode: 'en_attente' | 'imputation' | 'remboursement';
  coproprietaires: CoproEntry | CoproEntry[];
};

interface Props {
  lignes: LigneRaw[];
  isCloture: boolean;
  isSyndic: boolean;
  canWrite: boolean;
}

type Mode = 'en_attente' | 'imputation' | 'remboursement';

type RowState = {
  soldeReprise: number;
  mode: Mode;
  balance: number;
};

function ownerName(c: LigneRaw['coproprietaires']): string {
  const val = Array.isArray(c) ? c[0] : c;
  if (!val) return '—';
  return val.raison_sociale ?? (`${val.prenom ?? ''} ${val.nom ?? ''}`.trim() || '—');
}

// ── Solde coloré ──────────────────────────────────────────────────────────────
function BalanceCell({ balance, bold }: { balance: number; bold?: boolean }) {
  const isPos = balance > 0;
  const isNeg = balance < 0;
  return (
    <span className={`${bold ? 'text-base' : 'text-sm'} font-bold inline-flex items-center gap-1 ${isPos ? 'text-red-600' : isNeg ? 'text-green-600' : 'text-gray-400'}`}>
      {isPos && <TrendingUp size={13} />}
      {isNeg && <TrendingDown size={13} />}
      {!isPos && !isNeg && <Minus size={13} />}
      {isPos ? '+' : ''}{formatEuros(balance)}
    </span>
  );
}

// ── Champ solde de reprise ────────────────────────────────────────────────────
function SoldeInput({ ligneId, value, onChange }: {
  ligneId: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const [local, setLocal] = useState(value === 0 ? '' : value.toString());
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const num = parseFloat(local) || 0;
    onChange(num);
    setSaving(true);
    await updateSoldeReprise(ligneId, num);
    setSaving(false);
  };

  return (
    <input
      type="number"
      step="0.01"
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={save}
      onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
      disabled={saving}
      placeholder="0"
      className="w-24 text-sm text-right border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50"
    />
  );
}

// ── Sélecteur de mode ─────────────────────────────────────────────────────────
function ModePicker({ ligneId, value, onChange }: {
  ligneId: string;
  value: Mode;
  onChange: (v: Mode) => void;
}) {
  const [saving, setSaving] = useState(false);

  const handleChange = async (newMode: Mode) => {
    onChange(newMode);
    setSaving(true);
    await updateModeLigne(ligneId, newMode);
    setSaving(false);
  };

  return (
    <select
      value={value}
      onChange={(e) => handleChange(e.target.value as Mode)}
      disabled={saving}
      className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50 bg-white"
    >
      <option value="en_attente">En attente</option>
      <option value="imputation">Imputé prochain appel</option>
      <option value="remboursement">Remboursement direct</option>
    </select>
  );
}

function ModeBadge({ mode }: { mode: Mode }) {
  if (mode === 'imputation') return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
      <RefreshCw size={11} /> Imputé prochain appel
    </span>
  );
  if (mode === 'remboursement') return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
      <CheckCircle2 size={11} /> Remboursement direct
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
      <Clock size={11} /> En attente
    </span>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────
export default function RegularisationTable({ lignes, isCloture, isSyndic, canWrite }: Props) {
  const canEdit = isSyndic && canWrite && !isCloture;

  const [rowStates, setRowStates] = useState<Record<string, RowState>>(() =>
    Object.fromEntries(lignes.map((l) => [
      l.id,
      { soldeReprise: l.solde_reprise, mode: l.mode, balance: l.balance },
    ]))
  );

  const hasReprises = Object.values(rowStates).some((r) => r.soldeReprise !== 0);

  const updateLocalSolde = (id: string, solde: number, montantReel: number, montantAppele: number) => {
    setRowStates((prev) => ({
      ...prev,
      [id]: { ...prev[id], soldeReprise: solde, balance: montantReel - montantAppele + solde },
    }));
  };

  const updateLocalMode = (id: string, mode: Mode) => {
    setRowStates((prev) => ({ ...prev, [id]: { ...prev[id], mode } }));
  };

  const totals = useMemo(() => ({
    totalAppele: lignes.reduce((s, l) => s + l.montant_appele, 0),
    totalReel: lignes.reduce((s, l) => s + l.montant_reel, 0),
    totalBalance: Object.values(rowStates).reduce((s, r) => s + r.balance, 0),
  }), [lignes, rowStates]);

  const showRepriseCol = hasReprises || canEdit;

  return (
    <>
      {/* Note 1ère année */}
      {canEdit && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 flex items-start gap-2">
          <span className="font-semibold shrink-0">1ère année ?</span>
          <span>
            Si vous venez d&apos;une autre plateforme, saisissez le <strong>solde de reprise</strong> de
            chaque copropriétaire issu de votre ancienne gestion.
            Ce montant est intégré dans le solde final&nbsp;:
            positif = il vous doit encore de l&apos;argent&nbsp;; négatif = vous lui en devez.
          </span>
        </div>
      )}

      {/* ── Table desktop ── */}
      <Card padding="none" className="hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Copropriétaire</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Provisions appelées</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Dépenses réelles</th>
                {showRepriseCol && (
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Solde reprise</th>
                )}
                <th className="text-right px-4 py-3 font-medium text-gray-500">Solde final</th>
                {isSyndic && (
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Mode règlement</th>
                )}
              </tr>
            </thead>
            <tbody>
              {lignes.map((l) => {
                const state = rowStates[l.id];
                return (
                  <tr key={l.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {ownerName(l.coproprietaires)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">{formatEuros(l.montant_appele)}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{formatEuros(l.montant_reel)}</td>
                    {showRepriseCol && (
                      <td className="px-4 py-3 text-right">
                        {canEdit ? (
                          <SoldeInput
                            ligneId={l.id}
                            value={state.soldeReprise}
                            onChange={(v) => updateLocalSolde(l.id, v, l.montant_reel, l.montant_appele)}
                          />
                        ) : (
                          <span className={state.soldeReprise !== 0 ? 'font-medium text-gray-800' : 'text-gray-400'}>
                            {state.soldeReprise !== 0 ? formatEuros(state.soldeReprise) : '—'}
                          </span>
                        )}
                      </td>
                    )}
                    <td className="px-4 py-3 text-right">
                      <BalanceCell balance={state.balance} />
                    </td>
                    {isSyndic && (
                      <td className="px-4 py-3">
                        {canEdit ? (
                          <ModePicker
                            ligneId={l.id}
                            value={state.mode}
                            onChange={(m) => updateLocalMode(l.id, m)}
                          />
                        ) : (
                          <ModeBadge mode={state.mode} />
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-gray-50 border-t-2 border-gray-200">
              <tr>
                <td className="px-4 py-3 font-semibold text-gray-700">Total</td>
                <td className="px-4 py-3 text-right font-semibold text-gray-700">{formatEuros(totals.totalAppele)}</td>
                <td className="px-4 py-3 text-right font-semibold text-gray-700">{formatEuros(totals.totalReel)}</td>
                {showRepriseCol && <td />}
                <td className="px-4 py-3 text-right">
                  <BalanceCell balance={totals.totalBalance} bold />
                </td>
                {isSyndic && <td />}
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* ── Cartes mobile ── */}
      <div className="md:hidden space-y-3">
        {lignes.map((l) => {
          const state = rowStates[l.id];
          return (
            <Card key={l.id}>
              <div className="flex items-start justify-between gap-3">
                <p className="font-semibold text-gray-900">{ownerName(l.coproprietaires)}</p>
                <BalanceCell balance={state.balance} bold />
              </div>
              <div className="mt-3 space-y-1.5 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Provisions appelées</span>
                  <span>{formatEuros(l.montant_appele)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Dépenses réelles</span>
                  <span>{formatEuros(l.montant_reel)}</span>
                </div>
                {showRepriseCol && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Solde reprise</span>
                    {canEdit ? (
                      <SoldeInput
                        ligneId={l.id}
                        value={state.soldeReprise}
                        onChange={(v) => updateLocalSolde(l.id, v, l.montant_reel, l.montant_appele)}
                      />
                    ) : (
                      <span className="text-gray-600">
                        {state.soldeReprise !== 0 ? formatEuros(state.soldeReprise) : '—'}
                      </span>
                    )}
                  </div>
                )}
              </div>
              {isSyndic && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  {canEdit ? (
                    <ModePicker
                      ligneId={l.id}
                      value={state.mode}
                      onChange={(m) => updateLocalMode(l.id, m)}
                    />
                  ) : (
                    <ModeBadge mode={state.mode} />
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </>
  );
}
