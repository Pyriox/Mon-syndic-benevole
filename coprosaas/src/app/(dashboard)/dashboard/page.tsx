// ============================================================
// Dashboard principal — Vue synthétique de la copropriété
// Affiche les KPIs, dépenses récentes, incidents et AG à venir
// ============================================================
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import { formatEuros, formatDate, LABELS_CATEGORIE } from '@/lib/utils';
import {
  Users,
  AlertTriangle,
  CalendarDays,
  Receipt,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Minus,
  Building2,
  BellRing,
  Banknote,
  Scale,
} from 'lucide-react';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const cookieStore = await cookies();
  const selectedCoproId = cookieStore.get('selected_copro_id')?.value ?? null;

  // Copropriété sélectionnée
  const { data: copropriete } = selectedCoproId
    ? await supabase.from('coproprietes').select('id, nom, syndic_id').eq('id', selectedCoproId).maybeSingle()
    : { data: null };

  const scopeId = selectedCoproId ?? 'none';

  // Comptage réel des lots (la colonne nombre_lots est statique)
  const { count: nbLots } = await supabase
    .from('lots')
    .select('id', { count: 'exact', head: true })
    .eq('copropriete_id', scopeId);

  // Date seuil pour alertes impayés > 60 jours
  const sixtyDaysAgoStr = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Requêtes en parallèle pour les statistiques
  const currentYear = new Date().getFullYear();
  const prevYear = currentYear - 1;

  const [
    { data: depenses },
    { data: depensesAll },
    { data: depensesAnPasse },
    { data: coproprietaires },
    { data: incidents },
    { data: assemblees },
    { data: appelsEchus },
    { data: appelsEncaisses },
  ] = await Promise.all([
    // Dépenses de l'année en cours (5 dernières pour l'encart)
    supabase
      .from('depenses')
      .select('id, titre, montant, date_depense, categorie')
      .eq('copropriete_id', scopeId)
      .gte('date_depense', `${currentYear}-01-01`)
      .lt('date_depense', `${currentYear + 1}-01-01`)
      .order('date_depense', { ascending: false })
      .limit(5),

    // Toutes les dépenses de l'année (pour la répartition)
    supabase
      .from('depenses')
      .select('categorie, montant')
      .eq('copropriete_id', scopeId)
      .gte('date_depense', `${currentYear}-01-01`)
      .lt('date_depense', `${currentYear + 1}-01-01`),

    // Dépenses de l'année précédente (tendance)
    supabase
      .from('depenses')
      .select('montant')
      .eq('copropriete_id', scopeId)
      .gte('date_depense', `${prevYear}-01-01`)
      .lt('date_depense', `${prevYear + 1}-01-01`),
    supabase
      .from('coproprietaires')
      .select('id, solde')
      .eq('copropriete_id', scopeId),

    // Incidents ouverts
    supabase
      .from('incidents')
      .select('id, titre, statut, priorite, date_declaration')
      .eq('copropriete_id', scopeId)
      .neq('statut', 'resolu')
      .order('date_declaration', { ascending: false })
      .limit(5),

    // AG à venir (hors terminées et annulées)
    supabase
      .from('assemblees_generales')
      .select('id, titre, date_ag, statut')
      .eq('copropriete_id', scopeId)
      .gte('date_ag', new Date().toISOString())
      .neq('statut', 'terminee')
      .neq('statut', 'annulee')
      .order('date_ag', { ascending: true })
      .limit(3),

    // Appels de fonds échus depuis > 60 jours (alertes impayés)
    supabase
      .from('appels_de_fonds')
      .select('id, date_echeance, lignes_appels_de_fonds(id, montant_du, paye)')
      .eq('copropriete_id', scopeId)
      .lt('date_echeance', sixtyDaysAgoStr),

    // Appels de fonds avec lignes payées (solde de trésorerie)
    supabase
      .from('lignes_appels_de_fonds')
      .select('montant_du, appels_de_fonds!inner(copropriete_id)')
      .eq('appels_de_fonds.copropriete_id', scopeId)
      .eq('paye', true),
  ]);

  // Calcul des KPIs
  const totalDepenses = depenses?.reduce((sum, d) => sum + d.montant, 0) ?? 0;
  const totalDepensesAnPasse = depensesAnPasse?.reduce((sum, d) => sum + d.montant, 0) ?? 0;

  // Tendance dépenses vs année précédente
  type Tendance = 'hausse' | 'baisse' | 'stable' | 'nouveau';
  let tendanceDepenses: Tendance = 'nouveau';
  let pctTendance = 0;
  if (totalDepensesAnPasse > 0) {
    pctTendance = Math.round(((totalDepenses - totalDepensesAnPasse) / totalDepensesAnPasse) * 100);
    if (Math.abs(pctTendance) <= 2) tendanceDepenses = 'stable';
    else if (pctTendance > 0) tendanceDepenses = 'hausse';
    else tendanceDepenses = 'baisse';
  }

  // Solde de trésorerie = encaissés − dépenses année courante
  type LigneEncaissee = { montant_du: number };
  const totalEncaisses = (appelsEncaisses as LigneEncaissee[] | null)?.reduce((sum, l) => sum + l.montant_du, 0) ?? 0;
  const soldeTresorerie = totalEncaisses - totalDepenses;
  const nbImpayés = coproprietaires?.filter((c) => c.solde < 0).length ?? 0;
  const totalMontantImpayé = coproprietaires
    ?.filter((c) => c.solde < 0)
    .reduce((sum, c) => sum + Math.abs(c.solde), 0) ?? 0;
  const nbIncidentsOuverts = incidents?.length ?? 0;
  const nbCoproprietaires = coproprietaires?.length ?? 0;

  // Alertes : impayés > 60 jours (lignes non réglées sur appels échus)
  type LigneEcheance = { id: string; montant_du: number; paye: boolean };
  const lignesImpayes60j = (appelsEchus ?? []).flatMap((a) =>
    ((a.lignes_appels_de_fonds ?? []) as LigneEcheance[]).filter((l) => !l.paye)
  );
  const nbImpayes60j = lignesImpayes60j.length;
  const montantImpayes60j = lignesImpayes60j.reduce((sum, l) => sum + l.montant_du, 0);

  // Alertes : incidents ouverts sans suivi depuis > 7 jours
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const incidentsAnciens = (incidents ?? []).filter(
    (i) => i.statut === 'ouvert' && new Date(i.date_declaration) < sevenDaysAgo
  );

  // Alerte : prochaine AG dans < 30 jours
  const prochaineAG = assemblees?.[0] ?? null;
  const joursAvantAG = prochaineAG
    ? Math.ceil((new Date(prochaineAG.date_ag).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;
  const agUrgente = joursAvantAG !== null && joursAvantAG <= 30;

  // Répartition des charges par catégorie
  const catColorMap: Record<string, { bar: string; dot: string }> = {
    entretien:          { bar: 'bg-orange-400',  dot: 'bg-orange-400' },
    assurance:          { bar: 'bg-blue-400',    dot: 'bg-blue-400' },
    eau:                { bar: 'bg-cyan-400',    dot: 'bg-cyan-400' },
    electricite:        { bar: 'bg-purple-400',  dot: 'bg-purple-400' },
    ascenseur:          { bar: 'bg-indigo-400',  dot: 'bg-indigo-400' },
    espaces_verts:      { bar: 'bg-green-400',   dot: 'bg-green-400' },
    nettoyage:          { bar: 'bg-teal-400',    dot: 'bg-teal-400' },
    administration:     { bar: 'bg-gray-400',    dot: 'bg-gray-400' },
    travaux:            { bar: 'bg-yellow-400',  dot: 'bg-yellow-400' },
    fonds_travaux_alur: { bar: 'bg-amber-500',   dot: 'bg-amber-500' },
    autre:              { bar: 'bg-slate-300',   dot: 'bg-slate-300' },
  };
  const repartitionRaw: Record<string, number> = {};
  for (const d of depensesAll ?? []) {
    repartitionRaw[d.categorie] = (repartitionRaw[d.categorie] ?? 0) + d.montant;
  }
  const totalRepartition = Object.values(repartitionRaw).reduce((s, v) => s + v, 0);
  const repartition = Object.entries(repartitionRaw)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7)
    .map(([cat, total]) => ({
      cat,
      total,
      pct: totalRepartition > 0 ? Math.round((total / totalRepartition) * 100) : 0,
    }));

  return (
    <div className="space-y-6">
      {/* Titre de bienvenue */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Tableau de bord</h2>
        <p className="text-gray-500 mt-1">
          {copropriete
            ? `${nbLots ?? 0} lot(s) · ${nbCoproprietaires} copropriétaire(s)`
            : 'Sélectionnez une copropriété dans le menu de navigation'}
        </p>
      </div>

      {/* Alerte : AG dans moins de 30 jours */}
      {copropriete && agUrgente && prochaineAG && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <BellRing size={18} className="text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-800">
              Assemblée Générale dans{' '}
              <span className="inline-flex items-center bg-amber-100 text-amber-700 rounded-md px-2 py-0.5 text-xs font-bold">
                J&minus;{joursAvantAG}
              </span>
            </p>
            <p className="text-xs text-amber-700 mt-0.5 truncate">
              {prochaineAG.titre} &middot;{' '}
              {new Date(prochaineAG.date_ag).toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </p>
          </div>
          <Link
            href={`/assemblees/${prochaineAG.id}`}
            className="shrink-0 text-xs text-amber-700 hover:text-amber-900 font-semibold underline-offset-2 hover:underline"
          >
            Voir &rarr;
          </Link>
        </div>
      )}

      {/* Cas : aucune copropriété sélectionnée */}
      {!copropriete && (
        <Card className="text-center py-12">
          <Building2 size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700">Aucune copropriété sélectionnée</h3>
          <p className="text-gray-500 text-sm mt-1 mb-4">
            Choisissez une copropriété dans le sélecteur du menu de navigation.
          </p>
        </Card>
      )}

      {/* KPIs */}
      {copropriete && (
        <>
          {/* ── Ligne 1 : 3 KPIs financiers ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Solde de trésorerie */}
            <Card className="flex items-center gap-4">
              <div className={`p-3 rounded-xl shrink-0 ${soldeTresorerie >= 0 ? 'bg-indigo-100' : 'bg-orange-100'}`}>
                <Scale size={24} className={soldeTresorerie >= 0 ? 'text-indigo-600' : 'text-orange-600'} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Trésorerie</p>
                <p className={`text-2xl font-bold ${soldeTresorerie >= 0 ? 'text-indigo-700' : 'text-orange-600'}`}>
                  {soldeTresorerie >= 0 ? '+' : ''}{formatEuros(soldeTresorerie)}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">Encaissés − dépenses</p>
              </div>
            </Card>

            {/* Dépenses totales + tendance */}
            <Card className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl shrink-0">
                <Receipt size={24} className="text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Dépenses {currentYear}</p>
                <p className="text-2xl font-bold text-gray-900">{formatEuros(totalDepenses)}</p>
                {tendanceDepenses === 'hausse' && (
                  <p className="text-xs text-red-500 flex items-center gap-0.5 mt-0.5 font-medium">
                    <ArrowUp size={11} />{pctTendance}% vs {prevYear}
                  </p>
                )}
                {tendanceDepenses === 'baisse' && (
                  <p className="text-xs text-green-600 flex items-center gap-0.5 mt-0.5 font-medium">
                    <ArrowDown size={11} />{Math.abs(pctTendance)}% vs {prevYear}
                  </p>
                )}
                {tendanceDepenses === 'stable' && (
                  <p className="text-xs text-gray-400 flex items-center gap-0.5 mt-0.5">
                    <Minus size={11} />Stable vs {prevYear}
                  </p>
                )}
              </div>
            </Card>

            {/* Impayés */}
            <Card className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-xl shrink-0">
                <Banknote size={24} className="text-red-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Solde impayé</p>
                <p className={`text-2xl font-bold ${totalMontantImpayé > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                  {formatEuros(totalMontantImpayé)}
                </p>
                {nbImpayés > 0 && (
                  <p className="text-xs text-red-400 mt-0.5">
                    {nbImpayés} copropriétaire{nbImpayés > 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </Card>
          </div>

          {/* ── Ligne 2 : 2 KPIs opérationnels ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Incidents ouverts */}
            <Card className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-xl shrink-0">
                <AlertTriangle size={24} className="text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Incidents en cours</p>
                <p className="text-2xl font-bold text-gray-900">{nbIncidentsOuverts}</p>
                {nbIncidentsOuverts === 0 && <p className="text-xs text-green-500 mt-0.5">Aucun incident ouvert</p>}
              </div>
            </Card>

            {/* Copropriétaires */}
            <Card className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-xl shrink-0">
                <Users size={24} className="text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Copropriétaires</p>
                <p className="text-2xl font-bold text-gray-900">{nbCoproprietaires}</p>
                <p className="text-xs text-gray-400 mt-0.5">{nbLots ?? 0} lot{(nbLots ?? 0) > 1 ? 's' : ''}</p>
              </div>
            </Card>
          </div>

          {/* ── Deux colonnes : Dépenses | Répartition ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Dépenses récentes */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Dépenses {currentYear}</h3>
                <Link href="/depenses" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                  Voir tout <ArrowRight size={14} />
                </Link>
              </div>
              {depenses && depenses.length > 0 ? (
                <ul className="divide-y divide-gray-100">
                  {depenses.map((d) => {
                    const colors = catColorMap[d.categorie] ?? { bar: 'bg-gray-300', dot: 'bg-gray-300' };
                    return (
                      <li key={d.id} className="flex items-center justify-between py-2.5">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <span className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${colors.dot}`} />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{d.titre}</p>
                            <p className="text-xs text-gray-400">
                              {LABELS_CATEGORIE[d.categorie] ?? d.categorie}
                              <span className="mx-1">·</span>
                              {formatDate(d.date_depense)}
                            </p>
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-gray-900 shrink-0 ml-3">{formatEuros(d.montant)}</span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">Aucune dépense enregistrée</p>
              )}
            </Card>

            {/* Répartition des charges */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Répartition des charges</h3>
                <span className="text-xs text-gray-400">{currentYear}</span>
              </div>
              {repartition.length > 0 ? (
                <div className="space-y-3">
                  {repartition.map(({ cat, total, pct }) => {
                    const colors = catColorMap[cat] ?? { bar: 'bg-gray-300', dot: 'bg-gray-300' };
                    return (
                      <div key={cat}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${colors.dot}`} />
                            <span className="text-gray-600 font-medium">{LABELS_CATEGORIE[cat] ?? cat}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-500">
                            <span>{formatEuros(total)}</span>
                            <span className="font-semibold text-gray-700 w-9 text-right">{pct}%</span>
                          </div>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`${colors.bar} h-full rounded-full transition-all`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                  <p className="text-xs text-gray-400 pt-2 border-t border-gray-100 text-right">
                    Total : <span className="font-semibold text-gray-600">{formatEuros(totalRepartition)}</span>
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">Aucune dépense enregistrée</p>
              )}
            </Card>
          </div>

          {/* Alertes & tâches à traiter */}
          {(nbImpayes60j > 0 || incidentsAnciens.length > 0) && (
            <Card padding="md">
              <div className="flex items-center gap-2 mb-4">
                <BellRing size={16} className="text-red-500" />
                <h3 className="font-semibold text-gray-900">Alertes &amp; tâches à traiter</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {nbImpayes60j > 0 && (
                  <div className="flex flex-wrap items-start gap-3 justify-between py-3">
                    <div className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 mt-1" />
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {nbImpayes60j} ligne{nbImpayes60j > 1 ? 's' : ''} impayée{nbImpayes60j > 1 ? 's' : ''} depuis plus de 60 jours
                        </p>
                        <p className="text-xs text-gray-400">Montant : {formatEuros(montantImpayes60j)}</p>
                      </div>
                    </div>
                    <Link href="/appels-de-fonds" className="text-xs text-blue-600 hover:underline font-medium shrink-0">
                      Voir &rarr;
                    </Link>
                  </div>
                )}
                {incidentsAnciens.length > 0 && (
                  <div className="flex flex-wrap items-start gap-3 justify-between py-3">
                    <div className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0 mt-1" />
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {incidentsAnciens.length} incident{incidentsAnciens.length > 1 ? 's' : ''} ouvert{incidentsAnciens.length > 1 ? 's' : ''} sans suivi depuis plus de 7 jours
                        </p>
                        <p className="text-xs text-gray-400 truncate max-w-xs">
                          {incidentsAnciens.map((i) => i.titre).join(', ')}
                        </p>
                      </div>
                    </div>
                    <Link href="/incidents" className="text-xs text-blue-600 hover:underline font-medium shrink-0">
                      Voir &rarr;
                    </Link>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* AG à venir */}
          {assemblees && assemblees.length > 0 && (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">
                  <CalendarDays size={18} className="inline mr-2 text-purple-600" />
                  Assemblées générales à venir
                </h3>
                <Link href="/assemblees" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                  Voir tout <ArrowRight size={14} />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {assemblees.map((ag) => (
                  <Link
                    key={ag.id}
                    href={`/assemblees/${ag.id}`}
                    className="p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    <p className="font-medium text-gray-800 text-sm">{ag.titre}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatDate(ag.date_ag)}</p>
                  </Link>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
