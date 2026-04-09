import { beforeEach, describe, expect, it, vi } from 'vitest';

const getSessionMock = vi.fn();
const getUserMock = vi.fn();
const isAdminUserMock = vi.fn();

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getSession: getSessionMock,
      getUser: getUserMock,
    },
  })),
}));

vi.mock('@/lib/admin-config', () => ({
  isAdminUser: isAdminUserMock,
}));

function buildRequest(url: string) {
  const nextUrl = new URL(url);

  return {
    nextUrl: {
      pathname: nextUrl.pathname,
      searchParams: nextUrl.searchParams,
      clone: () => new URL(nextUrl.toString()),
    },
    cookies: {
      getAll: () => [],
      set: vi.fn(),
    },
  };
}

describe('proxy auth flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSessionMock.mockResolvedValue({ data: { session: null } });
    getUserMock.mockResolvedValue({ data: { user: null }, error: null });
    isAdminUserMock.mockResolvedValue(false);
  });

  it('laisse /login accessible quand le cookie de session est périmé', async () => {
    getSessionMock.mockResolvedValue({
      data: {
        session: {
          user: { id: 'stale-user' },
        },
      },
    });
    getUserMock.mockResolvedValue({
      data: { user: null },
      error: { message: 'Auth session missing' },
    });

    const { proxy } = await import('./proxy');
    const response = await proxy(buildRequest('https://example.com/login') as never);

    expect(response.headers.get('location')).toBeNull();
    expect(getUserMock).toHaveBeenCalledTimes(1);
  });

  it('redirige /login vers /dashboard quand la session est validée', async () => {
    getSessionMock.mockResolvedValue({
      data: {
        session: {
          user: { id: 'user-1' },
        },
      },
    });
    getUserMock.mockResolvedValue({
      data: {
        user: { id: 'user-1' },
      },
      error: null,
    });

    const { proxy } = await import('./proxy');
    const response = await proxy(buildRequest('https://example.com/login') as never);

    expect(response.headers.get('location')).toBe('https://example.com/dashboard');
  });
});
