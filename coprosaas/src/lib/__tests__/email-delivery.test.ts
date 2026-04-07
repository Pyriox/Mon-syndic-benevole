import { beforeEach, describe, expect, it, vi } from 'vitest';

const getEmailMock = vi.fn();
const updateEqMock = vi.fn();
const updateMock = vi.fn(() => ({ eq: updateEqMock }));
const fromMock = vi.fn(() => ({ update: updateMock }));

vi.mock('server-only', () => ({}));

vi.mock('resend', () => ({
  Resend: class {
    emails = { get: getEmailMock };
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
});
