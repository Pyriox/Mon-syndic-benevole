import { describe, expect, it, vi } from 'vitest';
import { listAllAdminAuthUsers } from '../admin-auth-users';

describe('listAllAdminAuthUsers', () => {
  it('fetches all auth pages and returns metadata', async () => {
    const listUsers = vi
      .fn()
      .mockResolvedValueOnce({ data: { users: [{ id: '1' }, { id: '2' }], total: 5 }, error: null })
      .mockResolvedValueOnce({ data: { users: [{ id: '3' }, { id: '4' }], total: 5 }, error: null })
      .mockResolvedValueOnce({ data: { users: [{ id: '5' }], total: 5 }, error: null });

    const result = await listAllAdminAuthUsers({ auth: { admin: { listUsers } } } as never, 2);

    expect(result.users).toHaveLength(5);
    expect(result.total).toBe(5);
    expect(result.truncated).toBe(false);
  });

  it('flags the result as truncated when the max pages cap is reached', async () => {
    const listUsers = vi
      .fn()
      .mockResolvedValue({ data: { users: [{ id: '1' }, { id: '2' }], total: 99 }, error: null });

    const result = await listAllAdminAuthUsers({ auth: { admin: { listUsers } } } as never, 2, 2);

    expect(result.users).toHaveLength(4);
    expect(result.total).toBe(99);
    expect(result.truncated).toBe(true);
  });
});
