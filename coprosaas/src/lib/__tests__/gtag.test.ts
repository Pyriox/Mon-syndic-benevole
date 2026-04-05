// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('gtag helpers', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('NEXT_PUBLIC_GTM_ID', 'GTM-TEST');
    vi.stubEnv('NEXT_PUBLIC_GA_ID', 'G-TEST');

    window.gtag = vi.fn();
    window.dataLayer = [];
    delete window.__msbLastPageview;
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

    const pageViewEvent = window.dataLayer.find((event) => event.event === 'virtual_pageview');
    expect(pageViewEvent).toBeDefined();
    expect(pageViewEvent).not.toHaveProperty('page_path');

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

  it('ignore une pageview dupliquée sur la même URL', async () => {
    localStorage.setItem(
      'cookie_consent',
      JSON.stringify({
        value: 'accepted',
        timestamp: Date.now(),
        preferences: { analytics: true, ads: true },
      })
    );

    const { pageview } = await import('../gtag');

    pageview('/tarifs?plan=confort');
    pageview('/tarifs?plan=confort');

    expect(window.dataLayer.filter((event) => event.event === 'virtual_pageview')).toHaveLength(1);
  });

  it('sanitise les URLs d’auth avant envoi analytics sans perdre le type de flux', async () => {
    localStorage.setItem(
      'cookie_consent',
      JSON.stringify({
        value: 'accepted',
        timestamp: Date.now(),
        preferences: { analytics: true, ads: true },
      })
    );

    const { pageview } = await import('../gtag');

    pageview('/auth/confirm?token_hash=secret123&code=authcode&type=recovery&next=https://evil.example');

    const pageViewEvent = window.dataLayer.find((event) => event.event === 'virtual_pageview');
    expect(pageViewEvent).toBeDefined();
    expect(pageViewEvent).toEqual(
      expect.objectContaining({
        page_location: 'http://localhost:3000/auth/confirm?type=recovery',
      })
    );
  });

  it('autorise une nouvelle pageview sur la même URL après changement de consentement', async () => {
    const { pageview } = await import('../gtag');

    localStorage.setItem(
      'cookie_consent',
      JSON.stringify({
        value: 'refused',
        timestamp: Date.now(),
        preferences: { analytics: false, ads: false },
      })
    );
    pageview('/tarifs?plan=confort');

    localStorage.setItem(
      'cookie_consent',
      JSON.stringify({
        value: 'accepted',
        timestamp: Date.now(),
        preferences: { analytics: true, ads: true },
      })
    );
    pageview('/tarifs?plan=confort');

    expect(window.dataLayer.filter((event) => event.event === 'virtual_pageview')).toHaveLength(2);
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
