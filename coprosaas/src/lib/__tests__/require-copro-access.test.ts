import { beforeEach, describe, expect, it, vi } from 'vitest';

const getAuthUserMock = vi.fn();
const createAdminClientMock = vi.fn();
const cookiesMock = vi.fn();
const redirectMock = vi.fn((url: string) => {
  throw new Error(`redirect:${url}`);
});

vi.mock('@/lib/supabase/server', () => ({
  getAuthUser: getAuthUserMock,
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: createAdminClientMock,
}));

vi.mock('next/headers', () => ({
  cookies: cookiesMock,
}));

vi.mock('next/navigation', () => ({
  redirect: redirectMock,
}));

function createMaybeSingleQuery(resultFactory: (filters: Record<string, unknown>) => unknown) {
  const filters: Record<string, unknown> = {};
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn((column: string, value: unknown) => {
      filters[column] = value;
      return query;
    }),
    is: vi.fn((column: string, value: unknown) => {
      filters[`is:${column}`] = value;
      return query;
    }),
    order: vi.fn(() => query),
    limit: vi.fn(() => query),
    maybeSingle: vi.fn(async () => ({ data: resultFactory(filters) })),
  };

  return query;
}

describe('requireCoproAccess', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();

    getAuthUserMock.mockResolvedValue({
      id: 'user-1',
      email: 'owner@example.com',
    });

    cookiesMock.mockResolvedValue({
      get: vi.fn(() => undefined),
    });

    createAdminClientMock.mockImplementation(() => ({
      from: (table: string) => {
        if (table === 'coproprietes') {
          return createMaybeSingleQuery(() => null);
        }

        if (table === 'coproprietaires') {
          return createMaybeSingleQuery((filters) => {
            if (filters.email === 'owner@example.com' && filters['is:user_id'] === null) {
              return {
                coproprietes: {
                  id: 'copro-1',
                  nom: 'Villa des Fleurs',
                  syndic_id: 'syndic-1',
                  plan: 'actif',
                  plan_id: 'plan_123',
                },
              };
            }
            return null;
          });
        }

        throw new Error(`Unexpected table: ${table}`);
      },
    }));
  });

  it('retrouve la copropriété d’un copropriétaire via son email quand le cookie est absent', async () => {
    const { requireCoproAccess } = await import('@/lib/supabase/require-copro-access');

    const result = await requireCoproAccess();

    expect(result.selectedCoproId).toBe('copro-1');
    expect(result.role).toBe('copropriétaire');
    expect(result.copro?.nom).toBe('Villa des Fleurs');
  });
});
