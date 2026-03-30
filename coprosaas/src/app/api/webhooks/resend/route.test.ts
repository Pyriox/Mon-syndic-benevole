import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const applyProviderEventMock = vi.fn();
const pushAdminAlertMock = vi.fn();
const pushNotificationMock = vi.fn();
const adminFromMock = vi.fn();

vi.mock('@/lib/email-delivery', () => ({
  applyProviderEvent: applyProviderEventMock,
}));

vi.mock('@/lib/notification-center', () => ({
  pushAdminAlert: pushAdminAlertMock,
  pushNotification: pushNotificationMock,
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: adminFromMock,
  }),
}));

function buildReq(body: unknown, secret?: string): Request {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (secret) headers.authorization = `Bearer ${secret}`;
  return new Request('http://localhost/api/webhooks/resend', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
}

describe('POST /api/webhooks/resend', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RESEND_WEBHOOK_SECRET = 'whsec_test';
  });

  it('retourne 401 si secret invalide', async () => {
    const { POST } = await import('./route');
    const res = await POST(buildReq({ type: 'email.delivered', email_id: 'm1' }, 'wrong') as unknown as NextRequest);
    expect(res.status).toBe(401);
  });

  it('ignore les payloads incomplets', async () => {
    const { POST } = await import('./route');
    const res = await POST(buildReq({ foo: 'bar' }, 'whsec_test') as unknown as NextRequest);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.ignored).toBe(true);
    expect(applyProviderEventMock).not.toHaveBeenCalled();
  });

  it('declenche une alerte admin sur bounced', async () => {
    applyProviderEventMock.mockResolvedValue({
      delivery: {
        id: 'd1',
        recipient_email: 'cp@test.fr',
        copropriete_id: 'c1',
        ag_id: 'ag1',
        template_key: 'ag_convocation',
        status: 'sent',
      },
      newStatus: 'bounced',
    });

    const maybeSingle = vi.fn().mockResolvedValue({ data: { id: 'c1', syndic_id: 's1', nom: 'Copro' } });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const select = vi.fn().mockReturnValue({ eq });
    adminFromMock.mockReturnValue({ select });

    const { POST } = await import('./route');
    const res = await POST(buildReq({ type: 'email.bounced', email_id: 'msg-1' }, 'whsec_test') as unknown as NextRequest);

    expect(res.status).toBe(200);
    expect(applyProviderEventMock).toHaveBeenCalled();
    expect(pushAdminAlertMock).toHaveBeenCalledTimes(1);
  });
});
