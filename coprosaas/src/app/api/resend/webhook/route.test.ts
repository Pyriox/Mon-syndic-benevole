import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const verifyMock = vi.fn();
const applyProviderEventMock = vi.fn();
const pushAdminAlertMock = vi.fn();

vi.mock('resend', () => ({
  Resend: class {
    webhooks = { verify: verifyMock };
  },
}));

vi.mock('@/lib/email-delivery', () => ({
  applyProviderEvent: applyProviderEventMock,
}));

vi.mock('@/lib/notification-center', () => ({
  pushAdminAlert: pushAdminAlertMock,
}));

const adminFromMock = vi.fn(() => ({
  update: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
}));
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({ from: adminFromMock })),
}));

function makeRequest(headers?: Record<string, string>, body = '{}'): Request {
  return new Request('http://localhost/api/resend/webhook', {
    method: 'POST',
    headers,
    body,
  });
}

describe('POST /api/resend/webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RESEND_WEBHOOK_SECRET = 'whsec_test';
    process.env.RESEND_API_KEY = 're_test';
    applyProviderEventMock.mockResolvedValue({ delivery: null, newStatus: null });
    pushAdminAlertMock.mockResolvedValue(undefined);
  });

  it('retourne 400 si les headers svix sont absents', async () => {
    const { POST } = await import('./route');
    const res = await POST(makeRequest({ 'content-type': 'application/json' }) as never);

    expect(res.status).toBe(400);
    expect(verifyMock).not.toHaveBeenCalled();
  });

  it('applique un evenement valide et alerte en cas de bounce', async () => {
    verifyMock.mockReturnValue({
      type: 'email.bounced',
      created_at: '2026-04-01T18:00:00.000Z',
      data: {
        email_id: 'email_123',
        to: ['copro@example.com'],
        subject: 'Test',
        bounce: { message: 'Mailbox unavailable' },
      },
    });
    applyProviderEventMock.mockResolvedValue({
      delivery: {
        id: 'delivery_1',
        recipient_email: 'copro@example.com',
        copropriete_id: 'copro_1',
        ag_id: null,
        template_key: 'appel_avis',
        status: 'sent',
      },
      newStatus: 'bounced',
    });

    const { POST } = await import('./route');
    const res = await POST(makeRequest({
      'content-type': 'application/json',
      'svix-id': 'msg_1',
      'svix-timestamp': '1711994400',
      'svix-signature': 'sig_1',
    }, '{"ok":true}') as never);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(applyProviderEventMock).toHaveBeenCalledWith(expect.objectContaining({
      providerMessageId: 'email_123',
      providerEvent: 'email.bounced',
      payload: {
        email_id: 'email_123',
        to: ['copro@example.com'],
        subject: 'Test',
        bounce: { message: 'Mailbox unavailable' },
      },
      recipientEmail: 'copro@example.com',
      subject: 'Test',
    }));
    expect(pushAdminAlertMock).toHaveBeenCalledTimes(1);
    expect(json).toEqual({ ok: true, matched: true, status: 'bounced' });
  });
});