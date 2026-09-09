// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const pushMock = vi.fn();
const prefetchMock = vi.fn();
const routerMock = {
  push: pushMock,
  prefetch: prefetchMock,
};
const getSessionMock = vi.fn();
const unsubscribeMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => routerMock,
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getSession: getSessionMock,
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: unsubscribeMock } } }),
    },
  }),
}));

vi.mock('next/link', () => ({
  default: ({ children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a {...props}>{children}</a>
  ),
}));

vi.mock('@/components/ui/SiteLogo', () => ({
  default: () => <span data-testid="site-logo" />,
}));

vi.mock('@/components/ui/CtaLink', () => ({
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { ctaLocation?: string }) => {
    const { ctaLocation, ...linkProps } = props;
    void ctaLocation;
    return <a href={href} {...linkProps}>{children}</a>;
  },
}));

describe('LandingNav auth navigation', () => {
  beforeEach(() => {
    pushMock.mockReset();
    prefetchMock.mockReset();
    getSessionMock.mockReset();
    unsubscribeMock.mockReset();
    getSessionMock.mockResolvedValue({ data: { session: null } });
    document.cookie = '';
  });

  afterEach(() => {
    cleanup();
  });

  it('ouvre /login quand aucun cookie auth n\'est présent', async () => {
    const { default: LandingNav } = await import('./LandingNav');
    render(<LandingNav />);

    await waitFor(() => expect(prefetchMock).toHaveBeenCalled());

    fireEvent.click(screen.getAllByRole('button', { name: /connexion/i })[0]);

    expect(pushMock).toHaveBeenCalledWith('/login');
  });

  it('ouvre /dashboard quand un cookie auth est détecté', async () => {
    getSessionMock.mockResolvedValue({ data: { session: { user: { id: 'user-1' } } } });

    const { default: LandingNav } = await import('./LandingNav');
    render(<LandingNav />);

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /mon espace/i })[0]).toBeTruthy();
    });

    fireEvent.click(screen.getAllByRole('button', { name: /mon espace/i })[0]);

    expect(pushMock).toHaveBeenCalledWith('/dashboard');
  });
});
