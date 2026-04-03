// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

vi.mock('next/link', () => ({
  default: ({ children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a {...props}>{children}</a>
  ),
}));

describe('CookieBanner', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('NEXT_PUBLIC_GTM_ID', 'GTM-TEST');
    vi.stubEnv('NEXT_PUBLIC_GA_ID', 'G-TEST');

    window.gtag = vi.fn();
    window.dataLayer = [];
    localStorage.clear();
    document.cookie = '';
    window.history.replaceState({}, '', '/blog/test');
    Object.defineProperty(document, 'title', {
      value: 'Article test',
      configurable: true,
    });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
  });

  it('enregistre un refus, efface les cookies Google et peut se rouvrir', async () => {
    document.cookie = '_ga=refused-test; path=/';

    const { default: CookieBanner } = await import('./CookieBanner');
    render(<CookieBanner />);

    fireEvent.click(screen.getByRole('button', { name: /Refuser les cookies optionnels/i }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /Préférences cookies/i })).toBeNull();
    });

    const stored = JSON.parse(localStorage.getItem('cookie_consent') ?? '{}');
    expect(stored.value).toBe('refused');
    expect(document.cookie).not.toContain('_ga=refused-test');

    window.dispatchEvent(new Event('show-cookie-banner'));

    expect(await screen.findByRole('dialog', { name: /Préférences cookies/i })).not.toBeNull();
  });

  it('enregistre une acceptation et envoie immédiatement une pageview', async () => {
    const { default: CookieBanner } = await import('./CookieBanner');
    render(<CookieBanner />);

    fireEvent.click(screen.getByRole('button', { name: /Oui, j’accepte|Oui, j&apos;accepte|Oui, j'accepte/i }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /Préférences cookies/i })).toBeNull();
    });

    const stored = JSON.parse(localStorage.getItem('cookie_consent') ?? '{}');
    expect(stored.value).toBe('accepted');
    expect(window.dataLayer).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ event: 'virtual_pageview' }),
      ])
    );
  });
});
