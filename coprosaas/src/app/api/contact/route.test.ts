import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const createAdminClientMock = vi.fn();
const createClientMock = vi.fn();
const rateLimitMock = vi.fn();
const getClientIpMock = vi.fn();
const trackResendSendResultMock = vi.fn();
const resendSendMock = vi.fn();

vi.mock('resend', () => ({
  Resend: class {
    emails = { send: resendSendMock };
  },
}));

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: rateLimitMock,
  getClientIp: getClientIpMock,
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: createAdminClientMock,
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: createClientMock,
}));

vi.mock('@/lib/email-delivery', () => ({
  trackResendSendResult: trackResendSendResultMock,
}));

describe('POST /api/contact', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rateLimitMock.mockResolvedValue(true);
    getClientIpMock.mockReturnValue('127.0.0.1');
    resendSendMock.mockResolvedValue({ error: { message: 'provider down' } });
    trackResendSendResultMock.mockResolvedValue({ ok: false, errorMessage: 'provider down' });
    createClientMock.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    });
  });

  it('cree quand meme un ticket support meme si l’email Resend echoue', async () => {
    const insertTicketSingle = vi.fn().mockResolvedValue({ data: { id: 'ticket_1' } });
    const insertTicketSelect = vi.fn().mockReturnValue({ single: insertTicketSingle });
    const insertTicket = vi.fn().mockReturnValue({ select: insertTicketSelect });
    const insertMessage = vi.fn().mockResolvedValue({ error: null });
    const insertEvent = vi.fn().mockResolvedValue({ error: null });

    createAdminClientMock.mockReturnValue({
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'support_tickets') {
          return { insert: insertTicket };
        }
        if (table === 'support_messages') {
          return { insert: insertMessage };
        }
        if (table === 'user_events') {
          return { insert: insertEvent };
        }
        return {};
      }),
    });

    const { POST } = await import('./route');
    const res = await POST(
      new Request('http://localhost/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Alice Martin',
          email: 'alice@example.com',
          subject: 'Besoin d’aide',
          message: 'Je ne retrouve pas mes documents.',
          userId: 'user_1',
        }),
      }) as unknown as NextRequest,
    );

    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.ticketId).toBe('ticket_1');
    expect(insertTicket).toHaveBeenCalled();
    expect(insertMessage).toHaveBeenCalled();
  });

  it('refuse un ticket coproprietaire hors support technique', async () => {
    createClientMock.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-copro' } } }) },
    });

    const insertTicket = vi.fn();
    const adminFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'coproprietes') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        };
      }
      if (table === 'coproprietaires') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'cp-1' }, error: null }),
            }),
          }),
        };
      }
      if (table === 'support_tickets') {
        return { insert: insertTicket };
      }
      return { insert: vi.fn() };
    });

    createAdminClientMock.mockReturnValue({ from: adminFrom });

    const { POST } = await import('./route');
    const res = await POST(
      new Request('http://localhost/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Alice Martin',
          email: 'alice@example.com',
          subject: 'Question sur mon solde',
          message: 'Pourquoi mon appel de fonds est-il aussi élevé ?',
          supportRole: 'copropriétaire',
          supportTopic: 'Question sur mon solde',
        }),
      }) as unknown as NextRequest,
    );

    const json = await res.json();

    expect(res.status).toBe(422);
    expect(json.message).toMatch(/support copropriétaire traite uniquement les problèmes techniques/i);
    expect(insertTicket).not.toHaveBeenCalled();
  });
});
