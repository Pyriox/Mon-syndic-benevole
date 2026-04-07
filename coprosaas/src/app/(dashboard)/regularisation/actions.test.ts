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

describe('cloturerExercice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('utilise la RPC atomique pour cloturer l’exercice', async () => {
    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'syndic_1' } } }),
      },
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'exercices') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'ex_1',
                    statut: 'ouvert',
                    copropriete_id: 'copro_1',
                    date_debut: '2025-01-01',
                    date_fin: '2025-12-31',
                  },
                }),
              }),
            }),
          };
        }

        if (table === 'coproprietes') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'copro_1' } }),
                }),
              }),
            }),
          };
        }

        return {};
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
