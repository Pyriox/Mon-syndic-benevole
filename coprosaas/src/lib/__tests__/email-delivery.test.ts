import { beforeEach, describe, expect, it, vi } from 'vitest';

const getEmailMock = vi.fn();
const listEmailsMock = vi.fn();
const updateEqMock = vi.fn();
const updateMock = vi.fn(() => ({ eq: updateEqMock }));
const inMock = vi.fn();
const selectMock = vi.fn(() => ({ in: inMock }));
const upsertMock = vi.fn();
const fromMock = vi.fn((table: string) => {
  if (table === 'email_deliveries') {
    return {
      update: updateMock,
      select: selectMock,
      upsert: upsertMock,
    };
  }

  return {};
});

vi.mock('server-only', () => ({}));

vi.mock('resend', () => ({
  Resend: class {
    emails = {
      get: getEmailMock,
      list: listEmailsMock,
    };
  },
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({ from: fromMock }),
}));

describe('syncEmailDeliveriesWithResend', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.RESEND_API_KEY = 're_test';
    updateEqMock.mockResolvedValue({ error: null });
    inMock.mockResolvedValue({ data: [] });
    upsertMock.mockResolvedValue({ error: null });
    listEmailsMock.mockResolvedValue({ data: { data: [], has_more: false }, error: null });
  });

  it('met à jour un email local "sent" avec le dernier statut Resend', async () => {
    getEmailMock.mockResolvedValue({
      data: {
        id: 'provider_1',
        last_event: 'email.delivered',
      },
      error: null,
    });

    const { syncEmailDeliveriesWithResend } = await import('@/lib/email-delivery');

    await syncEmailDeliveriesWithResend([
      { id: 'delivery_1', providerMessageId: 'provider_1', status: 'sent' },
    ]);

    expect(getEmailMock).toHaveBeenCalledWith('provider_1');
    expect(fromMock).toHaveBeenCalledWith('email_deliveries');
    expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({
      status: 'delivered',
    }));
    expect(updateEqMock).toHaveBeenCalledWith('id', 'delivery_1');
  });

  it('importe les emails Resend manquants dans email_deliveries', async () => {
    listEmailsMock.mockResolvedValue({
      data: {
        data: [
          {
            id: 'provider_missing',
            to: ['gilles.dansac@orange.fr'],
            subject: 'Activez votre compte — Mon Syndic Bénévole',
            created_at: '2026-04-09T11:28:08.753468+00:00',
            last_event: 'clicked',
            from: 'Mon Syndic Bénévole <noreply@mon-syndic-benevole.fr>',
            scheduled_at: null,
            bcc: null,
            cc: null,
            reply_to: null,
          },
        ],
        has_more: false,
      },
      error: null,
    });

    const { backfillEmailDeliveriesFromResend } = await import('@/lib/email-delivery');

    await backfillEmailDeliveriesFromResend();

    expect(listEmailsMock).toHaveBeenCalledWith({ limit: 100 });
    expect(upsertMock).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({
        provider_message_id: 'provider_missing',
        recipient_email: 'gilles.dansac@orange.fr',
        subject: 'Activez votre compte — Mon Syndic Bénévole',
        status: 'clicked',
        template_key: 'signup_confirmation',
      }),
    ]), {
      onConflict: 'provider_message_id',
      ignoreDuplicates: true,
    });
  });
});
