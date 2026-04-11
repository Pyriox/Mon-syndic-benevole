// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type Row = Record<string, unknown>;

let mockLotsRows: Row[] = [];

class MockQuery {
  private rows: Row[];

  constructor(rows: Row[]) {
    this.rows = [...rows];
  }

  select() {
    return this;
  }

  eq(column: string, value: unknown) {
    this.rows = this.rows.filter((row) => row[column] === value);
    return this;
  }

  in(column: string, values: unknown[]) {
    this.rows = this.rows.filter((row) => values.includes(row[column]));
    return this;
  }

  async update() {
    return { error: null };
  }

  then(resolve: (value: { data: Row[]; error: null }) => unknown) {
    return Promise.resolve(resolve({ data: this.rows, error: null }));
  }
}

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: (table: string) => {
      if (table === 'lots') return new MockQuery(mockLotsRows);
      return new MockQuery([]);
    },
  }),
}));

vi.mock('@/lib/actions/revalidate-copro-finance', () => ({
  revalidateCoproFinance: vi.fn(async () => undefined),
}));

vi.mock('@/lib/coproprietaire-balance', () => ({
  applyCoproprietaireBalanceDelta: vi.fn(async () => ({ error: null })),
  resolveAppelBalanceAccountType: vi.fn(() => 'principal'),
}));

afterEach(() => {
  cleanup();
});

describe('AppelFondsPaiement', () => {
  beforeEach(() => {
    mockLotsRows = [
      {
        id: 'lot-a1',
        copropriete_id: 'copro-1',
        tantiemes: 100,
        coproprietaire_id: 'copro-a',
        groupes_repartition: ['Ascenseur A'],
        tantiemes_groupes: { 'Ascenseur A': 100 },
      },
      {
        id: 'lot-b1',
        copropriete_id: 'copro-1',
        tantiemes: 100,
        coproprietaire_id: 'copro-b',
        groupes_repartition: [],
        tantiemes_groupes: {},
      },
    ];
  });

  it('n’affiche la ligne spéciale que pour le copropriétaire concerné', async () => {
    const { default: AppelFondsPaiement } = await import('./AppelFondsPaiement');

    render(
      <AppelFondsPaiement
        appel={{
          id: 'appel-1',
          titre: 'Appel test',
          montant_total: 200,
          date_echeance: '2026-04-17',
          copropriete_id: 'copro-1',
          description: JSON.stringify([
            { libelle: 'EDF', categorie: 'autre', montant: 150 },
            { libelle: 'Ascenseur', categorie: 'autre', montant: 50, repartition_type: 'groupe', repartition_cible: 'Ascenseur A' },
          ]),
        }}
        lignes={[
          {
            id: 'ligne-a',
            montant_du: 125,
            paye: false,
            date_paiement: null,
            coproprietaires: { id: 'copro-a', prenom: 'Alice', nom: 'Alpha' },
          },
          {
            id: 'ligne-b',
            montant_du: 75,
            paye: false,
            date_paiement: null,
            coproprietaires: { id: 'copro-b', prenom: 'Bob', nom: 'Bravo' },
          },
        ]}
        isSyndic
      />,
    );

    await waitFor(() => expect(screen.getAllByTitle(/Détail des postes/i)).toHaveLength(2));

    const detailButtons = screen.getAllByTitle(/Détail des postes/i);
    fireEvent.click(detailButtons[1]);

    const detailBlock = await screen.findByText(/Détail des postes — part de Bob Bravo/i);
    const container = detailBlock.parentElement?.nextElementSibling?.parentElement ?? detailBlock.parentElement;

    expect(container).not.toBeNull();
    expect(within(container as HTMLElement).getByText(/^EDF$/i)).not.toBeNull();
    expect(within(container as HTMLElement).queryByText(/^Ascenseur$/i)).toBeNull();
  });
});
