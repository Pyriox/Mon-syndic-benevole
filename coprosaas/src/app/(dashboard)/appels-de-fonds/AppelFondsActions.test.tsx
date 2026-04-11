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

  order(column: string, options?: { ascending?: boolean }) {
    const ascending = options?.ascending ?? true;
    this.rows = [...this.rows].sort((a, b) => {
      const left = String(a[column] ?? '');
      const right = String(b[column] ?? '');
      return ascending ? left.localeCompare(right) : right.localeCompare(left);
    });
    return this;
  }

  async maybeSingle() {
    return { data: this.rows[0] ?? null, error: null };
  }

  async insert() {
    return { data: null, error: null };
  }

  then(resolve: (value: { data: Row[]; error: null }) => unknown) {
    return Promise.resolve(resolve({ data: this.rows, error: null }));
  }
}

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: (table: string) => {
      if (table === 'lots') {
        return new MockQuery(mockLotsRows);
      }

      if (table === 'assemblees_generales') {
        return new MockQuery([]);
      }

      if (table === 'resolutions') {
        return new MockQuery([]);
      }

      if (table === 'appels_de_fonds') {
        return {
          insert: async () => ({ data: null, error: null }),
        };
      }

      return new MockQuery([]);
    },
  }),
}));

vi.mock('@/lib/actions/log-user-event', () => ({
  logCurrentUserEvent: vi.fn(async () => undefined),
}));

vi.mock('@/lib/actions/revalidate-copro-finance', () => ({
  revalidateCoproFinance: vi.fn(async () => undefined),
}));

afterEach(() => {
  cleanup();
});

describe('AppelFondsActions', () => {
  beforeEach(() => {
    mockLotsRows = [];
  });

  it('n’affiche pas de sélecteur de clé spéciale quand aucune clé n’est configurée', async () => {
    mockLotsRows = [
      {
        id: 'lot-1',
        copropriete_id: 'copro-1',
        numero: '1',
        tantiemes: 120,
        batiment: 'A',
        groupes_repartition: [],
        tantiemes_groupes: {},
        coproprietaires: [{ id: 'cp-1', nom: 'Durand', prenom: 'Zoé' }],
      },
    ];

    const { default: AppelFondsActions } = await import('./AppelFondsActions');

    render(<AppelFondsActions coproprietes={[{ id: 'copro-1', nom: 'Copro test' }]} showLabel />);

    fireEvent.click(screen.getByRole('button', { name: /Créer un appel de fonds/i }));
    fireEvent.click(screen.getByRole('button', { name: /Créer un appel exceptionnel sans AG/i }));

    const rowInput = await waitFor(() => screen.getByPlaceholderText(/Ex : Entretien ascenseur/i));
    const budgetRow = rowInput.closest('div');

    expect(budgetRow).not.toBeNull();
    expect(within(budgetRow as HTMLElement).queryByRole('combobox')).toBeNull();
    expect(within(budgetRow as HTMLElement).getByText(/^Charges communes$/i)).not.toBeNull();
  });

  it('affiche le nom brut de la clé configurée dans la création d’appel', async () => {
    mockLotsRows = [
      {
        id: 'lot-1',
        copropriete_id: 'copro-1',
        numero: '1',
        tantiemes: 120,
        batiment: 'A',
        groupes_repartition: ['Ascenseur test'],
        tantiemes_groupes: { 'Ascenseur test': 120 },
        coproprietaires: [{ id: 'cp-1', nom: 'Durand', prenom: 'Zoé' }],
      },
    ];

    const { default: AppelFondsActions } = await import('./AppelFondsActions');

    render(<AppelFondsActions coproprietes={[{ id: 'copro-1', nom: 'Copro test' }]} showLabel />);

    fireEvent.click(screen.getByRole('button', { name: /Créer un appel de fonds/i }));
    fireEvent.click(screen.getByRole('button', { name: /Créer un appel exceptionnel sans AG/i }));

    const rowInput = await waitFor(() => screen.getByPlaceholderText(/Ex : Entretien ascenseur/i));
    const budgetRow = rowInput.closest('div');
    const repartitionSelect = within(budgetRow as HTMLElement).getByRole('combobox') as HTMLSelectElement;
    const optionLabels = Array.from(repartitionSelect.options).map((option) => option.text);

    expect(optionLabels).toContain('Ascenseur test');
    expect(optionLabels).not.toContain('Seulement Ascenseur test');
  });
});
