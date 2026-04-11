// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

vi.mock('@/lib/supabase/require-copro-access', () => ({
  requireCoproAccess: vi.fn(async () => ({
    selectedCoproId: 'copro-1',
    role: 'copropriétaire',
  })),
}));

vi.mock('./ProfilActions', () => ({
  ProfilEditActions: () => null,
  ProfilIdentiteEditor: () => <div>Éditeur identité</div>,
  LotsActions: () => <button type="button">Gérer mes lots</button>,
  SecurityActions: () => <div>Actions sécurité</div>,
  DeleteAccountSection: () => <button type="button">Supprimer mon compte</button>,
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

  in(column: string, values: unknown[]) {
    this.rows = this.rows.filter((row) => values.includes(row[column]));
    return this;
  }

  is(column: string, value: unknown) {
    this.rows = this.rows.filter((row) => row[column] === value);
    return this;
  }

  order(column: string) {
    this.rows = [...this.rows].sort((a, b) => String(a[column] ?? '').localeCompare(String(b[column] ?? '')));
    return this;
  }

  async maybeSingle() {
    return { data: this.rows[0] ?? null, error: null };
  }

  then(resolve: (value: { data: Row[]; error: null }) => unknown) {
    return Promise.resolve(resolve({ data: this.rows, error: null }));
  }
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: async () => ({
        data: {
          user: {
            id: 'user-1',
            email: 'jean@example.com',
            user_metadata: { full_name: 'Jean Dupont' },
          },
        },
      }),
    },
    from: (table: string) => {
      if (table === 'coproprietes') {
        return new MockQuery([
          {
            id: 'copro-1',
            nom: 'Résidence Alpha',
            syndic_id: 'user-1',
            lots: [{ id: 'lot-1', numero: '12', tantiemes: 100, coproprietaire_id: 'fiche-1' }],
          },
        ]);
      }

      if (table === 'coproprietaires') {
        return new MockQuery([
          {
            id: 'fiche-1',
            copropriete_id: 'copro-1',
            prenom: 'Jean',
            nom: 'Dupont',
            telephone: '0102030405',
            user_id: 'user-1',
            email: 'jean@example.com',
            raison_sociale: null,
            adresse: '1 rue de Paris',
            complement_adresse: null,
            code_postal: '75001',
            ville: 'Paris',
          },
        ]);
      }

      return new MockQuery([]);
    },
  })),
}));

describe('ProfilPage', () => {
  it('respecte la vue copropriétaire sélectionnée même pour un compte qui gère une copropriété', async () => {
    const { default: ProfilPage } = await import('./page');

    render(await ProfilPage());

    expect(screen.getByText('Copropriétaire')).not.toBeNull();
    expect(screen.queryByText(/Mon statut de copropriétaire/i)).toBeNull();
  });
});
