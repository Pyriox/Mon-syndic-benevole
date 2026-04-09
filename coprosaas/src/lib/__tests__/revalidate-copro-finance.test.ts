import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  revalidatePathMock,
  invalidateDashboardCacheMock,
  invalidateCoproprietairesCacheMock,
} = vi.hoisted(() => ({
  revalidatePathMock: vi.fn(),
  invalidateDashboardCacheMock: vi.fn(),
  invalidateCoproprietairesCacheMock: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: revalidatePathMock,
}));

vi.mock('../cached-queries', () => ({
  invalidateDashboardCache: invalidateDashboardCacheMock,
  invalidateCoproprietairesCache: invalidateCoproprietairesCacheMock,
}));

import { revalidateCoproFinance } from '../actions/revalidate-copro-finance';

describe('revalidateCoproFinance', () => {
  beforeEach(() => {
    revalidatePathMock.mockReset();
    invalidateDashboardCacheMock.mockReset();
    invalidateCoproprietairesCacheMock.mockReset();
  });

  it('revalidates dashboard and finance views for a copropriété', async () => {
    await revalidateCoproFinance('copro_1');

    expect(invalidateDashboardCacheMock).toHaveBeenCalledWith('copro_1');
    expect(invalidateCoproprietairesCacheMock).toHaveBeenCalledWith('copro_1');
    expect(revalidatePathMock).toHaveBeenCalledWith('/dashboard');
    expect(revalidatePathMock).toHaveBeenCalledWith('/coproprietaires');
    expect(revalidatePathMock).toHaveBeenCalledWith('/appels-de-fonds');
    expect(revalidatePathMock).toHaveBeenCalledWith('/depenses');
    expect(revalidatePathMock).toHaveBeenCalledWith('/regularisation');
    expect(revalidatePathMock).toHaveBeenCalledWith('/coproprietes/copro_1');
    expect(revalidatePathMock).toHaveBeenCalledWith('/coproprietes/copro_1/parametrage');
  });

  it('does nothing when no copropriété is provided', async () => {
    await revalidateCoproFinance('');

    expect(invalidateDashboardCacheMock).not.toHaveBeenCalled();
    expect(invalidateCoproprietairesCacheMock).not.toHaveBeenCalled();
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });
});
