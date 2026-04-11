// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

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
  getSyndicDashboardSnapshot: vi.fn(),
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
