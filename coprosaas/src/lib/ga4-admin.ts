import 'server-only';
import { createPrivateKey, createSign } from 'node:crypto';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GA4_SCOPE = 'https://www.googleapis.com/auth/analytics.readonly';
const CUSTOM_EVENT_NAMES = [
  'sign_up',
  'login',
  'begin_checkout',
  'purchase',
  'onboarding_complete',
  'dashboard_page_view',
  'view_article',
  'click_cta',
  'form_abandonment',
  'registration_error',
  'login_error',
  'password_reset_requested',
  'password_reset_error',
  'sign_up_anonymous',
  'login_anonymous',
] as const;

type Ga4MetricRow = {
  dimensionValues?: Array<{ value?: string }>;
  metricValues?: Array<{ value?: string }>;
};

type Ga4RunReportResponse = {
  rows?: Ga4MetricRow[];
  error?: { message?: string };
};

type BreakdownItem = {
  label: string;
  value: number;
};

export type Ga4AdminAnalytics = {
  configured: boolean;
  propertyId: string | null;
  fetchedAt: string;
  missingVars: string[];
  error: string | null;
  last7d: {
    activeUsers: number;
    sessions: number;
    pageViews: number;
  };
  last30d: {
    activeUsers: number;
    sessions: number;
    pageViews: number;
  };
  businessEvents: Record<string, number>;
  topPages: Array<{
    path: string;
    title: string;
    views: number;
    users: number;
  }>;
  topEvents: Array<{
    name: string;
    count: number;
  }>;
  measurementModes: BreakdownItem[];
  consentStates: BreakdownItem[];
  notes: string[];
};

function formatPrivateKey(privateKey: string | undefined) {
  return (privateKey ?? '').replace(/\\n/g, '\n').trim();
}

function getConfig() {
  const propertyId = (
    process.env.GA4_PROPERTY_ID ??
    process.env.GOOGLE_ANALYTICS_PROPERTY_ID ??
    ''
  ).trim();

  const clientEmail = (
    process.env.GA4_SERVICE_ACCOUNT_EMAIL ??
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ??
    process.env.GOOGLE_CLIENT_EMAIL ??
    ''
  ).trim();

  const privateKey = formatPrivateKey(
    process.env.GA4_SERVICE_ACCOUNT_PRIVATE_KEY ??
      process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ??
      process.env.GOOGLE_PRIVATE_KEY,
  );

  const missingVars = [
    !propertyId ? 'GA4_PROPERTY_ID' : null,
    !clientEmail ? 'GA4_SERVICE_ACCOUNT_EMAIL' : null,
    !privateKey ? 'GA4_SERVICE_ACCOUNT_PRIVATE_KEY' : null,
  ].filter(Boolean) as string[];

  return {
    propertyId,
    clientEmail,
    privateKey,
    configured: missingVars.length === 0,
    missingVars,
  };
}

function base64UrlEncode(value: string) {
  return Buffer.from(value).toString('base64url');
}

function createSignedJwt(clientEmail: string, privateKey: string) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claimSet = {
    iss: clientEmail,
    scope: GA4_SCOPE,
    aud: GOOGLE_TOKEN_URL,
    exp: now + 3600,
    iat: now,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedClaimSet = base64UrlEncode(JSON.stringify(claimSet));
  const unsignedToken = `${encodedHeader}.${encodedClaimSet}`;

  const signer = createSign('RSA-SHA256');
  signer.update(unsignedToken);
  signer.end();

  const signature = signer.sign(createPrivateKey(privateKey)).toString('base64url');
  return `${unsignedToken}.${signature}`;
}

async function getAccessToken(clientEmail: string, privateKey: string) {
  const assertion = createSignedJwt(clientEmail, privateKey);
  const body = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion,
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    cache: 'no-store',
  });

  const payload = (await response.json()) as { access_token?: string; error_description?: string };

  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error_description ?? 'Impossible d’obtenir un token Google Analytics.');
  }

  return payload.access_token;
}

async function runReport(
  accessToken: string,
  propertyId: string,
  body: Record<string, unknown>,
): Promise<Ga4RunReportResponse> {
  const response = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  const payload = (await response.json()) as Ga4RunReportResponse;

  if (!response.ok) {
    throw new Error(payload.error?.message ?? 'Erreur lors de la lecture du rapport GA4.');
  }

  return payload;
}

