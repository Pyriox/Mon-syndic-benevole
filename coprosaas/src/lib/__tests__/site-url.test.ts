import { afterEach, describe, expect, it } from 'vitest';
import sitemap from '@/app/sitemap';
import { getCanonicalSiteUrl } from '../site-url';

afterEach(() => {
  delete process.env.NEXT_PUBLIC_SITE_URL;
  delete process.env.SITE_URL;
  delete process.env.APP_URL;
});

describe('canonical public URLs', () => {
  it('uses the www domain as the production canonical host', () => {
    expect(getCanonicalSiteUrl()).toBe('https://www.mon-syndic-benevole.fr');
  });

  it('publishes sitemap entries on the canonical www host', () => {
    const entries = sitemap();

    expect(entries.length).toBeGreaterThan(0);
    expect(entries.every((entry) => entry.url.startsWith('https://www.mon-syndic-benevole.fr'))).toBe(true);
  });
});
