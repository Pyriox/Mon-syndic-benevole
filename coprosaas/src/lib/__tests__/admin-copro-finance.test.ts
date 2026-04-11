import { describe, expect, it } from 'vitest';

import { buildAdminCoproFinancialView } from '../admin-copro-finance';

describe('buildAdminCoproFinancialView', () => {
  it('résume les soldes et trie les mouvements pour la fiche admin de copropriété', () => {
    const summary = buildAdminCoproFinancialView({
      coproprietaires: [
        { id: 'cp-1', solde: 120.5 },
        { id: 'cp-2', solde: -40 },
        { id: 'cp-3', solde: 200 },
      ],
      unpaidLines: [
        { id: 'l-1', coproprietaire_id: 'cp-1', montant_du: 88.45, paye: false, date_echeance: '2026-04-01', appel_statut: 'publie' },
        { id: 'l-2', coproprietaire_id: 'cp-3', montant_du: 999, paye: false, date_echeance: '2026-05-20', appel_statut: 'publie' },
        { id: 'l-3', coproprietaire_id: 'cp-3', montant_du: 111, paye: false, date_echeance: '2026-03-01', appel_statut: 'brouillon' },
      ],
      today: '2026-04-11',
      balanceEvents: [
        {
          id: 'evt-older',
          coproprietaire_id: 'cp-1',
          event_date: '2026-04-01',
          source_type: 'appel_publication',
          account_type: 'principal',
          label: 'Appel T2 2026',
          reason: null,
          amount: 120.5,
          balance_after: 120.5,
          created_at: '2026-04-01T09:00:00Z',
        },
        {
          id: 'evt-newer',
          coproprietaire_id: 'cp-2',
          event_date: '2026-04-03',
          source_type: 'payment_received',
          account_type: 'principal',
          label: 'Paiement reçu',
          reason: null,
          amount: -40,
          balance_after: -40,
          created_at: '2026-04-03T12:00:00Z',
        },
      ],
    });

    expect(summary.debiteurCount).toBe(1);
    expect(summary.creditorCount).toBe(1);
    expect(summary.totalDebiteur).toBe(88.45);
    expect(summary.totalCrediteur).toBe(40);
    expect(summary.latestEvents.map((event) => event.id)).toEqual(['evt-newer', 'evt-older']);
    expect(summary.typeCounts.appel_publication).toBe(1);
    expect(summary.typeCounts.payment_received).toBe(1);
  });
});
