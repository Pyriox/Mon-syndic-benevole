// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('gtag helpers', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('NEXT_PUBLIC_GTM_ID', 'GTM-TEST');
    vi.stubEnv('NEXT_PUBLIC_GA_ID', 'G-TEST');

    window.gtag = vi.fn();
    window.dataLayer = [];
    localStorage.clear();
    document.cookie = '';
    window.history.replaceState({}, '', '/tarifs?plan=confort');
    Object.defineProperty(document, 'title', {
      value: 'Tarifs',
      configurable: true,
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('envoie les pageviews et événements anonymes en mode cookieless sans consentement analytics', async () => {
    localStorage.setItem(
      'cookie_consent',
      JSON.stringify({
        value: 'refused',
        timestamp: Date.now(),
        preferences: { analytics: false, ads: false },
      })
    );

    const { pageview, trackAnonymousEvent, trackEvent } = await import('../gtag');

    pageview('/tarifs?plan=confort');
    trackAnonymousEvent('click_cta', { location: 'pricing' });
    trackEvent('begin_checkout', { plan_id: 'confort' });
    trackEvent('purchase', {
      transaction_id: 'sub_123',
      value: 300,
      currency: 'EUR',
    });

    expect(window.dataLayer).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          event: 'virtual_pageview',
          page_path: '/tarifs?plan=confort',
          measurement_mode: 'cookieless',
        }),
        expect.objectContaining({
          event: 'click_cta',
          location: 'pricing',
          anonymize_ip: true,
          measurement_mode: 'cookieless',
        }),
      ])
    );

    expect(window.dataLayer).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          event: 'begin_checkout',
          plan_id: 'confort',
          measurement_mode: 'cookieless',
        }),
        expect.objectContaining({
          event: 'purchase',
          value: 300,
          currency: 'EUR',
          measurement_mode: 'cookieless',
        }),
      ])
    );

    const purchaseEvent = window.dataLayer.find((event) => event.event === 'purchase');
    expect(purchaseEvent).toBeDefined();
    expect(purchaseEvent).not.toHaveProperty('transaction_id');
  });

  it('supprime les cookies Google existants lors d’un refus', async () => {
    const { denyConsent } = await import('../gtag');

    document.cookie = '_ga=abc.123; path=/';
    document.cookie = '_gid=xyz.456; path=/';

    denyConsent();

    expect(window.gtag).toHaveBeenCalledWith(
      'consent',
      'update',
      expect.objectContaining({
        analytics_storage: 'denied',
        ad_storage: 'denied',
      })
    );
    expect(document.cookie).not.toContain('_ga=abc.123');
    expect(document.cookie).not.toContain('_gid=xyz.456');
  });
});
