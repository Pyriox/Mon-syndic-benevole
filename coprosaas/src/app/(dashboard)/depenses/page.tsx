// ============================================================
// Page : Liste des dépenses avec répartition automatique
// ============================================================
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Dépenses et charges' };

import { createClient } from '@/lib/supabase/server';
import { requireCoproAccess } from '@/lib/supabase/require-copro-access';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import DepenseActions, { DepenseDelete } from './DepenseActions';
import AnneeSelector from '@/components/ui/AnneeSelector';
import {
  calculerPart,
  filterLotsByRepartitionScope,
  formatEuros,
  formatDate,
  formatRepartitionScope,
  getLotTantiemesForRepartitionScope,
  LABELS_CATEGORIE,
} from '@/lib/utils';
import { Receipt, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { hasChargesSpecialesAddon, isSubscribed } from '@/lib/subscription';
import UpgradeBanner from '@/components/ui/UpgradeBanner';
import ReadOnlyBanner from '@/components/ui/ReadOnlyBanner';
import PageHelp from '@/components/ui/PageHelp';

const catColorMap: Record<string, string> = {
  entretien:          'bg-orange-400',
  assurance:          'bg-blue-400',
  eau:                'bg-cyan-400',
  electricite:        'bg-purple-400',
  ascenseur:          'bg-indigo-400',
  espaces_verts:      'bg-green-400',
  nettoyage:          'bg-teal-400',
  administration:     'bg-gray-400',
  travaux:            'bg-yellow-400',
  fonds_travaux_alur: 'bg-amber-500',
  syndic_benevole:    'bg-blue-600',
  autre:              'bg-slate-300',
};

// Couleur du badge selon la catégorie
function couleurCategorie(cat: string): 'default' | 'info' | 'success' | 'warning' | 'purple' {
  const map: Record<string, 'default' | 'info' | 'success' | 'warning' | 'purple'> = {
    travaux: 'warning',
    fonds_travaux_alur: 'warning',
    syndic_benevole: 'info',
    assurance: 'info',
    eau: 'info',
    electricite: 'purple',
    entretien: 'success',
    administration: 'default',
  };
  return map[cat] ?? 'default';
}

type DepenseScopeLike = {
  id: string;
  montant: number;
  repartition_type?: 'generale' | 'groupe' | null;
  repartition_cible?: string | null;
};

type LotScopeLike = {
  id: string;
  tantiemes: number;
  coproprietaire_id: string | null;
  groupes_repartition?: string[] | null;
  tantiemes_groupes?: Record<string, number> | null;
};

type RepartitionDepenseRow = {
  depense_id: string;
  coproprietaire_id: string;
  montant_du: number | null;
};

function roundEuros(value: number): number {
  return Math.round(value * 100) / 100;
}

function compareScopeLabels(a: string, b: string) {
  if (a === 'Charges communes') return -1;
  if (b === 'Charges communes') return 1;
  return a.localeCompare(b, 'fr');
}

function summarizeExpenseScopes(depenses: DepenseScopeLike[]) {
  const labels = Array.from(new Set(
    depenses.map((depense) => formatRepartitionScope(depense.repartition_type, depense.repartition_cible))
  )).sort(compareScopeLabels);

  if (labels.length === 0 || (labels.length === 1 && labels[0] === 'Charges communes')) {
    return { isGeneralOnly: true, label: 'Charges communes' };
  }

  if (labels.length === 1) {
    return { isGeneralOnly: false, label: labels[0] };
  }

  return {
    isGeneralOnly: false,
    label: labels.length <= 2 ? labels.join(' + ') : 'Variable selon la dépense',
  };
}

function getScopeWeights(
  lots: LotScopeLike[],
  type?: 'generale' | 'groupe' | null,
  target?: string | null,
) {
  const scopedLots = filterLotsByRepartitionScope(lots, type, target);
  const weightByOwner: Record<string, number> = {};

  for (const lot of scopedLots) {
    if (!lot.coproprietaire_id) continue;
    const weight = getLotTantiemesForRepartitionScope(lot, type, target);
    if (weight <= 0) continue;
    weightByOwner[lot.coproprietaire_id] = (weightByOwner[lot.coproprietaire_id] ?? 0) + weight;
  }

  const totalWeight = Object.values(weightByOwner).reduce((sum, weight) => sum + weight, 0);
  return { weightByOwner, totalWeight };
}

function computeExpensePartsByOwner(
  depenses: DepenseScopeLike[],
  lots: LotScopeLike[],
  repartitionsDepenses: RepartitionDepenseRow[],
) {
  const totals: Record<string, number> = {};
  const explicitByDepense = new Map<string, RepartitionDepenseRow[]>();

  for (const row of repartitionsDepenses) {
    if (!row.depense_id || !row.coproprietaire_id) continue;
    explicitByDepense.set(row.depense_id, [...(explicitByDepense.get(row.depense_id) ?? []), row]);
  }

  for (const depense of depenses) {
    const explicitRows = explicitByDepense.get(depense.id) ?? [];

    if (explicitRows.length > 0) {
      for (const row of explicitRows) {
        totals[row.coproprietaire_id] = roundEuros((totals[row.coproprietaire_id] ?? 0) + Number(row.montant_du ?? 0));
      }
      continue;
    }

    const { weightByOwner, totalWeight } = getScopeWeights(lots, depense.repartition_type, depense.repartition_cible);
    if (totalWeight <= 0) continue;

    for (const [coproprietaireId, weight] of Object.entries(weightByOwner)) {
      totals[coproprietaireId] = roundEuros((totals[coproprietaireId] ?? 0) + calculerPart(depense.montant, weight, totalWeight));
    }
  }

  return totals;
}

function computeExpenseBreakdownByScope(
  depenses: DepenseScopeLike[],
  lots: LotScopeLike[],
  repartitionsDepenses: RepartitionDepenseRow[],
) {
  const breakdown = new Map<string, {
    label: string;
    totalAmount: number;
    ownerAmounts: Record<string, number>;
    weightByOwner: Record<string, number>;
    totalWeight: number;
  }>();
  const explicitByDepense = new Map<string, RepartitionDepenseRow[]>();

  for (const row of repartitionsDepenses) {
    if (!row.depense_id || !row.coproprietaire_id) continue;
    explicitByDepense.set(row.depense_id, [...(explicitByDepense.get(row.depense_id) ?? []), row]);
  }

  for (const depense of depenses) {
    const label = formatRepartitionScope(depense.repartition_type, depense.repartition_cible);
    const { weightByOwner, totalWeight } = getScopeWeights(lots, depense.repartition_type, depense.repartition_cible);
    const entry = breakdown.get(label) ?? {
      label,
      totalAmount: 0,
      ownerAmounts: {},
      weightByOwner,
      totalWeight,
    };

    entry.totalAmount = roundEuros(entry.totalAmount + depense.montant);
    if (entry.totalWeight <= 0 && totalWeight > 0) {
      entry.weightByOwner = weightByOwner;
      entry.totalWeight = totalWeight;
    }

    const explicitRows = explicitByDepense.get(depense.id) ?? [];
    if (explicitRows.length > 0) {
      for (const row of explicitRows) {
        entry.ownerAmounts[row.coproprietaire_id] = roundEuros((entry.ownerAmounts[row.coproprietaire_id] ?? 0) + Number(row.montant_du ?? 0));
      }
      breakdown.set(label, entry);
      continue;
    }

    if (totalWeight <= 0) {
      breakdown.set(label, entry);
      continue;
    }

    for (const [coproprietaireId, weight] of Object.entries(weightByOwner)) {
      entry.ownerAmounts[coproprietaireId] = roundEuros((entry.ownerAmounts[coproprietaireId] ?? 0) + calculerPart(depense.montant, weight, totalWeight));
    }

    breakdown.set(label, entry);
  }

  return Array.from(breakdown.values()).sort((a, b) => compareScopeLabels(a.label, b.label));
}

export default async function DepensesPage({ searchParams }: { searchParams: Promise<{ annee?: string; page?: string }> }) {
  const { annee: anneeParam, page: pageParam } = await searchParams;
  const annee = parseInt(anneeParam ?? String(new Date().getFullYear()));
  const PAGE_SIZE = 25;
  const currentPage = Math.max(1, parseInt(pageParam ?? '1') || 1);

  const supabase = await createClient();
  const { user, selectedCoproId, role: userRole, copro: copropriete } = await requireCoproAccess();

  // ================================================================
  // VUE LECTURE SEULE — Copropriétaires
  // ================================================================
  if (userRole === 'copropriétaire') {
    const admin = supabase; // Les RLS policies autorisent la lecture pour les deux rôles
    const scopeId = selectedCoproId ?? 'none';

    const [{ data: depenses }, { data: lots }, { data: coproprietaires }] = await Promise.all([
      admin
        .from('depenses')
        .select('id, titre, description, montant, date_depense, categorie, piece_jointe_url, repartition_type, repartition_cible')
        .eq('copropriete_id', scopeId)
        .gte('date_depense', `${annee}-01-01`)
        .lt('date_depense', `${annee + 1}-01-01`)
        .order('date_depense', { ascending: false }),
      admin
        .from('lots')
        .select('id, tantiemes, coproprietaire_id, groupes_repartition, tantiemes_groupes')
        .eq('copropriete_id', scopeId)
        .not('coproprietaire_id', 'is', null),
      admin
        .from('coproprietaires')
        .select('id, nom, prenom, user_id, email')
        .eq('copropriete_id', scopeId)
        .order('nom'),
    ]);

    const depenseIds = (depenses ?? []).map((depense) => depense.id);
    const { data: repartitionsDepenses } = depenseIds.length > 0
      ? await admin
          .from('repartitions_depenses')
          .select('depense_id, coproprietaire_id, montant_du')
          .in('depense_id', depenseIds)
      : { data: [] as RepartitionDepenseRow[] };

    const totalDepenses = depenses?.reduce((sum, d) => sum + d.montant, 0) ?? 0;

    const repartitionCat: Record<string, number> = {};
    for (const d of depenses ?? []) {
      repartitionCat[d.categorie] = (repartitionCat[d.categorie] ?? 0) + d.montant;
    }
    const repartitionCatSorted = Object.entries(repartitionCat)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, total]) => ({ cat, total, pct: totalDepenses > 0 ? Math.round((total / totalDepenses) * 100) : 0 }));

    const totalTantiemes = (lots ?? []).reduce((sum, l) => sum + (l.tantiemes ?? 0), 0);
    const tantByOwner: Record<string, number> = {};
    for (const l of lots ?? []) {
      if (l.coproprietaire_id) tantByOwner[l.coproprietaire_id] = (tantByOwner[l.coproprietaire_id] ?? 0) + (l.tantiemes ?? 0);
    }

    const normalizedEmail = user.email?.trim().toLowerCase() ?? '';
    const myCopro = (coproprietaires ?? []).find((coproprietaire) => {
      const coproEmail = String(coproprietaire.email ?? '').trim().toLowerCase();
      return coproprietaire.user_id === user.id || (!coproprietaire.user_id && normalizedEmail && coproEmail === normalizedEmail);
    });
    const myTant = myCopro ? (tantByOwner[myCopro.id] ?? 0) : 0;
    const partsByOwner = computeExpensePartsByOwner(depenses ?? [], lots ?? [], (repartitionsDepenses ?? []) as RepartitionDepenseRow[]);
    const scopeBreakdown = computeExpenseBreakdownByScope(depenses ?? [], lots ?? [], (repartitionsDepenses ?? []) as RepartitionDepenseRow[]);
    const myPart = myCopro ? roundEuros(partsByOwner[myCopro.id] ?? 0) : 0;
    const myPct = totalDepenses > 0 ? myPart / totalDepenses : 0;
    const scopeSummary = summarizeExpenseScopes(depenses ?? []);
    const myScopeBreakdown = myCopro
      ? scopeBreakdown
          .map((scope) => ({
            ...scope,
            myAmount: roundEuros(scope.ownerAmounts[myCopro.id] ?? 0),
            myWeight: scope.weightByOwner[myCopro.id] ?? 0,
            myPct: scope.totalAmount > 0 ? (scope.ownerAmounts[myCopro.id] ?? 0) / scope.totalAmount : 0,
          }))
          .filter((scope) => scope.myAmount > 0)
      : [];
    const shouldShowDetailedBreakdown = myScopeBreakdown.some((scope) => scope.label !== 'Charges communes') || myScopeBreakdown.length > 1;

    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Dépenses</h2>
            <p className="text-gray-500 mt-1">
              {depenses?.length ?? 0} dépense(s) — Total : <strong>{formatEuros(totalDepenses)}</strong>
            </p>
          </div>
          <AnneeSelector annee={annee} />
        </div>

        <PageHelp tone="slate">
          Consultez ici les dépenses déjà enregistrées pour la copropriété et la part théorique qui vous revient selon vos tantièmes.
        </PageHelp>

        {depenses && depenses.length > 0 && (
          <div className="space-y-6">
            {/* Ma quote-part */}
            <Card>
              <h3 className="font-semibold text-gray-900 mb-4">Ma quote-part</h3>
              {myPart > 0 || myTant > 0 ? (
                <div className="space-y-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-sm text-gray-600">{scopeSummary.isGeneralOnly ? 'Mes tantièmes' : 'Base de calcul'}</span>
                    <span className="font-semibold text-gray-900 text-right">
                      {scopeSummary.isGeneralOnly ? `${myTant} / ${totalTantiemes}` : scopeSummary.label}
                    </span>
                  </div>
                  {shouldShowDetailedBreakdown ? (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Détail par clé</p>
                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        {myScopeBreakdown.map((scope) => (
                          <div key={scope.label} className="rounded-lg border border-slate-200 bg-white p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-medium text-gray-800">{scope.label}</p>
                                <p className="text-xs text-gray-500">
                                  {scope.totalWeight > 0
                                    ? `${scope.myWeight} / ${scope.totalWeight} ${scope.label === 'Charges communes' ? 'tantièmes' : 'sur la clé'}`
                                    : 'Calcul à partir des lignes enregistrées'}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-semibold text-gray-900">{formatEuros(scope.myAmount)}</p>
                                <p className="text-[11px] text-gray-500">sur {formatEuros(scope.totalAmount)}</p>
                              </div>
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                              <div className="h-1.5 flex-1 rounded-full bg-slate-100 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-blue-400"
                                  style={{ width: `${Math.min(Math.max(scope.myPct * 100, 0), 100)}%` }}
                                />
                              </div>
                              <span className="w-12 text-right text-xs font-semibold text-gray-700">
                                {(scope.myPct * 100).toFixed(1)}%
                              </span>
                            </div>
                            <p className="mt-1 text-[11px] text-gray-500">de cette clé</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : myScopeBreakdown[0] ? (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-gray-800">Récapitulatif</p>
                          <p className="text-xs text-gray-500">
                            {myScopeBreakdown[0].totalWeight > 0
                              ? `${myScopeBreakdown[0].myWeight} / ${myScopeBreakdown[0].totalWeight} tantièmes`
                              : 'Calcul à partir des lignes enregistrées'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">{formatEuros(myScopeBreakdown[0].myAmount)}</p>
                          <p className="text-[11px] text-gray-500">sur {formatEuros(myScopeBreakdown[0].totalAmount)}</p>
                        </div>
                      </div>
                    </div>
                  ) : null}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Ma part</span>
                    <span className="font-bold text-blue-700 text-lg">{formatEuros(myPart)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Pourcentage global</span>
                    <span className="font-semibold text-gray-700">{Math.round(myPct * 100)}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="bg-blue-400 h-full rounded-full" style={{ width: `${Math.round(myPct * 100)}%` }} />
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic text-center py-4">
                  Aucun lot associé à votre fiche pour calculer votre quote-part.
                </p>
              )}
            </Card>

            {/* Répartition par catégorie */}
            <Card>
              <h3 className="font-semibold text-gray-900 mb-4">Répartition par catégorie</h3>
              <div className="space-y-3">
                {repartitionCatSorted.map(({ cat, total, pct }) => (
                  <div key={cat}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${catColorMap[cat] ?? 'bg-gray-300'}`} />
                        <span className="text-gray-700 font-medium">{LABELS_CATEGORIE[cat] ?? cat}</span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-500">
                        <span>{formatEuros(total)}</span>
                        <span className="font-semibold text-gray-700 w-9 text-right">{pct}%</span>
                      </div>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`${catColorMap[cat] ?? 'bg-gray-300'} h-full rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                ))}
                <p className="text-xs text-gray-400 pt-2 border-t border-gray-100 text-right">
                  Total : <span className="font-semibold text-gray-600">{formatEuros(totalDepenses)}</span>
                </p>
              </div>
            </Card>
          </div>
        )}

        {depenses && depenses.length > 0 ? (
          <>
            {/* Mobile cards */}
            <div className="md:hidden space-y-2">
              {depenses.map((d) => (
                <Card key={d.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 truncate">{d.titre}</p>
                      {d.description && <p className="text-xs text-gray-400 truncate">{d.description}</p>}
                      <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                        <Badge variant={couleurCategorie(d.categorie)}>
                          {LABELS_CATEGORIE[d.categorie] ?? d.categorie}
                        </Badge>
                        <span className="text-xs text-gray-500">{formatDate(d.date_depense)}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-gray-900">{formatEuros(d.montant)}</p>
                      {d.piece_jointe_url && (
                        <a href={d.piece_jointe_url} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline">P.J.</a>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
              <p className="text-right text-sm font-semibold text-gray-700 px-1 pt-1">
                Total : {formatEuros(totalDepenses)}
              </p>
            </div>
            {/* Desktop table */}
            <Card padding="none" className="hidden md:block">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-5 py-3 font-medium text-gray-500">Date</th>
                      <th className="text-left px-5 py-3 font-medium text-gray-500">Titre</th>
                      <th className="text-left px-5 py-3 font-medium text-gray-500">Catégorie</th>
                      <th className="text-right px-5 py-3 font-medium text-gray-500">Montant</th>
                      <th className="text-center px-5 py-3 font-medium text-gray-500">P.J.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {depenses.map((d) => (
                      <tr key={d.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3 text-gray-500 whitespace-nowrap">{formatDate(d.date_depense)}</td>
                        <td className="px-5 py-3">
                          <p className="font-medium text-gray-900">{d.titre}</p>
                          {d.description && <p className="text-xs text-gray-400 truncate max-w-xs">{d.description}</p>}
                        </td>
                        <td className="px-5 py-3">
                          <Badge variant={couleurCategorie(d.categorie)}>
                            {LABELS_CATEGORIE[d.categorie] ?? d.categorie}
                          </Badge>
                        </td>
                        <td className="px-5 py-3 text-right font-semibold text-gray-900">{formatEuros(d.montant)}</td>
                        <td className="px-5 py-3 text-center">
                          {d.piece_jointe_url ? (
                            <a href={d.piece_jointe_url} target="_blank" rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-xs">Voir</a>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                    <tr>
                      <td colSpan={3} className="px-5 py-3 font-semibold text-gray-700">Total</td>
                      <td className="px-5 py-3 text-right font-bold text-gray-900">{formatEuros(totalDepenses)}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </Card>
          </>
        ) : (
          <EmptyState
            icon={<Receipt size={48} strokeWidth={1.5} />}
            title="Aucune dépense enregistrée"
            description="Aucune dépense n'a été saisie pour cette copropriété."
          />
        )}
      </div>
    );
  }

  // ================================================================
  // VUE SYNDIC
  // ================================================================
  const coproprietes = copropriete ? [{ id: copropriete.id, nom: copropriete.nom }] : [];
  const canWrite = isSubscribed(copropriete?.plan);

  // Toutes les données syndic en parallèle
  const scopeId = selectedCoproId ?? 'none';
  const [{ data: depDossierRaw }, { data: depenses }, { data: lots }, { data: coproprietaires }, { data: coproAddons }] = await Promise.all([
    // Dossier "Dépenses" pour lier les pièces jointes
    supabase
      .from('document_dossiers')
      .select('id')
      .eq('nom', 'Dépenses')
      .eq('syndic_id', user.id)
      .maybeSingle(),
    supabase
      .from('depenses')
      .select('id, copropriete_id, titre, description, montant, date_depense, categorie, piece_jointe_url, repartition_type, repartition_cible')
      .eq('copropriete_id', scopeId)
      .gte('date_depense', `${annee}-01-01`)
      .lt('date_depense', `${annee + 1}-01-01`)
      .order('date_depense', { ascending: true }),
    // Lots + coproprietaires pour la répartition par personne
    supabase
      .from('lots')
      .select('id, tantiemes, coproprietaire_id, groupes_repartition, tantiemes_groupes')
      .eq('copropriete_id', scopeId)
      .not('coproprietaire_id', 'is', null),
    supabase
      .from('coproprietaires')
      .select('id, nom, prenom, raison_sociale')
      .eq('copropriete_id', scopeId)
      .order('nom'),
    supabase
      .from('copro_addons')
      .select('addon_key, status, current_period_end, cancel_at_period_end')
      .eq('copropriete_id', scopeId),
  ]);

  const specialChargesEnabled = hasChargesSpecialesAddon(coproAddons ?? []);

  // Créer le dossier "Dépenses" s'il n'existe pas encore
  let depDossier = depDossierRaw;
  if (!depDossier) {
    const { data } = await supabase
      .from('document_dossiers')
      .insert({ nom: 'Dépenses', is_default: true, syndic_id: user.id })
      .select('id')
      .single();
    depDossier = data;
  }

  const depenseIds = (depenses ?? []).map((depense) => depense.id);
  const { data: repartitionsDepenses } = depenseIds.length > 0
    ? await supabase
        .from('repartitions_depenses')
        .select('depense_id, coproprietaire_id, montant_du')
        .in('depense_id', depenseIds)
    : { data: [] as RepartitionDepenseRow[] };

  // Calcul du total
  const totalDepenses = depenses?.reduce((sum, d) => sum + d.montant, 0) ?? 0;

  // Répartition par catégorie
  const repartitionCat: Record<string, number> = {};
  for (const d of depenses ?? []) {
    repartitionCat[d.categorie] = (repartitionCat[d.categorie] ?? 0) + d.montant;
  }
  const repartitionCatSorted = Object.entries(repartitionCat)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, total]) => ({
      cat,
      total,
      pct: totalDepenses > 0 ? Math.round((total / totalDepenses) * 100) : 0,
    }));

  const totalTantiemes = (lots ?? []).reduce((sum, l) => sum + (l.tantiemes ?? 0), 0);
  const tantByOwner: Record<string, number> = {};
  for (const l of lots ?? []) {
    if (l.coproprietaire_id) {
      tantByOwner[l.coproprietaire_id] = (tantByOwner[l.coproprietaire_id] ?? 0) + (l.tantiemes ?? 0);
    }
  }

  const scopeSummary = summarizeExpenseScopes(depenses ?? []);
  const partsByOwner = computeExpensePartsByOwner(depenses ?? [], lots ?? [], (repartitionsDepenses ?? []) as RepartitionDepenseRow[]);
  const repartitionCopro = (coproprietaires ?? [])
    .filter((c) => (partsByOwner[c.id] ?? 0) > 0 || (tantByOwner[c.id] ?? 0) > 0)
    .map((c) => {
      const tant = tantByOwner[c.id] ?? 0;
      const part = roundEuros(partsByOwner[c.id] ?? 0);
      const pct = totalDepenses > 0 ? Math.round((part / totalDepenses) * 100) : 0;
      return {
        id: c.id,
        nom: (c as unknown as { raison_sociale: string | null }).raison_sociale ?? `${c.prenom} ${c.nom}`,
        tant,
        part,
        pct,
      };
    })
    .sort((a, b) => b.part - a.part);

  // Pagination — slice uniquement pour l'affichage (les stats utilisent toutes les dépenses)
  const totalPages = Math.ceil((depenses?.length ?? 0) / PAGE_SIZE);
  const depensesPage = (depenses ?? []).slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* ── Bandeau lecture seule ── */}
      {!canWrite && <ReadOnlyBanner />}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dépenses</h2>
          <p className="text-gray-500 mt-1">
            {depenses?.length ?? 0} dépense(s) — Total : <strong>{formatEuros(totalDepenses)}</strong>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <AnneeSelector annee={annee} />
          {canWrite ? <DepenseActions coproprietes={coproprietes ?? []} depensesDossierId={depDossier?.id} specialChargesEnabled={specialChargesEnabled} /> : <UpgradeBanner compact />}
        </div>
      </div>

      <PageHelp>
        Enregistrez ici les factures et charges réellement payées par la copropriété pour suivre l’exécution du budget et préparer la régularisation annuelle.
      </PageHelp>

      {depenses && depenses.length > 0 ? (
        <>
          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {depensesPage.map((d) => (
              <Card key={d.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 truncate">{d.titre}</p>
                    {d.description && <p className="text-xs text-gray-400 truncate">{d.description}</p>}
                    <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                      <Badge variant={couleurCategorie(d.categorie)}>
                        {LABELS_CATEGORIE[d.categorie] ?? d.categorie}
                      </Badge>
                      <span className="text-xs text-gray-500">{formatDate(d.date_depense)}</span>
                      {d.piece_jointe_url && (
                        <a href={d.piece_jointe_url} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline">P.J.</a>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-gray-900">{formatEuros(d.montant)}</p>
                    <div className="flex items-center justify-end gap-1 mt-1">
                      {canWrite && (
                        <DepenseActions
                          coproprietes={coproprietes ?? []}
                          depensesDossierId={depDossier?.id}
                          depense={{
                            id: d.id,
                            copropriete_id: d.copropriete_id,
                            titre: d.titre,
                            categorie: d.categorie,
                            montant: d.montant,
                            date_depense: d.date_depense,
                            description: d.description ?? null,
                            piece_jointe_url: d.piece_jointe_url ?? null,
                            repartition_type: d.repartition_type ?? 'generale',
                            repartition_cible: d.repartition_cible ?? null,
                          }}
                          specialChargesEnabled={specialChargesEnabled}
                        />
                      )}
                      {canWrite && <DepenseDelete depenseId={d.id} coproprieteId={d.copropriete_id} />}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
            <p className="text-right text-sm font-semibold text-gray-700 px-1 pt-1">
              Total : {formatEuros(totalDepenses)}
            </p>
          </div>
          {/* Desktop table */}
          <Card padding="none" className="hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-5 py-3 font-medium text-gray-500">Date</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-500">Titre</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-500">Catégorie</th>
                    <th className="text-right px-5 py-3 font-medium text-gray-500">Montant</th>
                    <th className="text-center px-5 py-3 font-medium text-gray-500">P.J.</th>
                    <th className="text-center px-5 py-3 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {depensesPage.map((d) => (
                    <tr key={d.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 text-gray-500 whitespace-nowrap">{formatDate(d.date_depense)}</td>
                      <td className="px-5 py-3">
                        <p className="font-medium text-gray-900">{d.titre}</p>
                        {d.description && (
                          <p className="text-xs text-gray-400 truncate max-w-xs">{d.description}</p>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant={couleurCategorie(d.categorie)}>
                          {LABELS_CATEGORIE[d.categorie] ?? d.categorie}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-gray-900">
                        {formatEuros(d.montant)}
                      </td>
                      <td className="px-5 py-3 text-center">
                        {d.piece_jointe_url ? (
                          <a
                            href={d.piece_jointe_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-xs"
                          >
                            Voir
                          </a>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {canWrite && (
                            <DepenseActions
                              coproprietes={coproprietes ?? []}
                              depensesDossierId={depDossier?.id}
                              depense={{
                                id: d.id,
                                copropriete_id: d.copropriete_id,
                                titre: d.titre,
                                categorie: d.categorie,
                                montant: d.montant,
                                date_depense: d.date_depense,
                                description: d.description ?? null,
                                piece_jointe_url: d.piece_jointe_url ?? null,
                                repartition_type: d.repartition_type ?? 'generale',
                                repartition_cible: d.repartition_cible ?? null,
                              }}
                              specialChargesEnabled={specialChargesEnabled}
                            />
                          )}
                          {canWrite && <DepenseDelete depenseId={d.id} coproprieteId={d.copropriete_id} />}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                {/* Ligne de total */}
                <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                  <tr>
                    <td colSpan={3} className="px-5 py-3 font-semibold text-gray-700">Total</td>
                    <td className="px-5 py-3 text-right font-bold text-gray-900">{formatEuros(totalDepenses)}</td>
                    <td /><td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 py-2">
              {currentPage > 1 ? (
                <Link
                  href={`?annee=${annee}&page=${currentPage - 1}`}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  <ChevronLeft size={16} /> Précédent
                </Link>
              ) : (
                <span className="flex items-center gap-1 text-sm text-gray-300"><ChevronLeft size={16} /> Précédent</span>
              )}
              <span className="text-sm text-gray-600">
                Page <strong>{currentPage}</strong> / {totalPages}
              </span>
              {currentPage < totalPages ? (
                <Link
                  href={`?annee=${annee}&page=${currentPage + 1}`}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Suivant <ChevronRight size={16} />
                </Link>
              ) : (
                <span className="flex items-center gap-1 text-sm text-gray-300">Suivant <ChevronRight size={16} /></span>
              )}
            </div>
          )}
        </>
      ) : (
        <EmptyState
          icon={<Receipt size={48} strokeWidth={1.5} />}
          title="Aucune dépense enregistrée"
          description="Ajoutez vos dépenses pour calculer automatiquement la répartition entre copropriétaires."
          action={canWrite ? <DepenseActions coproprietes={coproprietes ?? []} depensesDossierId={depDossier?.id} showLabel specialChargesEnabled={specialChargesEnabled} /> : <UpgradeBanner />}
        />
      )}

      {/* Encarts de répartition — visibles uniquement si des dépenses existent */}
      {depenses && depenses.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Répartition par catégorie */}
          <Card>
            <h3 className="font-semibold text-gray-900 mb-4">Répartition par catégorie</h3>
            <div className="space-y-3">
              {repartitionCatSorted.map(({ cat, total, pct }) => (
                <div key={cat}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${catColorMap[cat] ?? 'bg-gray-300'}`} />
                      <span className="text-gray-700 font-medium">{LABELS_CATEGORIE[cat] ?? cat}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-500">
                      <span>{formatEuros(total)}</span>
                      <span className="font-semibold text-gray-700 w-9 text-right">{pct}%</span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`${catColorMap[cat] ?? 'bg-gray-300'} h-full rounded-full`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              ))}
              <p className="text-xs text-gray-400 pt-2 border-t border-gray-100 text-right">
                Total : <span className="font-semibold text-gray-600">{formatEuros(totalDepenses)}</span>
              </p>
            </div>
          </Card>

          {/* Répartition par copropriétaire */}
          <Card>
            <h3 className="font-semibold text-gray-900 mb-4">Répartition par copropriétaire</h3>
            {repartitionCopro.length > 0 ? (
              <div className="space-y-3">
                {repartitionCopro.map(({ id, nom, tant, part, pct }) => (
                  <div key={id}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full shrink-0 bg-blue-400" />
                        <span className="text-gray-700 font-medium">{nom}</span>
                        {scopeSummary.isGeneralOnly && <span className="text-gray-400">({tant} t.)</span>}
                      </div>
                      <div className="flex items-center gap-3 text-gray-500">
                        <span>{formatEuros(part)}</span>
                        <span className="font-semibold text-gray-700 w-9 text-right">{pct}%</span>
                      </div>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-400 h-full rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                ))}
                <p className="text-xs text-gray-400 pt-2 border-t border-gray-100 text-right">
                  Total : <span className="font-semibold text-gray-600">{formatEuros(totalDepenses)}</span>
                  <span className="ml-2 text-gray-300">·</span>
                  <span className="ml-2">{scopeSummary.isGeneralOnly ? `${totalTantiemes} tantièmes` : `Base : ${scopeSummary.label}`}</span>
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">
                Aucun lot attribué à des copropriétaires
              </p>
            )}
          </Card>

        </div>
      )}
    </div>
  );
}
