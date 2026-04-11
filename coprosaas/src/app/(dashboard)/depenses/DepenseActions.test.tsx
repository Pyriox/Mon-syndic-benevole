// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

let mockLots: Array<Record<string, unknown>> = [];
let mockLotsLoader: () => Promise<{ data: Array<Record<string, unknown>>; error: null }> = async () => ({ data: mockLots, error: null });

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

vi.mock('@/lib/actions/revalidate-copro-finance', () => ({
  revalidateCoproFinance: vi.fn(async () => undefined),
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: async () => ({ data: { user: { id: 'user-1' } } }),
    },
    from: (table: string) => {
      if (table === 'lots') {
        return {
          select: () => ({
            eq: async () => mockLotsLoader(),
          }),
        };
      }

      return {
        select: () => ({
          eq: async () => ({ data: [], error: null }),
        }),
      };
    },
  }),
}));

describe('DepenseActions', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    mockLots = [];
    mockLotsLoader = async () => ({ data: mockLots, error: null });
  });

  it('affiche un message de chargement avant de conclure qu’aucune clé spéciale n’est disponible', async () => {
    const pendingLots: { release?: () => void } = {};
    mockLotsLoader = () => new Promise((resolve) => {
      pendingLots.release = () => resolve({
        data: [
          {
            id: 'lot-1',
            numero: '1',
            tantiemes: 100,
            batiment: null,
            groupes_repartition: [],
            tantiemes_groupes: {},
            coproprietaire_id: 'cp-1',
          },
        ],
        error: null,
      });
    });

    const { default: DepenseActions } = await import('./DepenseActions');

    render(<DepenseActions coproprietes={[{ id: 'copro-1', nom: 'Résidence Test' }]} showLabel />);

    fireEvent.click(screen.getByRole('button', { name: /Ajouter une dépense/i }));

    expect(screen.getByText(/Chargement des clés spéciales configurées/i)).not.toBeNull();
    expect(screen.queryByText(/Aucune clé spéciale avec base affectée n’est encore configurée/i)).toBeNull();

    pendingLots.release?.();

    await waitFor(() => {
      expect(screen.getByText(/Aucune clé spéciale avec base affectée n’est encore configurée/i)).not.toBeNull();
    });

    expect(screen.queryByRole('combobox', { name: /Répartition de la dépense/i })).toBeNull();
  });

  it('affiche une clé spéciale configurée comme Ascenseur dans la dépense', async () => {
    mockLots = [
      {
        id: 'lot-1',
        numero: '1',
        tantiemes: 100,
        batiment: null,
        groupes_repartition: ['Ascenseur'],
        tantiemes_groupes: { Ascenseur: 100 },
        coproprietaire_id: 'cp-1',
      },
    ];

    const { default: DepenseActions } = await import('./DepenseActions');

    render(<DepenseActions coproprietes={[{ id: 'copro-1', nom: 'Résidence Test' }]} showLabel />);

    fireEvent.click(screen.getByRole('button', { name: /Ajouter une dépense/i }));

    const repartitionSelect = await screen.findByRole('combobox', { name: /Répartition de la dépense/i });

    expect((repartitionSelect as HTMLSelectElement).querySelector('option[value="groupe:Ascenseur"]')).not.toBeNull();
  });
});
