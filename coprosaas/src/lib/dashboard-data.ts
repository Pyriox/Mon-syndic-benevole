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

type DashboardCoproBalanceRow = {
  id: string;
  solde: number | null;
};

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
  coproprietaires,
}: {
  coproprietaires: DashboardCoproBalanceRow[] | null | undefined;
}) {
  const rows = (coproprietaires ?? []).filter((coproprietaire) => (coproprietaire.solde ?? 0) > 0);
  const totalMontantImpaye = Math.round(rows.reduce((sum, coproprietaire) => sum + (coproprietaire.solde ?? 0), 0) * 100) / 100;

  return {
    totalMontantImpaye,
    nbImpayes: rows.length,
  };
}
