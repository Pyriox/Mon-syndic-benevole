// ============================================================
// Dashboard principal — Vue synthétique de la copropriété
// Affiche les KPIs, dépenses récentes, incidents et AG à venir
// ============================================================
import { createClient } from '@/lib/supabase/server';
import { requireCoproAccess } from '@/lib/supabase/require-copro-access';
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
  Wallet,
  TrendingUp,
  TrendingDown,
  Scale,
} from 'lucide-react';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { user, selectedCoproId, role: userRole, copro: copropriete } = await requireCoproAccess();

  const scopeId = selectedCoproId ?? 'none';

  // ── Tableau de bord copropriétaire ───────────────────────────────────────
  if (userRole === 'copropriétaire') {
    const [
      { data: fiche },
      { data: assembleesUpcoming },
    ] = await Promise.all([
      supabase
        .from('coproprietaires')
        .select('id, nom, prenom, raison_sociale, solde')
        .eq('copropriete_id', scopeId)
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('assemblees_generales')
        .select('id, titre, date_ag, statut')
        .eq('copropriete_id', scopeId)
        .gte('date_ag', new Date().toISOString().split('T')[0])
        .neq('statut', 'terminee')
        .neq('statut', 'annulee')
        .order('date_ag', { ascending: true })
        .limit(3),
    ]);

    const { data: chargesImpayees } = fiche
      ? await supabase
          .from('lignes_appels_de_fonds')
          .select('id, montant_du, appels_de_fonds!inner(id, titre, date_echeance)')
          .eq('coproprietaire_id', fiche.id)
          .eq('paye', false)
          .limit(5)
      : { data: null };

    const prochaineAG = assembleesUpcoming?.[0] ?? null;
    const joursAvantAG = prochaineAG
      ? Math.ceil((new Date(prochaineAG.date_ag).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null;
    const solde = fiche?.solde ?? 0;
    const displayFirstName =
      (fiche?.raison_sociale ? fiche.raison_sociale : (fiche?.prenom ?? fiche?.nom ?? '')).split(' ')[0] || null;

    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {displayFirstName ? `Bonjour, ${displayFirstName}` : 'Tableau de bord'}
          </h2>
          <p className="text-gray-500 mt-1">
            {copropriete ? copropriete.nom : 'Sélectionnez une copropriété dans le menu de navigation'}
          </p>
        </div>

        {!copropriete && (
          <Card className="text-center py-12">
            <Building2 size={48} className="mx-auto text-gray-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700">Vous n&apos;êtes rattaché à aucune copropriété</h3>
            <p className="text-gray-500 text-sm mt-2 max-w-sm mx-auto">
              Attendez l&apos;invitation de votre syndic pour accéder à votre espace copropriétaire.
            </p>
          </Card>
        )}

        {copropriete && (
          <>
            {/* Alerte AG imminente */}
            {prochaineAG && joursAvantAG !== null && joursAvantAG <= 30 && (
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <BellRing size={18} className="text-amber-700 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-amber-800">
                    Assemblée Générale dans{' '}
                    <span className="inline-flex items-center bg-amber-100 text-amber-700 rounded-md px-2 py-0.5 text-xs font-bold">
                      J&minus;{joursAvantAG}
                    </span>
                  </p>
                  <p className="text-xs text-amber-700 mt-0.5 truncate">
                    {prochaineAG.titre} &middot;{' '}
                    {new Date(prochaineAG.date_ag).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </p>
                </div>
                <Link href={`/assemblees/${prochaineAG.id}`}
                  className="shrink-0 text-xs text-amber-700 hover:text-amber-900 font-semibold underline-offset-2 hover:underline">
                  Voir &rarr;
                </Link>
              </div>
            )}

            {/* Fiche non liée */}
            {!fiche && (
              <Card className="text-center py-8">
                <p className="text-gray-500 text-sm italic">
                  Votre fiche copropriétaire n&apos;est pas encore associée à ce compte. Contactez votre syndic.
                </p>
              </Card>
            )}

            {fiche && (
              <>
                {/* KPIs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Mon solde */}
                  <Card className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl shrink-0 ${solde >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                      <Scale size={24} className={solde >= 0 ? 'text-green-600' : 'text-red-600'} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Mon solde</p>
                      <p className={`text-2xl font-bold ${solde >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                        {solde >= 0 ? '+' : ''}{formatEuros(solde)}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {solde >= 0 ? 'Avance de trésorerie' : 'Charges à régler'}
                      </p>
                    </div>
                  </Card>

                  {/* Prochaine AG */}
                  <Card className="flex items-center gap-4">
                    <div className="p-3 bg-purple-100 rounded-xl shrink-0">
                      <CalendarDays size={24} className="text-purple-600" />
                    </div>
                    {prochaineAG ? (
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Prochaine AG</p>
                        <p className="font-bold text-gray-900 truncate">{prochaineAG.titre}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {new Date(prochaineAG.date_ag).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Prochaine AG</p>
                        <p className="text-sm text-gray-500 mt-1 italic">Aucune AG planifiée</p>
                      </div>
                    )}
                  </Card>
                </div>

                {/* Charges à régler */}
                {chargesImpayees && chargesImpayees.length > 0 ? (
                  <Card>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900">Mes charges à régler</h3>
                      <Link href="/appels-de-fonds" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                        Voir tout <ArrowRight size={14} />
                      </Link>
                    </div>
                    <ul className="divide-y divide-gray-100">
                      {chargesImpayees.map((ligne) => {
                        type AppelRef = { id: string; titre: string; date_echeance: string };
                        const appel = ligne.appels_de_fonds as unknown as AppelRef;
                        return (
                          <li key={ligne.id} className="flex items-center justify-between py-2.5">
                            <div>
                              <p className="text-sm font-medium text-gray-800">{appel?.titre ?? 'Appel de fonds'}</p>
                              {appel?.date_echeance && (
                                <p className="text-xs text-gray-500">Échéance : {formatDate(appel.date_echeance)}</p>
                              )}
                            </div>
                            <span className="text-sm font-semibold text-red-600 shrink-0 ml-3">
                              {formatEuros(ligne.montant_du)}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </Card>
                ) : (
                  <Card>
                    <div className="flex items-center gap-3 py-1">
                      <div className="p-2 bg-green-100 rounded-lg shrink-0">
                        <Banknote size={18} className="text-green-600" />
                      </div>
                      <p className="text-sm font-medium text-green-700">Aucune charge en attente — vous êtes à jour !</p>
                    </div>
                  </Card>
                )}

                {/* AG à venir */}
                {assembleesUpcoming && assembleesUpcoming.length > 0 && (
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
                      {assembleesUpcoming.map((ag) => (
                        <Link key={ag.id} href={`/assemblees/${ag.id}`}
                          className="p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors">
                          <p className="font-medium text-gray-800 text-sm">{ag.titre}</p>
                          <p className="text-xs text-gray-500 mt-1">{formatDate(ag.date_ag)}</p>
                        </Link>
                      ))}
                    </div>
                  </Card>
                )}
              </>
            )}
          </>
        )}
      </div>
    );
  }

  // ── Tableau de bord syndic ────────────────────────────────────────────────
  const { count: nbLots } = await supabase
    .from('lots')
    .select('id', { count: 'exact', head: true })
    .eq('copropriete_id', scopeId);

  // Date seuil pour alertes impayés > 60 jours
  const todayStr = new Date().toISOString().split('T')[0];
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
    { data: appelsProvisions },
    { data: appelsEchusAujourdhui },
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

    // Provisions appelées de l'année (budget_previsionnel + fonds_travaux)
    supabase
      .from('appels_de_fonds')
      .select('montant_total, type_appel, montant_fonds_travaux')
      .eq('copropriete_id', scopeId)
      .gte('date_echeance', `${currentYear}-01-01`)
      .lt('date_echeance', `${currentYear + 1}-01-01`),

    // Lignes impayées d'appels émis dont l'échéance est dépassée (KPI solde impayé)
    supabase
      .from('lignes_appels_de_fonds')
      .select('montant_du, coproprietaire_id, appels_de_fonds!inner(copropriete_id, date_echeance, statut)')
      .eq('appels_de_fonds.copropriete_id', scopeId)
      .eq('appels_de_fonds.statut', 'publie')
      .lte('appels_de_fonds.date_echeance', todayStr)
      .eq('paye', false),
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

  // Appels budget prévisionnel seulement (base pour l'écart prévisionnel)
  const provisionsBP = (appelsProvisions ?? []).filter(
    (a) => a.type_appel === 'budget_previsionnel' || a.type_appel === 'revision_budget' || a.type_appel == null
  );
  // Tous les appels (BP + FT standalone) pour le KPI "total appelé"
  const provisionsRows = (appelsProvisions ?? []).filter(
    (a) => a.type_appel === 'budget_previsionnel' || a.type_appel === 'revision_budget' || a.type_appel === 'fonds_travaux' || a.type_appel == null
  );
  const hasProvisions = provisionsRows.length > 0;
  const totalProvisions = provisionsRows.reduce((s, a) => s + (a.montant_total ?? 0), 0);

  // Part fonds travaux dans les provisions (champ dédié pour BP + total pour standalone)
  const totalFondsTravaux = provisionsRows.reduce((s, a) => {
    if (a.type_appel === 'fonds_travaux') return s + (a.montant_total ?? 0);
    return s + ((a as { montant_fonds_travaux?: number }).montant_fonds_travaux ?? 0);
  }, 0);

  // Écart prévisionnel : BP hors fonds travaux vs dépenses réelles
  // Le fonds travaux est exclu : c'est une épargne (compte 103), pas une dépense à régulariser
  const totalFondsTravauxBP = provisionsBP.reduce((s, a) =>
    s + ((a as { montant_fonds_travaux?: number }).montant_fonds_travaux ?? 0), 0);
  const totalProvisionsBP = provisionsBP.reduce((s, a) => s + (a.montant_total ?? 0), 0);
  const totalProvisionsBPHorsFT = totalProvisionsBP - totalFondsTravauxBP;
  const ecartPrevisionnel = totalProvisionsBPHorsFT - totalDepenses;

  type LigneEncaissee = { montant_du: number };
  // appelsEncaisses conservé pour usage futur
  void (appelsEncaisses as LigneEncaissee[] | null);

  // KPI Solde impayé : lignes non payées d'appels dont l'échéance est passée
  type LigneImpayee = { montant_du: number; coproprietaire_id: string | null };
  const lignesImpayeesEchues = (appelsEchusAujourdhui ?? []) as LigneImpayee[];
  const totalMontantImpayé = lignesImpayeesEchues.reduce((sum, l) => sum + l.montant_du, 0);
  const nbImpayés = new Set(lignesImpayeesEchues.map((l) => l.coproprietaire_id).filter(Boolean)).size;
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
    syndic_benevole:    { bar: 'bg-blue-600',    dot: 'bg-blue-600' },
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

  // Répartition du budget = dépenses réelles + fonds travaux ALUR
  const totalBudget = totalRepartition + totalFondsTravaux;
  const repartitionBudget = [
    ...(totalFondsTravaux > 0
      ? [{ cat: 'fonds_travaux_alur', total: totalFondsTravaux, pct: totalBudget > 0 ? Math.round((totalFondsTravaux / totalBudget) * 100) : 0 }]
      : []),
    ...repartition.map((r) => ({
      ...r,
      pct: totalBudget > 0 ? Math.round((r.total / totalBudget) * 100) : 0,
    })),
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
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
          <BellRing size={18} className="text-amber-700 shrink-0 mt-0.5" />
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
        <Card className="text-center py-14">
          <Building2 size={52} className="mx-auto text-blue-200 mb-5" />
          <h3 className="text-xl font-bold text-gray-800">Bienvenue sur Mon Syndic Bénévole !</h3>
          <p className="text-gray-500 text-sm mt-2 max-w-sm mx-auto">
            Commencez par créer votre première copropriété pour configurer lots, copropriétaires, finances et documents.
          </p>
          <Link
            href="/coproprietes/nouvelle"
            className="inline-flex items-center gap-2 mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors shadow-sm"
          >
            <Building2 size={18} />
            Créer ma première copropriété
          </Link>
        </Card>
      )}

      {/* KPIs */}
      {copropriete && (
        <>
          {/* ── Ligne 1 : 3 KPIs financiers — provisions / dépenses / écart ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Provisions appelées (BP + FT) */}
            <Card className="flex items-center gap-4">
              <div className="p-3 bg-indigo-100 rounded-xl shrink-0">
                <Wallet size={24} className="text-indigo-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Appels {currentYear}</p>
                {hasProvisions ? (
                  <>
                    <p className="text-2xl font-bold text-gray-900">{formatEuros(totalProvisions)}</p>
                    {totalFondsTravaux > 0 ? (
                      <p className="text-xs text-amber-600 font-medium mt-0.5">dont {formatEuros(totalFondsTravaux)} fonds travaux</p>
                    ) : (
                      <p className="text-xs text-gray-500 mt-0.5">Charges appelées aux copro.</p>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-lg font-semibold text-gray-500">&mdash;</p>
                    <p className="text-xs text-gray-500 mt-0.5">Aucune provision saisie pour {currentYear}</p>
                  </>
                )}
              </div>
            </Card>

            {/* Dépenses réelles + tendance */}
            <Card className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl shrink-0">
                <Receipt size={24} className="text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Dépenses réelles {currentYear}</p>
                <p className="text-2xl font-bold text-gray-900">{formatEuros(totalDepenses)}</p>
                {tendanceDepenses === 'hausse' && (
                  <p className="text-xs text-red-600 flex items-center gap-0.5 mt-0.5 font-medium">
                    <ArrowUp size={11} />{pctTendance}% vs {prevYear}
                  </p>
                )}
                {tendanceDepenses === 'baisse' && (
                  <p className="text-xs text-green-600 flex items-center gap-0.5 mt-0.5 font-medium">
                    <ArrowDown size={11} />{Math.abs(pctTendance)}% vs {prevYear}
                  </p>
                )}
                {tendanceDepenses === 'stable' && (
                  <p className="text-xs text-gray-500 flex items-center gap-0.5 mt-0.5">
                    <Minus size={11} />Stable vs {prevYear}
                  </p>
                )}
              </div>
            </Card>

            {/* Écart prévisionnel provisions − dépenses */}
            {hasProvisions ? (
              <Card className="flex items-center gap-4">
                <div className={`p-3 rounded-xl shrink-0 ${ecartPrevisionnel > 0 ? 'bg-green-100' : ecartPrevisionnel < 0 ? 'bg-orange-100' : 'bg-gray-100'}`}>
                  {ecartPrevisionnel > 0
                    ? <TrendingUp size={24} className="text-green-600" />
                    : ecartPrevisionnel < 0
                      ? <TrendingDown size={24} className="text-orange-600" />
                      : <Minus size={24} className="text-gray-500" />}
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Écart prévisionnel</p>
                  <p className={`text-2xl font-bold ${ecartPrevisionnel > 0 ? 'text-green-700' : ecartPrevisionnel < 0 ? 'text-orange-600' : 'text-gray-700'}`}>
                    {ecartPrevisionnel > 0 ? '+' : ''}{formatEuros(ecartPrevisionnel)}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {ecartPrevisionnel > 0 ? 'Surplus (trop-perçu provisoire)' : ecartPrevisionnel < 0 ? 'Déficit à régulariser' : 'Provisions = dépenses'}
                  </p>
                  {totalFondsTravauxBP > 0 && (
                    <p className="text-xs text-gray-400 mt-0.5">Hors {formatEuros(totalFondsTravauxBP)} fonds travaux ALUR (non régularisable)</p>
                  )}
                </div>
              </Card>
            ) : (
              <Card className="flex items-center gap-4 border-dashed border-gray-200">
                <div className="p-3 bg-gray-50 rounded-xl shrink-0">
                  <Minus size={24} className="text-gray-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Écart prévisionnel</p>
                  <p className="text-sm text-gray-700 font-semibold mt-0.5">—</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Aucune provision saisie pour {currentYear}.{' '}
                    <Link href="/appels-de-fonds" className="text-gray-600 hover:text-blue-600 hover:underline">Saisir un appel de fonds</Link>
                  </p>
                </div>
              </Card>
            )}

          </div>

          {/* ── Ligne 2 : 3 KPIs opérationnels ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Impayés copropriétaires */}
            {!hasProvisions ? (
              <Card className="flex items-center gap-4 border-dashed border-gray-200">
                <div className="p-3 bg-gray-50 rounded-xl shrink-0">
                  <Banknote size={24} className="text-gray-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Solde impayé</p>
                  <p className="text-lg font-semibold text-gray-500">&mdash;</p>
                  <p className="text-xs text-gray-500 mt-0.5">Aucune provision saisie pour {currentYear}</p>
                </div>
              </Card>
            ) : (
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
                    <p className="text-xs text-red-600 mt-0.5">
                      {nbImpayés} copropriétaire{nbImpayés > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </Card>
            )}

            {/* Incidents ouverts */}
            <Card className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-xl shrink-0">
                <AlertTriangle size={24} className="text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Incidents en cours</p>
                <p className="text-2xl font-bold text-gray-900">{nbIncidentsOuverts}</p>
                {nbIncidentsOuverts === 0 && <p className="text-xs text-green-700 mt-0.5">Aucun incident ouvert</p>}
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
                <p className="text-xs text-gray-500 mt-0.5">{nbLots ?? 0} lot{(nbLots ?? 0) > 1 ? 's' : ''}</p>
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
                            <p className="text-xs text-gray-500">
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
                <p className="text-sm text-gray-500 text-center py-4">Aucune dépense enregistrée</p>
              )}
            </Card>

            {/* Répartition du budget */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Répartition du budget</h3>
                <span className="text-xs text-gray-500">dépenses + FT {currentYear}</span>
              </div>
              {repartitionBudget.length > 0 ? (
                <div className="space-y-3">
                  {repartitionBudget.map(({ cat, total, pct }) => {
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
                  <p className="text-xs text-gray-500 pt-2 border-t border-gray-100 text-right">
                    Total : <span className="font-semibold text-gray-600">{formatEuros(totalBudget)}</span>
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">Aucune dépense enregistrée</p>
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
                        <p className="text-xs text-gray-500">Montant : {formatEuros(montantImpayes60j)}</p>
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
                        <p className="text-xs text-gray-500 truncate max-w-xs">
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
