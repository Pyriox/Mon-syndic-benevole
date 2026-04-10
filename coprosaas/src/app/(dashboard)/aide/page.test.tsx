// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

type QueryResult = {
  maybeSingle?: () => Promise<{ data: unknown; error: null }>;
  order?: () => Promise<{ data: unknown[]; error: null }> | QueryResult;
  eq?: (column: string, value: unknown) => QueryResult;
  select?: () => QueryResult;
};

let mockScenario: 'copro' | 'syndic-and-copro' = 'copro';

function createTableQuery(table: string): QueryResult {
  const filters = new Map<string, unknown>();

  const api: QueryResult = {
    select: () => api,
    eq: (column: string, value: unknown) => {
      filters.set(column, value);
      return api;
    },
    order: () => Promise.resolve({ data: [], error: null }),
    maybeSingle: async () => {
      if (table === 'profiles') {
        return { data: { full_name: 'Jean-Pierre Vernaet' }, error: null };
      }

      if (table === 'coproprietes') {
        if (mockScenario === 'syndic-and-copro') {
          return { data: { id: 'copro-1', nom: 'Résidence des Lilas' }, error: null };
        }
        return { data: null, error: null };
      }

      if (table === 'coproprietaires' && filters.get('user_id') === 'user-1') {
        return { data: { id: 'cp-1' }, error: null };
      }

      return { data: null, error: null };
    },
  };

  return api;
}

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: async () => ({
        data: {
          user: {
            id: 'user-1',
            email: 'jean@example.com',
          },
        },
      }),
    },
    from: (table: string) => createTableQuery(table),
  }),
}));

describe('AidePage', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    mockScenario = 'copro';
    document.cookie = 'selected_copro_id=copro-1';
  });

  it('personnalise la FAQ pour la vue copropriétaire', async () => {
    const { default: AidePage } = await import('./page');

    render(<AidePage />);

    await waitFor(() => {
      expect(screen.getByText(/Comment consulter mon solde/i)).not.toBeNull();
    });

    expect(screen.queryByText(/Comment inviter mes copropriétaires sur la plateforme/i)).toBeNull();
  });

  it('priorise la vue syndic quand l’utilisateur gère aussi la copropriété sélectionnée', async () => {
    mockScenario = 'syndic-and-copro';
    const { default: AidePage } = await import('./page');

    render(<AidePage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /aide & contact/i })).not.toBeNull();
    });

    expect(screen.getByText(/Comment inviter mes copropriétaires sur la plateforme/i)).not.toBeNull();
    expect(screen.queryByText(/Comment consulter mon solde/i)).toBeNull();
  });
});