function toNumber(value: string | undefined) {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

function firstMetricRow(report: Ga4RunReportResponse) {
  return report.rows?.[0];
}

function parseOverview(report: Ga4RunReportResponse) {
  const row = firstMetricRow(report);

  return {
    activeUsers: toNumber(row?.metricValues?.[0]?.value),
    sessions: toNumber(row?.metricValues?.[1]?.value),
    pageViews: toNumber(row?.metricValues?.[2]?.value),
  };
}

function parseTopPages(report: Ga4RunReportResponse) {
  return (report.rows ?? []).map((row) => ({
    path: row.dimensionValues?.[0]?.value || '/',
    title: row.dimensionValues?.[1]?.value || 'Sans titre',
    views: toNumber(row.metricValues?.[0]?.value),
    users: toNumber(row.metricValues?.[1]?.value),
  }));
}

function parseTopEvents(report: Ga4RunReportResponse) {
  return (report.rows ?? []).map((row) => ({
    name: row.dimensionValues?.[0]?.value || 'unknown_event',
    count: toNumber(row.metricValues?.[0]?.value),
  }));
}

function parseBreakdown(report: Ga4RunReportResponse) {
  return (report.rows ?? [])
    .map((row) => ({
      label: row.dimensionValues?.[0]?.value || 'non renseigné',
      value: toNumber(row.metricValues?.[0]?.value),
    }))
    .filter((item) => item.value > 0);
}

export async function getGa4AdminAnalytics(): Promise<Ga4AdminAnalytics> {
  const config = getConfig();
  const emptyState: Ga4AdminAnalytics = {
    configured: config.configured,
    propertyId: config.propertyId || null,
    fetchedAt: new Date().toISOString(),
    missingVars: config.missingVars,
    error: null,
    last7d: { activeUsers: 0, sessions: 0, pageViews: 0 },
    last30d: { activeUsers: 0, sessions: 0, pageViews: 0 },
    businessEvents: {},
    topPages: [],
    topEvents: [],
    measurementModes: [],
    consentStates: [],
    notes: [
      'Les chiffres GA4 peuvent avoir un léger délai de traitement.',
      'Les répartitions par consentement nécessitent les dimensions personnalisées GA4 correspondantes.',
    ],
  };

  if (!config.configured) {
    return {
      ...emptyState,
      notes: [
        ...emptyState.notes,
        'Ajoute les variables d’environnement GA4 pour activer cette vue.',
      ],
    };
  }

  try {
    const accessToken = await getAccessToken(config.clientEmail, config.privateKey);

    const eventFilter = {
      filter: {
        fieldName: 'eventName',
        inListFilter: { values: [...CUSTOM_EVENT_NAMES] },
      },
    };

    const pageViewFilter = {
      filter: {
        fieldName: 'eventName',
        stringFilter: { matchType: 'EXACT', value: 'page_view' },
      },
    };

    const [overview7, overview30, topPagesReport, topEventsReport, measurementModeReport, consentStateReport] =
      await Promise.all([
        runReport(accessToken, config.propertyId, {
          dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
          metrics: [{ name: 'activeUsers' }, { name: 'sessions' }, { name: 'screenPageViews' }],
        }),
        runReport(accessToken, config.propertyId, {
          dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
          metrics: [{ name: 'activeUsers' }, { name: 'sessions' }, { name: 'screenPageViews' }],
        }),
        runReport(accessToken, config.propertyId, {
          dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
          dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
          metrics: [{ name: 'screenPageViews' }, { name: 'activeUsers' }],
          orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
          limit: '8',
        }),
        runReport(accessToken, config.propertyId, {
          dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
          dimensions: [{ name: 'eventName' }],
          metrics: [{ name: 'eventCount' }],
          dimensionFilter: eventFilter,
          orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
          limit: '12',
        }),
        runReport(accessToken, config.propertyId, {
          dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
          dimensions: [{ name: 'customEvent:measurement_mode' }],
          metrics: [{ name: 'eventCount' }],
          dimensionFilter: pageViewFilter,
          orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
          limit: '10',
        }).catch(() => ({ rows: [] })),
        runReport(accessToken, config.propertyId, {
          dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
          dimensions: [{ name: 'customEvent:consent_state' }],
          metrics: [{ name: 'eventCount' }],
          dimensionFilter: pageViewFilter,
          orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
          limit: '10',
        }).catch(() => ({ rows: [] })),
      ]);

    const topEvents = parseTopEvents(topEventsReport);
    const businessEvents = Object.fromEntries(topEvents.map((item) => [item.name, item.count]));

    return {
      ...emptyState,
      configured: true,
      propertyId: config.propertyId,
      fetchedAt: new Date().toISOString(),
      last7d: parseOverview(overview7),
      last30d: parseOverview(overview30),
      businessEvents,
      topPages: parseTopPages(topPagesReport),
      topEvents,
      measurementModes: parseBreakdown(measurementModeReport),
      consentStates: parseBreakdown(consentStateReport),
    };
  } catch (error) {
    return {
      ...emptyState,
      configured: true,
      error: error instanceof Error ? error.message : 'Erreur inconnue côté GA4.',
    };
  }
}
