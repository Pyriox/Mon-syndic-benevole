// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const mockGetSyndicDashboardSnapshot = vi.fn();

vi.mock('next/link', () => ({
  default: ({ children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a {...props}>{children}</a>
  ),
}));

vi.mock('@/lib/cached-queries', () => ({
  getCoproprietaireDashboardSnapshot: vi.fn(async () => ({
    fiche: { id: 'cp-1', nom: 'Dupont', prenom: 'Jean-Pierre', raison_sociale: null, solde: 205.6 },
    assembleesUpcoming: [],
    chargesImpayees: [],
    prochaineAG: null,
    joursAvantAG: null,
    solde: 205.6,
    displayFirstName: 'Jean-Pierre',
    balanceEvents: [
      {
        id: 'evt-1',
        event_date: '2026-04-01',
        source_type: 'payment_received',
        account_type: 'principal',
        label: 'Paiement reçu — Appel T2 2026',
        reason: null,
        amount: -120,
        balance_after: 205.6,
        created_at: '2026-04-01T10:00:00Z',
      },
    ],
  })),
  getSyndicDashboardSnapshot: mockGetSyndicDashboardSnapshot,
}));

describe('CoproDashboardMain', () => {
  it('affiche un solde débiteur en rouge avec la mention charges à régler', async () => {
    const { CoproDashboardMain } = await import('./DashboardSections');

    render(await CoproDashboardMain({ userId: 'user-1', coproId: 'copro-1' }));

    expect(screen.getByText(/Charges à régler/i)).not.toBeNull();
    expect(screen.getByText(/-205,60\s?€/i)).not.toBeNull();
  });

  it('affiche l’historique des mouvements sur le tableau de bord copropriétaire', async () => {
    const { CoproDashboardMain } = await import('./DashboardSections');

    render(await CoproDashboardMain({ userId: 'user-1', coproId: 'copro-1' }));

    expect(screen.getAllByText(/Historique de mes mouvements/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Paiement reçu — Appel T2 2026/i).length).toBeGreaterThan(0);
  });
});

describe('SyndicDashboardAlert', () => {
  it('affiche de nouveau un bandeau d’alerte pour les appels de fonds échus impayés', async () => {
    mockGetSyndicDashboardSnapshot.mockResolvedValue({
      totalMontantImpaye: 1348.39,
      nbImpayes: 4,
      nbLignesImpayees: 6,
      agUrgente: false,
      prochaineAG: null,
      joursAvantAG: null,
    });

    const { SyndicDashboardAlert } = await import('./DashboardSections');

    render(await SyndicDashboardAlert({ coproId: 'copro-1' }));

    expect(screen.getByText(/appel(s)? de fonds en retard/i)).not.toBeNull();
    expect(screen.getByText(/1.?348,39\s?€/i)).not.toBeNull();
  });
});

describe('SyndicDashboardTasks', () => {
  it('n’affiche pas une deuxième carte quand seul un impayé est déjà signalé dans le bandeau', async () => {
    mockGetSyndicDashboardSnapshot.mockResolvedValue({
      totalMontantImpaye: 88.45,
      nbImpayes: 1,
      nbLignesImpayees: 1,
      nbImpayes60j: 1,
      incidentsAnciens: [],
    });

    const { SyndicDashboardTasks } = await import('./DashboardSections');

    const ui = await SyndicDashboardTasks({ coproId: 'copro-1' });

    expect(ui).toBeNull();
  });
});
