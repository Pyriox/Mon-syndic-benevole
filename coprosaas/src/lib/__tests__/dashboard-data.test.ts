import { describe, expect, it } from 'vitest';

import { buildDashboardExpenseSnapshot } from '../dashboard-data';

describe('buildDashboardExpenseSnapshot', () => {
  it('retombe sur les dépenses récentes quand la requête agrégée revient vide', () => {
    const snapshot = buildDashboardExpenseSnapshot({
      depensesRecentes: [
        { id: 'dep-1', titre: 'Matera', montant: 704, date_depense: '2026-03-27', categorie: 'autre' },
        { id: 'dep-2', titre: 'Jelouebien.com', montant: 458.04, date_depense: '2026-01-04', categorie: 'assurance' },
      ],
      depensesAll: [],
      totalFondsTravaux: 0,
    });

    expect(snapshot.totalDepenses).toBe(1162.04);
    expect(snapshot.totalBudget).toBe(1162.04);
    expect(snapshot.depenses).toHaveLength(2);
    expect(snapshot.repartitionBudget).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ cat: 'autre', total: 704 }),
        expect.objectContaining({ cat: 'assurance', total: 458.04 }),
      ]),
    );
  });
});
