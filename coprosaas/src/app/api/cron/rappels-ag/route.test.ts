import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const fromMock = vi.fn();
const sendMock = vi.fn();

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({ from: fromMock }),
}));

vi.mock('@/lib/notification-center', () => ({
  pushNotification: vi.fn().mockResolvedValue(undefined),
  pushAdminAlert: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/email-delivery', () => ({
  trackEmailDelivery: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('resend', () => ({
  Resend: class {
    emails = { send: sendMock };
  },
}));

function makeEmptyChain() {
  const chain: Record<string, unknown> = {
    data: [],
    error: null,
  };
  const methods = ['select', 'eq', 'not', 'is', 'in', 'lt', 'lte', 'gt', 'gte', 'limit', 'order', 'update'];
  for (const m of methods) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  return chain;
}

function req(secret?: string): Request {
  const headers: Record<string, string> = {};
  if (secret) headers.authorization = `Bearer ${secret}`;
  return new Request('http://localhost/api/cron/rappels-ag', { method: 'GET', headers });
}

describe('GET /api/cron/rappels-ag', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = 'cron_test_secret';
    fromMock.mockImplementation(() => makeEmptyChain());
  });

  it('retourne 401 si secret invalide', async () => {
    const { GET } = await import('./route');
    const res = await GET(req('wrong') as unknown as NextRequest);
    expect(res.status).toBe(401);
  });

  it('retourne ok avec zero envoi quand aucun candidat', async () => {
    const { GET } = await import('./route');
    const res = await GET(req('cron_test_secret') as unknown as NextRequest);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.sent).toBe(0);
    expect(json.retries).toBe(0);
  });
});
