import { beforeEach, describe, expect, it, vi } from 'vitest';

const insertMock = vi.fn();
const fromMock = vi.fn();
const createAdminClientMock = vi.fn();
const invalidateLayoutCacheMock = vi.fn();

vi.mock('server-only', () => ({}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: createAdminClientMock,
}));

vi.mock('@/lib/cached-queries', () => ({
  invalidateLayoutCache: invalidateLayoutCacheMock,
}));

describe('notification-center', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    insertMock.mockResolvedValue({ error: null });
    fromMock.mockReturnValue({ insert: insertMock });
    createAdminClientMock.mockReturnValue({ from: fromMock });
  });

  it('invalide le cache layout apres une notification persistante', async () => {
    const { pushNotification } = await import('../notification-center');

    await pushNotification({
      userId: 'u1',
      type: 'ag',
      title: 'PV envoye',
    });

    expect(fromMock).toHaveBeenCalledWith('app_notifications');
    expect(invalidateLayoutCacheMock).toHaveBeenCalledWith('u1');
  });

  it('dedoublonne les invalidations lors d un envoi en masse', async () => {
    const { pushNotifications } = await import('../notification-center');

    await pushNotifications([
      { userId: 'u1', type: 'ag', title: 'A' },
      { userId: 'u1', type: 'incident', title: 'B' },
      { userId: 'u2', type: 'appel_fonds', title: 'C' },
    ]);

    expect(invalidateLayoutCacheMock).toHaveBeenCalledTimes(2);
    expect(invalidateLayoutCacheMock).toHaveBeenNthCalledWith(1, 'u1');
    expect(invalidateLayoutCacheMock).toHaveBeenNthCalledWith(2, 'u2');
  });
});