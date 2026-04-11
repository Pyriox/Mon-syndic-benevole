import { describe, expect, it } from 'vitest';

import { buildDashboardExpenseSnapshot, buildDashboardUnpaidSnapshot } from '../dashboard-data';

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

describe('buildDashboardUnpaidSnapshot', () => {
  it('ne retient que les appels échus non marqués comme payés', () => {
    const snapshot = buildDashboardUnpaidSnapshot({
      lignes: [
        { id: 'l-1', coproprietaire_id: 'cp-1', montant_du: 242.1, paye: false, date_echeance: '2026-04-01', appel_statut: 'publie' },
        { id: 'l-2', coproprietaire_id: 'cp-2', montant_du: 88.45, paye: false, date_echeance: '2026-04-02', appel_statut: 'publie' },
        { id: 'l-3', coproprietaire_id: 'cp-2', montant_du: 19.9, paye: false, date_echeance: '2026-05-15', appel_statut: 'publie' },
        { id: 'l-4', coproprietaire_id: 'cp-3', montant_du: 0, paye: false, date_echeance: '2026-04-03', appel_statut: 'publie' },
        { id: 'l-5', coproprietaire_id: 'cp-4', montant_du: 70, paye: true, date_echeance: '2026-03-15', appel_statut: 'publie' },
        { id: 'l-6', coproprietaire_id: 'cp-5', montant_du: 50, paye: false, date_echeance: '2026-04-04', appel_statut: 'confirme' },
        { id: 'l-7', coproprietaire_id: 'cp-6', montant_du: 999, paye: false, date_echeance: '2026-04-05', appel_statut: 'brouillon' },
      ],
      today: '2026-04-11',
    });

    expect(snapshot.totalMontantImpaye).toBe(380.55);
    expect(snapshot.nbImpayes).toBe(3);
    expect(snapshot.nbLignesImpayees).toBe(3);
  });
});
