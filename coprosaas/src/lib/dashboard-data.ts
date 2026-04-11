type DashboardExpenseRow = {
  id: string;
  titre: string;
  montant: number;
  date_depense: string;
  categorie: string | null;
};

type DashboardExpenseAggregateRow = {
  montant: number;
  categorie: string | null;
};

type DashboardUnpaidLineRow = {
  id: string;
  coproprietaire_id: string | null;
  montant_du: number | null;
  paye: boolean | null;
  date_echeance: string | null;
  appel_statut?: string | null;
};

const DASHBOARD_UNPAID_ACTIVE_STATUSES = new Set(['publie', 'confirme']);

export function isDashboardUnpaidActiveStatus(statut: string | null | undefined) {
  return statut == null || DASHBOARD_UNPAID_ACTIVE_STATUSES.has(statut);
}

export function buildDashboardExpenseSnapshot({
  depensesRecentes,
  depensesAll,
  totalFondsTravaux,
}: {
  depensesRecentes: DashboardExpenseRow[] | null | undefined;
  depensesAll: DashboardExpenseAggregateRow[] | null | undefined;
  totalFondsTravaux: number;
}) {
  const recentRows = (depensesRecentes ?? []).map((depense) => ({
    id: depense.id,
    titre: depense.titre,
    montant: depense.montant ?? 0,
    date_depense: depense.date_depense,
    categorie: depense.categorie ?? 'autre',
  }));

  const aggregateRows = (depensesAll ?? []).length > 0 ? (depensesAll ?? []) : recentRows;
  const totalDepenses = aggregateRows.reduce((sum, depense) => sum + (depense.montant ?? 0), 0);

  const repartitionRaw: Record<string, number> = {};
  for (const depense of aggregateRows) {
    const categorie = depense.categorie ?? 'autre';
    repartitionRaw[categorie] = (repartitionRaw[categorie] ?? 0) + (depense.montant ?? 0);
  }

  const totalBudget = totalDepenses + totalFondsTravaux;
  const repartition = Object.entries(repartitionRaw)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7)
    .map(([cat, total]) => ({
      cat,
      total,
      pct: totalBudget > 0 ? Math.round((total / totalBudget) * 100) : 0,
    }));

  const repartitionBudget = [
    ...(totalFondsTravaux > 0
      ? [
          {
            cat: 'fonds_travaux_alur',
            total: totalFondsTravaux,
            pct: totalBudget > 0 ? Math.round((totalFondsTravaux / totalBudget) * 100) : 0,
          },
        ]
      : []),
    ...repartition,
  ];

  return {
    totalDepenses,
    depenses: recentRows,
    repartitionBudget,
    totalBudget,
  };
}

export function buildDashboardUnpaidSnapshot({
  lignes,
  today = new Date().toISOString().split('T')[0],
}: {
  lignes: DashboardUnpaidLineRow[] | null | undefined;
  today?: string;
}) {
  const overdueLines = (lignes ?? []).filter((ligne) => {
    if (!isDashboardUnpaidActiveStatus(ligne.appel_statut)) return false;
    if (ligne.paye) return false;
    if ((ligne.montant_du ?? 0) <= 0) return false;
    if (!ligne.date_echeance) return false;
    return ligne.date_echeance < today;
  });

  const totalMontantImpaye = Math.round(overdueLines.reduce((sum, ligne) => sum + (ligne.montant_du ?? 0), 0) * 100) / 100;
  const nbImpayes = new Set(
    overdueLines
      .map((ligne) => ligne.coproprietaire_id)
      .filter((coproprietaireId): coproprietaireId is string => Boolean(coproprietaireId)),
  ).size;

  return {
    totalMontantImpaye,
    nbImpayes,
    nbLignesImpayees: overdueLines.length,
  };
}
