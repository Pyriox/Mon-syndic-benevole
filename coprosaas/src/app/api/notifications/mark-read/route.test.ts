import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const createClientMock = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: createClientMock,
}));

function buildReq(body: unknown): Request {
  return new Request('http://localhost/api/notifications/mark-read', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/notifications/mark-read', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retourne 401 si non authentifie', async () => {
    createClientMock.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    });

    const { POST } = await import('./route');
    const res = await POST(buildReq({ all: true }) as unknown as NextRequest);

    expect(res.status).toBe(401);
  });

  it('marque tout comme lu', async () => {
    const eqSecond = vi.fn().mockReturnValue({ error: null });
    const eqFirst = vi.fn().mockReturnValue({ eq: eqSecond });
    const update = vi.fn().mockReturnValue({ eq: eqFirst });

    const limit = vi.fn().mockResolvedValue({ data: [], error: null });
    const order2 = vi.fn().mockReturnValue({ limit });
    const order1 = vi.fn().mockReturnValue({ order: order2 });
    const eqRead = vi.fn().mockReturnValue({ order: order1 });
    const eqUser = vi.fn().mockReturnValue({ eq: eqRead });
    const select = vi.fn().mockReturnValue({ eq: eqUser });

    const from = vi.fn().mockImplementation((table: string) => {
      if (table !== 'app_notifications') return {};
      return {
        update,
        select,
      };
    });

    createClientMock.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
      from,
    });

    const { POST } = await import('./route');
    const res = await POST(buildReq({ all: true }) as unknown as NextRequest);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(from).toHaveBeenCalledWith('app_notifications');
    expect(update).toHaveBeenCalled();
    expect(eqFirst).toHaveBeenCalledWith('user_id', 'u1');
    expect(eqSecond).toHaveBeenCalledWith('is_read', false);
    expect(select).toHaveBeenCalledWith('id');
  });

  it('retourne 400 si ids vide', async () => {
    createClientMock.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
      from: vi.fn(),
    });

    const { POST } = await import('./route');
    const res = await POST(buildReq({ ids: [] }) as unknown as NextRequest);

    expect(res.status).toBe(400);
  });
});
