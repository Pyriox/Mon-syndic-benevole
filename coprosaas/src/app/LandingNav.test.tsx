// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const pushMock = vi.fn();
const prefetchMock = vi.fn();
const getSessionMock = vi.fn();
const unsubscribeMock = vi.fn();
const routerMock = {
  push: pushMock,
  prefetch: prefetchMock,
};
const onAuthStateChangeMock = vi.fn(() => ({
  data: {
    subscription: {
      unsubscribe: unsubscribeMock,
    },
  },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => routerMock,
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

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getSession: getSessionMock,
      onAuthStateChange: onAuthStateChangeMock,
    },
  }),
}));

describe('LandingNav auth navigation', () => {
  beforeEach(() => {
    pushMock.mockReset();
    prefetchMock.mockReset();
    getSessionMock.mockReset();
    onAuthStateChangeMock.mockClear();
    unsubscribeMock.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it('ouvre /login sans refaire un getSession au clic quand la session est absente', async () => {
    getSessionMock.mockResolvedValue({ data: { session: null } });

    const { default: LandingNav } = await import('./LandingNav');
    render(<LandingNav />);

    await waitFor(() => {
      expect(getSessionMock).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(screen.getAllByRole('button', { name: /connexion/i })[0]);

    expect(pushMock).toHaveBeenCalledWith('/login');
    expect(getSessionMock).toHaveBeenCalledTimes(1);
  });

  it('ouvre /dashboard sans refaire un getSession au clic quand la session existe déjà', async () => {
    getSessionMock.mockResolvedValue({ data: { session: { user: { id: 'u1' } } } });

    const { default: LandingNav } = await import('./LandingNav');
    render(<LandingNav />);

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /tableau de bord/i })[0]).toBeTruthy();
    });

    fireEvent.click(screen.getAllByRole('button', { name: /tableau de bord/i })[0]);

    expect(pushMock).toHaveBeenCalledWith('/dashboard');
    expect(getSessionMock).toHaveBeenCalledTimes(1);
  });
});
