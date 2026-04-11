// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type MockLotRow = Record<string, unknown>;

const deleteEqMock = vi.fn();
const insertMock = vi.fn();
let mockLotsRows: MockLotRow[] = [];

const fromMock = vi.fn((table: string) => {
  if (table === 'assemblees_generales') {
    return {
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: { copropriete_id: 'copro-1' }, error: null }),
        }),
      }),
    };
  }

  if (table === 'lots') {
    return {
      select: () => ({
        eq: async () => ({ data: mockLotsRows, error: null }),
      }),
    };
  }

  if (table === 'resolutions') {
    return {
      delete: () => ({ eq: deleteEqMock }),
      insert: insertMock,
    };
  }

  return {
    select: () => ({
      eq: async () => ({ data: [], error: null }),
      maybeSingle: async () => ({ data: null, error: null }),
    }),
  };
});

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: vi.fn(),
  }),
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: fromMock,
  }),
}));

afterEach(() => {
  cleanup();
});

describe('ResolutionDelete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLotsRows = [];
    deleteEqMock.mockResolvedValue({ error: null });
    insertMock.mockResolvedValue({ error: null });
  });

  it('affiche une modale de confirmation avant de supprimer une résolution', async () => {
    const onDeleted = vi.fn();
    const { ResolutionDelete } = await import('./ResolutionActions');

    render(<ResolutionDelete resolutionId="resolution-1" onDeleted={onDeleted} />);

    fireEvent.click(screen.getByTitle('Supprimer'));

    expect(screen.getByText(/Voulez-vous vraiment supprimer cette résolution/i)).not.toBeNull();
    expect(deleteEqMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /Supprimer définitivement/i }));

    await waitFor(() => {
      expect(deleteEqMock).toHaveBeenCalledWith('id', 'resolution-1');
    });
    expect(onDeleted).toHaveBeenCalledWith('resolution-1');
  });
});

describe('ResolutionActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLotsRows = [];
    deleteEqMock.mockResolvedValue({ error: null });
    insertMock.mockResolvedValue({ error: null });
  });

  it('ne propose pas de sélecteur de clé spéciale quand aucune clé n’est configurée', async () => {
    const { default: ResolutionActions } = await import('./ResolutionActions');

    render(<ResolutionActions agId="ag-1" showLabel />);

    fireEvent.click(screen.getByRole('button', { name: /Ajouter une résolution/i }));
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'budget_previsionnel' } });

    await waitFor(() => {
      expect(screen.getByText(/Ajoutez d’abord une clé spéciale/i)).not.toBeNull();
    });

    expect(screen.getAllByRole('combobox')).toHaveLength(3);
  });

  it('affiche le nom brut de la clé spéciale dans la liste de répartition', async () => {
    mockLotsRows = [
      {
        id: 'lot-1',
        tantiemes: 120,
        coproprietaire_id: 'cp-1',
        batiment: 'A',
        groupes_repartition: ['Ascenseur test'],
        tantiemes_groupes: { 'Ascenseur test': 120 },
      },
    ];

    const { default: ResolutionActions } = await import('./ResolutionActions');

    render(<ResolutionActions agId="ag-1" showLabel />);

    fireEvent.click(screen.getByRole('button', { name: /Ajouter une résolution/i }));
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'budget_previsionnel' } });

    await waitFor(() => {
      expect(screen.getByRole('option', { name: /^Ascenseur test$/i })).not.toBeNull();
    });

    expect(screen.queryByRole('option', { name: /Seulement Ascenseur test/i })).toBeNull();
  });
});
