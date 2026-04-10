// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('./actions', () => ({
  updateSoldeReprise: vi.fn().mockResolvedValue({}),
  updateModeLigne: vi.fn().mockResolvedValue({}),
}));

describe('RegularisationTable', () => {
  it('affiche un débit en rouge avec signe négatif et un crédit en vert avec signe positif', async () => {
    const { default: RegularisationTable } = await import('./RegularisationTable');

    render(
      <RegularisationTable
        isCloture={false}
        isSyndic
        canWrite
        lignes={[
          {
            id: 'ligne-1',
            coproprietaire_id: 'copro-1',
            montant_appele: 100,
            montant_reel: 150,
            solde_reprise: 0,
            balance: 50,
            mode: 'en_attente',
            coproprietaires: { id: 'copro-1', prenom: 'Alice', nom: 'Martin', raison_sociale: null },
          },
          {
            id: 'ligne-2',
            coproprietaire_id: 'copro-2',
            montant_appele: 120,
            montant_reel: 100,
            solde_reprise: 0,
            balance: -20,
            mode: 'en_attente',
            coproprietaires: { id: 'copro-2', prenom: 'Bernard', nom: 'Durand', raison_sociale: null },
          },
        ]}
      />,
    );

    const debit = screen.getAllByText(/-50,00\s?€/i)[0];
    const credit = screen.getAllByText(/\+20,00\s?€/i)[0];

    expect(debit.className).toContain('text-red-600');
    expect(credit.className).toContain('text-green-600');
  });
});
