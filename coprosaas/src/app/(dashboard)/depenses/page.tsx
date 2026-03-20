// ============================================================
// Page : Liste des dépenses avec répartition automatique
// ============================================================
import { createClient } from '@/lib/supabase/server';
import { requireCoproAccess } from '@/lib/supabase/require-copro-access';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import DepenseActions, { DepenseDelete } from './DepenseActions';
import AnneeSelector from '@/components/ui/AnneeSelector';
import { formatEuros, formatDate, LABELS_CATEGORIE } from '@/lib/utils';
import { Receipt } from 'lucide-react';
import { isSubscribed } from '@/lib/subscription';
import UpgradeBanner from '@/components/ui/UpgradeBanner';
import ReadOnlyBanner from '@/components/ui/ReadOnlyBanner';

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
  autre:              'bg-slate-300',
};

// Couleur du badge selon la catégorie
function couleurCategorie(cat: string): 'default' | 'info' | 'success' | 'warning' | 'purple' {
  const map: Record<string, 'default' | 'info' | 'success' | 'warning' | 'purple'> = {
    travaux: 'warning',
    fonds_travaux_alur: 'warning',
    assurance: 'info',
    eau: 'info',
    electricite: 'purple',
    entretien: 'success',
    administration: 'default',
  };
  return map[cat] ?? 'default';
}

export default async function DepensesPage({ searchParams }: { searchParams: Promise<{ annee?: string }> }) {
  const { annee: anneeParam } = await searchParams;
  const annee = parseInt(anneeParam ?? String(new Date().getFullYear()));

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
        .select('id, titre, description, montant, date_depense, categorie, piece_jointe_url')
        .eq('copropriete_id', scopeId)
        .gte('date_depense', `${annee}-01-01`)
        .lt('date_depense', `${annee + 1}-01-01`)
        .order('date_depense', { ascending: false }),
      admin
        .from('lots')
        .select('id, tantiemes, coproprietaire_id')
        .eq('copropriete_id', scopeId)
        .not('coproprietaire_id', 'is', null),
      admin
        .from('coproprietaires')
        .select('id, nom, prenom')
        .eq('copropriete_id', scopeId)
        .order('nom'),
    ]);

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
    const myCopro = (coproprietaires ?? []).find((c) => tantByOwner[c.id]);
    const myTant = myCopro ? (tantByOwner[myCopro.id] ?? 0) : 0;
    const myPct = totalTantiemes > 0 ? myTant / totalTantiemes : 0;
    const myPart = totalDepenses * myPct;

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
                      <div className={`${catColorMap[cat] ?? 'bg-gray-300'} h-full rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                ))}
                <p className="text-xs text-gray-400 pt-2 border-t border-gray-100 text-right">
                  Total : <span className="font-semibold text-gray-600">{formatEuros(totalDepenses)}</span>
                </p>
              </div>
            </Card>

            {/* Ma quote-part */}
            <Card>
              <h3 className="font-semibold text-gray-900 mb-4">Ma quote-part</h3>
              {myTant > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Mes tantièmes</span>
                    <span className="font-semibold text-gray-900">{myTant} / {totalTantiemes}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Ma part</span>
                    <span className="font-bold text-blue-700 text-lg">{formatEuros(myPart)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Pourcentage</span>
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
          </div>
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
  const [{ data: depDossierRaw }, { data: depenses }, { data: lots }, { data: coproprietaires }] = await Promise.all([
    // Dossier "Dépenses" pour lier les pièces jointes
    supabase
      .from('document_dossiers')
      .select('id')
      .eq('nom', 'Dépenses')
      .eq('syndic_id', user.id)
      .maybeSingle(),
    supabase
      .from('depenses')
      .select('*')
      .eq('copropriete_id', scopeId)
      .gte('date_depense', `${annee}-01-01`)
      .lt('date_depense', `${annee + 1}-01-01`)
      .order('date_depense', { ascending: true }),
    // Lots + coproprietaires pour la répartition par personne
    supabase
      .from('lots')
      .select('id, tantiemes, coproprietaire_id')
      .eq('copropriete_id', scopeId)
      .not('coproprietaire_id', 'is', null),
    supabase
      .from('coproprietaires')
      .select('id, nom, prenom')
      .eq('copropriete_id', scopeId)
      .order('nom'),
  ]);

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

  // Répartition par copropriétaire (selon tantièmes)
  const totalTantiemes = (lots ?? []).reduce((sum, l) => sum + (l.tantiemes ?? 0), 0);
  const tantByOwner: Record<string, number> = {};
  for (const l of lots ?? []) {
    if (l.coproprietaire_id) {
      tantByOwner[l.coproprietaire_id] = (tantByOwner[l.coproprietaire_id] ?? 0) + (l.tantiemes ?? 0);
    }
  }
  const repartitionCopro = (coproprietaires ?? [])
    .filter((c) => tantByOwner[c.id])
    .map((c) => {
      const tant = tantByOwner[c.id] ?? 0;
      const pct = totalTantiemes > 0 ? tant / totalTantiemes : 0;
      return {
        id: c.id,
        nom: `${c.prenom} ${c.nom}`,
        tant,
        part: totalDepenses * pct,
        pct: Math.round(pct * 100),
      };
    })
    .sort((a, b) => b.part - a.part);

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
          {canWrite ? <DepenseActions coproprietes={coproprietes ?? []} depensesDossierId={depDossier?.id} /> : <UpgradeBanner compact />}
        </div>
      </div>

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
                          }}
                        />
                      )}
                      {canWrite && <DepenseDelete depenseId={d.id} />}
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
                  {depenses.map((d) => (
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
                              }}
                            />
                          )}
                          {canWrite && <DepenseDelete depenseId={d.id} />}
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
        </>
      ) : (
        <EmptyState
          icon={<Receipt size={48} strokeWidth={1.5} />}
          title="Aucune dépense enregistrée"
          description="Ajoutez vos dépenses pour calculer automatiquement la répartition entre copropriétaires."
          action={canWrite ? <DepenseActions coproprietes={coproprietes ?? []} depensesDossierId={depDossier?.id} showLabel /> : <UpgradeBanner />}
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
                        <span className="text-gray-400">({tant} t.)</span>
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
                  <span className="ml-2">{totalTantiemes} tantièmes</span>
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
