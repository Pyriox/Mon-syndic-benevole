// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const pushMock = vi.fn();
const prefetchMock = vi.fn();
const routerMock = {
  push: pushMock,
  prefetch: prefetchMock,
};

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

describe('LandingNav auth navigation', () => {
  beforeEach(() => {
    pushMock.mockReset();
    prefetchMock.mockReset();
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
    document.cookie = 'sb-project-auth-token=token';

    const { default: LandingNav } = await import('./LandingNav');
    render(<LandingNav />);

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /mon espace/i })[0]).toBeTruthy();
    });

    fireEvent.click(screen.getAllByRole('button', { name: /mon espace/i })[0]);

    expect(pushMock).toHaveBeenCalledWith('/dashboard');
  });
});
