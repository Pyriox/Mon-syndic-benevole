// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/link', () => ({
  default: ({ children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a {...props}>{children}</a>
  ),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/depenses',
  useSearchParams: () => new URLSearchParams('annee=2026'),
}));

vi.mock('@/lib/subscription', () => ({
  hasChargesSpecialesAddon: vi.fn(() => true),
  isSubscribed: vi.fn(() => true),
}));

vi.mock('./DepenseActions', () => ({
  __esModule: true,
  default: () => <div>DepenseActions</div>,
  DepenseDelete: () => <div>DepenseDelete</div>,
}));

vi.mock('@/lib/supabase/require-copro-access', () => ({
  requireCoproAccess: vi.fn(async () => ({
    user: { id: 'user-1', email: 'me@example.com' },
    selectedCoproId: 'copro-1',
    role: 'copropriétaire',
    copro: {
      id: 'copro-1',
      nom: '23 Abbé Léon Spairat',
      syndic_id: 'syndic-1',
      plan: 'pro',
      plan_id: null,
    },
  })),
}));

type Row = Record<string, unknown>;

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

  gte(column: string, value: unknown) {
    this.rows = this.rows.filter((row) => String(row[column] ?? '') >= String(value));
    return this;
  }

  lt(column: string, value: unknown) {
    this.rows = this.rows.filter((row) => String(row[column] ?? '') < String(value));
    return this;
  }

  not(column: string, operator: string, value: unknown) {
    if (operator === 'is' && value === null) {
      this.rows = this.rows.filter((row) => row[column] != null);
    }
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

  async single() {
    return { data: this.rows[0] ?? null, error: null };
  }

  then(resolve: (value: { data: Row[]; error: null }) => unknown) {
    return Promise.resolve(resolve({ data: this.rows, error: null }));
  }
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    from: (table: string) => {
      if (table === 'depenses') {
        return new MockQuery([
          {
            id: 'dep-1',
            copropriete_id: 'copro-1',
            titre: 'Assurance 2026',
            description: null,
            montant: 100,
            date_depense: '2026-01-10',
            categorie: 'assurance',
            piece_jointe_url: null,
            repartition_type: 'generale',
            repartition_cible: null,
          },
          {
            id: 'dep-2',
            copropriete_id: 'copro-1',
            titre: 'Ascenseur 2026',
            description: null,
            montant: 300,
            date_depense: '2026-02-10',
            categorie: 'ascenseur',
            piece_jointe_url: null,
            repartition_type: 'groupe',
            repartition_cible: 'Ascenseur',
          },
        ]);
      }

      if (table === 'lots') {
        return new MockQuery([
          {
            id: 'lot-me',
            tantiemes: 100,
            coproprietaire_id: 'cp-me',
            groupes_repartition: ['Ascenseur'],
            tantiemes_groupes: { Ascenseur: 20 },
          },
          {
            id: 'lot-other',
            tantiemes: 900,
            coproprietaire_id: 'cp-other',
            groupes_repartition: ['Ascenseur'],
            tantiemes_groupes: { Ascenseur: 180 },
          },
        ]);
      }

      if (table === 'coproprietaires') {
        return new MockQuery([
          { id: 'cp-other', copropriete_id: 'copro-1', nom: 'Alpha', prenom: 'Alice', user_id: 'user-2', email: 'other@example.com' },
          { id: 'cp-me', copropriete_id: 'copro-1', nom: 'Zulu', prenom: 'Zoé', user_id: 'user-1', email: 'me@example.com' },
        ]);
      }

      if (table === 'repartitions_depenses') {
        return new MockQuery([
          { depense_id: 'dep-1', coproprietaire_id: 'cp-me', montant_du: 10 },
          { depense_id: 'dep-1', coproprietaire_id: 'cp-other', montant_du: 90 },
          { depense_id: 'dep-2', coproprietaire_id: 'cp-me', montant_du: 30 },
          { depense_id: 'dep-2', coproprietaire_id: 'cp-other', montant_du: 270 },
        ]);
      }

      return new MockQuery([]);
    },
  })),
}));

describe('DepensesPage (vue copropriétaire)', () => {
  it('calcule la quote-part à partir des répartitions réelles du copropriétaire connecté', async () => {
    const { default: DepensesPage } = await import('./page');

    render(await DepensesPage({ searchParams: Promise.resolve({ annee: '2026' }) }));

    expect(screen.getByText(/Ma quote-part/i)).toBeTruthy();
    expect(screen.getByText(/Charges communes \+ Ascenseur/i)).toBeTruthy();
    expect(screen.getByText(/Détail par clé/i)).toBeTruthy();
    expect(screen.getByText(/sur 100,00\s*€/i)).toBeTruthy();
    expect(screen.getByText(/sur 300,00\s*€/i)).toBeTruthy();
    expect(screen.getByText(/40,00\s*€/i)).toBeTruthy();
    expect(screen.getByText(/10%/i)).toBeTruthy();
  });
});
