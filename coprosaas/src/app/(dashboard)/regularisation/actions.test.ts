import { beforeEach, describe, expect, it, vi } from 'vitest';

const createClientMock = vi.fn();
const createAdminClientMock = vi.fn();
const revalidatePathMock = vi.fn();
const invalidateCoproprietairesCacheMock = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: createClientMock,
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: createAdminClientMock,
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: revalidatePathMock,
}));

vi.mock('@/lib/cached-queries', () => ({
  invalidateCoproprietairesCache: invalidateCoproprietairesCacheMock,
}));

function createResultChain<T>(data: T, error: { message: string } | null = null) {
  const chain = {
    data,
    error,
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    gte: vi.fn(() => chain),
    lte: vi.fn(() => chain),
    neq: vi.fn(() => chain),
    or: vi.fn(() => chain),
    in: vi.fn(() => chain),
    not: vi.fn(() => chain),
    single: vi.fn().mockResolvedValue({ data, error }),
    maybeSingle: vi.fn().mockResolvedValue({ data, error }),
    upsert: vi.fn().mockResolvedValue({ error }),
  };

  return chain;
}

function mockRegularisationClient({
  repartitionsDepenses,
}: {
  repartitionsDepenses: Array<{ coproprietaire_id: string; montant_du: number }>;
}) {
  const regularisationUpsert = vi.fn().mockResolvedValue({ error: null });

  createClientMock.mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'syndic_1' } } }),
    },
    from: vi.fn().mockImplementation((table: string) => {
      if (table === 'exercices') {
        return createResultChain({
          id: 'ex_1',
          statut: 'ouvert',
          copropriete_id: 'copro_1',
          date_debut: '2025-01-01',
          date_fin: '2025-12-31',
        });
      }

      if (table === 'coproprietes') {
        return createResultChain({ id: 'copro_1' });
      }

      if (table === 'coproprietaires') {
        return createResultChain([
          { id: 'copro_a' },
          { id: 'copro_b' },
        ]);
      }

      if (table === 'lots') {
        return createResultChain([
          { tantiemes: 200, coproprietaire_id: 'copro_a' },
          { tantiemes: 200, coproprietaire_id: 'copro_b' },
        ]);
      }

      if (table === 'appels_de_fonds') {
        return createResultChain([{ id: 'appel_1' }]);
      }

      if (table === 'lignes_appels_de_fonds') {
        return createResultChain([
          { coproprietaire_id: 'copro_a', montant_du: 50 },
          { coproprietaire_id: 'copro_b', montant_du: 50 },
        ]);
      }

      if (table === 'depenses') {
        return createResultChain([{ id: 'dep_1', montant: 100 }]);
      }

      if (table === 'repartitions_depenses') {
        return createResultChain(repartitionsDepenses);
      }

      if (table === 'regularisation_lignes') {
        const chain = createResultChain([]);
        chain.upsert = regularisationUpsert;
        return chain;
      }

      return createResultChain(null);
    }),
  });

  return { regularisationUpsert };
}

describe('regularisation actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('utilise les repartitions de dépenses quand elles existent pour la régularisation', async () => {
    const { regularisationUpsert } = mockRegularisationClient({
      repartitionsDepenses: [
        { coproprietaire_id: 'copro_a', montant_du: 80 },
        { coproprietaire_id: 'copro_b', montant_du: 20 },
      ],
    });

    const { calculerRegularisation } = await import('./actions');
    const result = await calculerRegularisation('ex_1');

    expect(result).toEqual({});
    expect(regularisationUpsert).toHaveBeenCalledWith([
      expect.objectContaining({ coproprietaire_id: 'copro_a', montant_appele: 50, montant_reel: 80 }),
      expect.objectContaining({ coproprietaire_id: 'copro_b', montant_appele: 50, montant_reel: 20 }),
    ], { onConflict: 'exercice_id,coproprietaire_id' });
    expect(revalidatePathMock).toHaveBeenCalledWith('/regularisation');
  });

  it('retombe sur la clé générale par tantièmes si aucune repartition de dépense n’est disponible', async () => {
    const { regularisationUpsert } = mockRegularisationClient({
      repartitionsDepenses: [],
    });

    const { calculerRegularisation } = await import('./actions');
    const result = await calculerRegularisation('ex_1');

    expect(result).toEqual({});
    expect(regularisationUpsert).toHaveBeenCalledWith([
      expect.objectContaining({ coproprietaire_id: 'copro_a', montant_appele: 50, montant_reel: 50 }),
      expect.objectContaining({ coproprietaire_id: 'copro_b', montant_appele: 50, montant_reel: 50 }),
    ], { onConflict: 'exercice_id,coproprietaire_id' });
  });

  it('utilise la RPC atomique pour cloturer l’exercice', async () => {
    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'syndic_1' } } }),
      },
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'exercices') {
          return createResultChain({
            id: 'ex_1',
            statut: 'ouvert',
            copropriete_id: 'copro_1',
            date_debut: '2025-01-01',
            date_fin: '2025-12-31',
          });
        }

        if (table === 'coproprietes') {
          return createResultChain({ id: 'copro_1' });
        }

        return createResultChain(null);
      }),
    });

    const rpc = vi.fn().mockResolvedValue({ data: [{ copropriete_id: 'copro_1', updated_rows: 3 }], error: null });
    createAdminClientMock.mockReturnValue({ rpc });

    const { cloturerExercice } = await import('./actions');
    const result = await cloturerExercice('ex_1');

    expect(result).toEqual({});
    expect(rpc).toHaveBeenCalledWith('cloturer_regularisation_exercice', { p_exercice_id: 'ex_1' });
    expect(revalidatePathMock).toHaveBeenCalledWith('/regularisation');
    expect(revalidatePathMock).toHaveBeenCalledWith('/coproprietaires');
    expect(invalidateCoproprietairesCacheMock).toHaveBeenCalledWith('copro_1');
  });
});
