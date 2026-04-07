import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const createClientMock = vi.fn();
const createAdminClientMock = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: createClientMock,
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: createAdminClientMock,
}));

describe('GET /api/documents/[docId]/download', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('bloque un coproprietaire qui tente d’ouvrir un document individuel d’un autre coproprietaire', async () => {
    const documentQuery = {
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            id: 'doc_1',
            url: 'https://example.supabase.co/storage/v1/object/public/documents/private/doc-1.pdf',
            copropriete_id: 'copro_1',
            nom: 'Appel individuel',
            coproprietaire_id: 'copro_target',
          },
        }),
      }),
    };

    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user_1' } } }),
      },
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'documents') {
          return {
            select: vi.fn().mockReturnValue(documentQuery),
          };
        }
        return {};
      }),
    });

    const createSignedUrl = vi.fn().mockResolvedValue({
      data: { signedUrl: 'https://signed.example.com/doc-1' },
      error: null,
    });

    createAdminClientMock.mockReturnValue({
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'coproprietes') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({ data: null }),
                }),
              }),
            }),
          };
        }

        if (table === 'coproprietaires') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'copro_other' } }),
                }),
              }),
            }),
          };
        }

        return {};
      }),
      storage: {
        from: vi.fn().mockReturnValue({ createSignedUrl }),
      },
    });

    const { GET } = await import('./route');
    const res = await GET(
      new Request('http://localhost/api/documents/doc_1/download') as unknown as NextRequest,
      { params: Promise.resolve({ docId: 'doc_1' }) },
    );

    expect(res.status).toBe(403);
    expect(createSignedUrl).not.toHaveBeenCalled();
  });
});
