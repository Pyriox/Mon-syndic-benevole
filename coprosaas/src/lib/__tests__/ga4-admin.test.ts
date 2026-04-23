import { generateKeyPairSync } from 'node:crypto';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

describe('getGa4AdminAnalytics', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('retourne un état non configuré si les variables GA4 sont absentes', async () => {
    vi.stubEnv('GA4_PROPERTY_ID', '');
    vi.stubEnv('GA4_SERVICE_ACCOUNT_EMAIL', '');
    vi.stubEnv('GA4_SERVICE_ACCOUNT_PRIVATE_KEY', '');

    const { getGa4AdminAnalytics } = await import('../ga4-admin');
    const result = await getGa4AdminAnalytics();

    expect(result.configured).toBe(false);
    expect(result.missingVars).toEqual([
      'GA4_PROPERTY_ID',
      'GA4_SERVICE_ACCOUNT_EMAIL',
      'GA4_SERVICE_ACCOUNT_PRIVATE_KEY',
    ]);
  });

  it('parse les rapports et ne demande que dashboard_page_view pour les pages internes', async () => {
    const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
    const privateKeyPem = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();

    vi.stubEnv('GA4_PROPERTY_ID', '123456');
    vi.stubEnv('GA4_SERVICE_ACCOUNT_EMAIL', 'ga4-test@example.iam.gserviceaccount.com');
    vi.stubEnv('GA4_SERVICE_ACCOUNT_PRIVATE_KEY', privateKeyPem);

    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: 'token' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ rows: [{ metricValues: [{ value: '11' }, { value: '21' }, { value: '31' }] }] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ rows: [{ metricValues: [{ value: '51' }, { value: '81' }, { value: '121' }] }] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ rows: [{ dimensionValues: [{ value: '/blog/test' }, { value: 'Article' }], metricValues: [{ value: '9' }, { value: '5' }] }] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ rows: [{ dimensionValues: [{ value: 'dashboard_page_view' }], metricValues: [{ value: '8' }] }] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ rows: [{ dimensionValues: [{ value: 'dashboard_page_view' }], metricValues: [{ value: '20' }] }] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ rows: [{ dimensionValues: [{ value: 'dashboard' }, { value: '/coproprietes' }], metricValues: [{ value: '12' }] }] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ rows: [{ dimensionValues: [{ value: 'granted' }], metricValues: [{ value: '7' }] }] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ rows: [{ dimensionValues: [{ value: 'desktop' }], metricValues: [{ value: '6' }] }] }) });

    vi.stubGlobal('fetch', fetchMock);

    const { getGa4AdminAnalytics } = await import('../ga4-admin');
    const result = await getGa4AdminAnalytics();

    expect(result.last7d).toEqual({ activeUsers: 11, sessions: 21, pageViews: 31 });
    expect(result.businessEvents30d.dashboard_page_view).toBe(20);
    expect(result.internalPlatformPages).toEqual([
      { area: 'dashboard', path: '/coproprietes', views: 12 },
    ]);

    const reportBodies = fetchMock.mock.calls
      .map(([, options]) => {
        const body = options && typeof options === 'object' && 'body' in options ? options.body : undefined;
        if (typeof body !== 'string') return null;
        try {
          return JSON.parse(body) as Record<string, unknown>;
        } catch {
          return null;
        }
      })
      .filter(Boolean) as Array<Record<string, unknown>>;

    expect(reportBodies).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          dimensionFilter: {
            filter: {
              fieldName: 'eventName',
              inListFilter: { values: ['dashboard_page_view'] },
            },
          },
        }),
      ]),
    );
  });
});