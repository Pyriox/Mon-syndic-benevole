// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const replaceMock = vi.fn();
const prefetchMock = vi.fn();
const signInWithPasswordMock = vi.fn();
const redirectToDashboardMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: replaceMock,
    prefetch: prefetchMock,
  }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('next/link', () => ({
  default: ({ children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a {...props}>{children}</a>
  ),
}));

vi.mock('@/components/ui/SiteLogo', () => ({
  default: () => <div data-testid="site-logo" />,
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: signInWithPasswordMock,
      resend: vi.fn(),
    },
  }),
}));

vi.mock('@/lib/gtag', () => ({
  trackAnonymousEvent: vi.fn(),
  trackConsentAwareEvent: vi.fn(),
}));

vi.mock('@/lib/actions/log-user-event', () => ({
  logEventForEmail: vi.fn(() => Promise.resolve()),
}));

vi.mock('@/lib/auth-redirect', () => ({
  redirectToDashboard: redirectToDashboardMock,
}));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    signInWithPasswordMock.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });
  });

  it('force une navigation complète vers /dashboard après connexion réussie', async () => {
    const { default: LoginPage } = await import('./page');

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/adresse email/i), {
      target: { value: 'tpn.fabien@gmail.com' },
    });
    fireEvent.change(screen.getByLabelText(/mot de passe/i, { selector: 'input' }), {
      target: { value: 'secret1234' },
    });

    fireEvent.click(screen.getByRole('button', { name: /se connecter/i }));

    await waitFor(() => {
      expect(redirectToDashboardMock).toHaveBeenCalledTimes(1);
    });

    expect(replaceMock).not.toHaveBeenCalled();
  });
});
