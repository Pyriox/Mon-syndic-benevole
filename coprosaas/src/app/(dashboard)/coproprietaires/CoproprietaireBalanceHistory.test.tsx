// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import CoproprietaireBalanceHistory from './CoproprietaireBalanceHistory';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('CoproprietaireBalanceHistory', () => {
  it('affiche un historique simplifié trié par date réelle de création', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        events: [
          {
            id: 'evt-2',
            event_date: '2026-04-17',
            source_type: 'appel_publication',
            account_type: 'principal',
            label: "Publication d'appel de fonds — Appel test clés spéciales — 1/2",
            reason: null,
            amount: 33.9,
            balance_after: 242.1,
            created_at: '2026-04-11T09:00:00Z',
          },
          {
            id: 'evt-1',
            event_date: '2026-04-11',
            source_type: 'opening_balance',
            account_type: 'principal',
            label: "Solde d'ouverture de l'historique",
            reason: 'Instantané initial créé lors de l’activation du journal financier.',
            amount: 208.2,
            balance_after: 208.2,
            created_at: '2026-04-11T10:00:00Z',
          },
        ],
      }),
    } as Response);

    render(
      <CoproprietaireBalanceHistory
        coproprietaireId="cp-1"
        displayName="Fabien TURPIN"
        currentBalance={208.2}
      />,
    );

    fireEvent.click(screen.getByTitle(/Historique financier/i));

    await waitFor(() => {
      expect(screen.getByText(/Solde d'ouverture de l'historique/i)).not.toBeNull();
      expect(screen.getByText(/Appel test clés spéciales — 1\/2/i)).not.toBeNull();
    });

    expect(screen.queryByText(/Publication d'appel de fonds/i)).toBeNull();
    expect(screen.queryByText(/Compte principal/i)).toBeNull();

    const rows = screen.getAllByRole('row').slice(1);
    expect(rows[0]?.textContent ?? '').toMatch(/Solde d'ouverture de l'historique/i);
    expect(rows[1]?.textContent ?? '').toMatch(/Appel test clés spéciales — 1\/2/i);

    expect(screen.getByText(/Charges à régler/i)).not.toBeNull();
    expect(screen.getByText(/-208,20\s?€/i)).not.toBeNull();
  });
});
