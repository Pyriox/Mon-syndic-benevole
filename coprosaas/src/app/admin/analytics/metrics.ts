import { ADMIN_EMAIL } from '@/lib/admin-config';
import type { Ga4AdminAnalytics } from '@/lib/ga4-admin';

export type UserEventRow = {
  event_type: string;
  created_at: string | null;
  user_email: string | null;
  user_id: string | null;
};

export type CoproActivityRow = {
  created_at: string | null;
  syndic_id: string | null;
};

export type ProfileActivityRow = {
  id: string;
  full_name: string | null;
  last_active_at: string | null;
};

export type AdminRow = {
  user_id: string;
};

export type SourceMetric = {
  label: string;
  value7d: number | null;
  value30d: number | null;
  source: string;
};

export type TrendValue = {
  current: number;
  prev: number;
  /** +/- percentage points, null if prev is 0 */
  pct: number | null;
};

export type AdminAnalyticsMetrics = {
  gaMetrics: SourceMetric[];
  internalMetrics: SourceMetric[];
  stripeMetrics: SourceMetric[];
  gaSignUps7d: number;
  gaSignUps30d: number;
  gaLogins7d: number;
  gaLogins30d: number;
  gaCheckouts7d: number;
  gaCheckouts30d: number;
  gaPurchases7d: number;
  gaPurchases30d: number;
  gaOnboarding7d: number;
  gaOnboarding30d: number;
  dashboardPageViews7d: number;
  dashboardPageViews30d: number;
  internalActive24h: number;
  internalActive7d: number;
  internalActive30d: number;
  internalRegistrations24h: number;
  internalRegistrations7d: number;
  internalRegistrations30d: number;
  internalLoginForms24h: number;
  internalLoginForms7d: number;
  internalLoginForms30d: number;
  internalCheckouts24h: number;
  internalCheckouts7d: number;
  internalCheckouts30d: number;
  internalOnboarding24h: number;
  internalOnboarding7d: number;
  internalOnboarding30d: number;
  stripeTrials24h: number;
  stripeTrials7d: number;
  stripeTrials30d: number;
  stripeSubscriptions24h: number;
  stripeSubscriptions7d: number;
  stripeSubscriptions30d: number;
  /** internalActive30d from a COUNT(*) query — no .limit() truncation */
  internalActiveTotalCount: number;
  /** Trends: current 7d vs previous 7d (j-14 to j-7) */
  trendActive: TrendValue;
  trendRegistrations: TrendValue;
  trendOnboarding: TrendValue;
  trendTrials: TrendValue;
  trendSubscriptions: TrendValue;
  /** Funnel conversion rates (7d) */
  conversionCheckoutToTrial7d: number | null;
};

function countSinceDateValues(values: Array<string | null | undefined>, sinceMs: number) {
  return values.reduce((sum, value) => {
    const parsed = value ? Date.parse(value) : Number.NaN;
    return Number.isFinite(parsed) && parsed >= sinceMs ? sum + 1 : sum;
  }, 0);
}

function countBetweenDates(values: Array<string | null | undefined>, fromMs: number, toMs: number) {
  return values.reduce((sum, value) => {
    const parsed = value ? Date.parse(value) : Number.NaN;
    return Number.isFinite(parsed) && parsed >= fromMs && parsed < toMs ? sum + 1 : sum;
  }, 0);
}

function makeTrend(current: number, prev: number): TrendValue {
  return {
    current,
    prev,
    pct: prev > 0 ? Math.round(((current - prev) / prev) * 100) : null,
  };
}

function isLegacyAdminEmail(email: string | null | undefined) {
  return (email ?? '').trim().toLowerCase() === ADMIN_EMAIL;
}

export function buildAdminAnalyticsMetrics({
  analytics,
  recentUserEvents,
  recentCopros,
  recentProfiles,
  adminRows,
  activeUsersCount,
  nowMs,
}: {
  analytics: Ga4AdminAnalytics;
  recentUserEvents: UserEventRow[];
  recentCopros: CoproActivityRow[];
  recentProfiles: ProfileActivityRow[];
  adminRows: AdminRow[];
  /** COUNT(*) of non-admin profiles active in the last 30d — avoids .limit() truncation */
  activeUsersCount: number;
  nowMs: number;
}): AdminAnalyticsMetrics {
  const last24hMs = nowMs - 24 * 60 * 60 * 1000;
  const last7dMs = nowMs - 7 * 24 * 60 * 60 * 1000;
  const last14dMs = nowMs - 14 * 24 * 60 * 60 * 1000;
  const adminUserIds = new Set(adminRows.map((row) => row.user_id));

  const filteredUserEvents = recentUserEvents.filter((event) => {
    if (event.user_id && adminUserIds.has(event.user_id)) return false;
    if (!event.user_id && isLegacyAdminEmail(event.user_email)) return false;
    return true;
  });

  const filteredCopros = recentCopros.filter((copro) => (
    !copro.syndic_id || !adminUserIds.has(copro.syndic_id)
  ));

  const activeProfiles = recentProfiles.filter((profile) => (
    !adminUserIds.has(profile.id) && !!profile.last_active_at
  ));

  const gaSignUps7d =
    (analytics.businessEvents7d.sign_up ?? 0) +
    (analytics.businessEvents7d.sign_up_anonymous ?? 0);
  const gaSignUps30d =
    (analytics.businessEvents30d.sign_up ?? 0) +
    (analytics.businessEvents30d.sign_up_anonymous ?? 0);
  const gaLogins7d =
    (analytics.businessEvents7d.login ?? 0) +
    (analytics.businessEvents7d.login_anonymous ?? 0);
  const gaLogins30d =
    (analytics.businessEvents30d.login ?? 0) +
    (analytics.businessEvents30d.login_anonymous ?? 0);
  const gaCheckouts7d = analytics.businessEvents7d.begin_checkout ?? 0;
  const gaCheckouts30d = analytics.businessEvents30d.begin_checkout ?? 0;
  const gaPurchases7d = analytics.businessEvents7d.purchase ?? 0;
  const gaPurchases30d = analytics.businessEvents30d.purchase ?? 0;
  const gaOnboarding7d = analytics.businessEvents7d.onboarding_complete ?? 0;
  const gaOnboarding30d = analytics.businessEvents30d.onboarding_complete ?? 0;
  const dashboardPageViews7d = analytics.businessEvents7d.dashboard_page_view ?? 0;
  const dashboardPageViews30d = analytics.businessEvents30d.dashboard_page_view ?? 0;

  const registrationEvents = filteredUserEvents.filter((event) => event.event_type === 'user_registered');
  const checkoutEvents = filteredUserEvents.filter((event) => event.event_type === 'begin_checkout');
  const loginEvents = filteredUserEvents.filter((event) => event.event_type === 'login_success');
  const trialEvents = filteredUserEvents.filter((event) => event.event_type === 'trial_started');
  const subscriptionEvents = filteredUserEvents.filter((event) => event.event_type === 'subscription_created');

  const internalActive30d = activeProfiles.length;
  const internalActive7d = countSinceDateValues(activeProfiles.map((profile) => profile.last_active_at), last7dMs);
  const internalActive24h = countSinceDateValues(activeProfiles.map((profile) => profile.last_active_at), last24hMs);
  const internalActivePrev7d = countBetweenDates(activeProfiles.map((profile) => profile.last_active_at), last14dMs, last7dMs);
  const internalRegistrations30d = registrationEvents.length;
  const internalRegistrations7d = countSinceDateValues(registrationEvents.map((event) => event.created_at), last7dMs);
  const internalRegistrations24h = countSinceDateValues(registrationEvents.map((event) => event.created_at), last24hMs);
  const internalRegistrationsPrev7d = countBetweenDates(registrationEvents.map((event) => event.created_at), last14dMs, last7dMs);
  const internalLoginForms30d = loginEvents.length;
  const internalLoginForms7d = countSinceDateValues(loginEvents.map((event) => event.created_at), last7dMs);
  const internalLoginForms24h = countSinceDateValues(loginEvents.map((event) => event.created_at), last24hMs);
  const internalCheckouts30d = checkoutEvents.length;
  const internalCheckouts7d = countSinceDateValues(checkoutEvents.map((event) => event.created_at), last7dMs);
  const internalCheckouts24h = countSinceDateValues(checkoutEvents.map((event) => event.created_at), last24hMs);
  const internalOnboarding30d = filteredCopros.length;
  const internalOnboarding7d = countSinceDateValues(filteredCopros.map((row) => row.created_at), last7dMs);
  const internalOnboarding24h = countSinceDateValues(filteredCopros.map((row) => row.created_at), last24hMs);
  const internalOnboardingPrev7d = countBetweenDates(filteredCopros.map((row) => row.created_at), last14dMs, last7dMs);
  const stripeTrials30d = trialEvents.length;
  const stripeTrials7d = countSinceDateValues(trialEvents.map((event) => event.created_at), last7dMs);
  const stripeTrials24h = countSinceDateValues(trialEvents.map((event) => event.created_at), last24hMs);
  const stripeTrialsPrev7d = countBetweenDates(trialEvents.map((event) => event.created_at), last14dMs, last7dMs);
  const stripeSubscriptions30d = subscriptionEvents.length;
  const stripeSubscriptions7d = countSinceDateValues(subscriptionEvents.map((event) => event.created_at), last7dMs);
  const stripeSubscriptions24h = countSinceDateValues(subscriptionEvents.map((event) => event.created_at), last24hMs);
  const stripeSubscriptionsPrev7d = countBetweenDates(subscriptionEvents.map((event) => event.created_at), last14dMs, last7dMs);
  const trendActive = makeTrend(internalActive7d, internalActivePrev7d);
  const trendRegistrations = makeTrend(internalRegistrations7d, internalRegistrationsPrev7d);
  const trendOnboarding = makeTrend(internalOnboarding7d, internalOnboardingPrev7d);
  const trendTrials = makeTrend(stripeTrials7d, stripeTrialsPrev7d);
  const trendSubscriptions = makeTrend(stripeSubscriptions7d, stripeSubscriptionsPrev7d);

  const conversionCheckoutToTrial7d = internalCheckouts7d > 0
    ? Math.round((stripeTrials7d / internalCheckouts7d) * 100)
    : null;

  const gaMetrics: SourceMetric[] = [
    { label: 'Inscriptions GA4', value7d: gaSignUps7d, value30d: gaSignUps30d, source: 'GA4 sign_up / sign_up_anonymous' },
    { label: 'Connexions GA4', value7d: gaLogins7d, value30d: gaLogins30d, source: 'GA4 login / login_anonymous' },
    { label: 'Checkouts GA4', value7d: gaCheckouts7d, value30d: gaCheckouts30d, source: 'GA4 begin_checkout' },
    { label: 'Purchases GA4', value7d: gaPurchases7d, value30d: gaPurchases30d, source: 'GA4 purchase' },
    { label: 'Onboarding GA4', value7d: gaOnboarding7d, value30d: gaOnboarding30d, source: 'GA4 onboarding_complete' },
    { label: 'Pages dashboard GA4', value7d: dashboardPageViews7d, value30d: dashboardPageViews30d, source: 'GA4 dashboard_page_view' },
  ];

  const internalMetrics: SourceMetric[] = [
    { label: 'Utilisateurs actifs internes', value7d: internalActive7d, value30d: internalActive30d, source: 'profiles.last_active_at hors admins' },
    { label: 'Inscriptions internes', value7d: internalRegistrations7d, value30d: internalRegistrations30d, source: 'user_events.user_registered' },
    { label: 'Connexions formulaire', value7d: internalLoginForms7d, value30d: internalLoginForms30d, source: 'user_events.login_success' },
    { label: 'Checkouts applicatifs', value7d: internalCheckouts7d, value30d: internalCheckouts30d, source: 'user_events.begin_checkout' },
    { label: 'Copros créées', value7d: internalOnboarding7d, value30d: internalOnboarding30d, source: 'coproprietes.created_at hors admins' },
  ];

  const stripeMetrics: SourceMetric[] = [
    { label: 'Essais démarrés', value7d: stripeTrials7d, value30d: stripeTrials30d, source: 'Webhook Stripe trial_started' },
    { label: 'Abonnements activés', value7d: stripeSubscriptions7d, value30d: stripeSubscriptions30d, source: 'Webhook Stripe subscription_created' },
  ];

  return {
    gaMetrics,
    internalMetrics,
    stripeMetrics,
    gaSignUps7d,
    gaSignUps30d,
    gaLogins7d,
    gaLogins30d,
    gaCheckouts7d,
    gaCheckouts30d,
    gaPurchases7d,
    gaPurchases30d,
    gaOnboarding7d,
    gaOnboarding30d,
    dashboardPageViews7d,
    dashboardPageViews30d,
    internalActive24h,
    internalActive7d,
    internalActive30d,
    internalRegistrations24h,
    internalRegistrations7d,
    internalRegistrations30d,
    internalLoginForms24h,
    internalLoginForms7d,
    internalLoginForms30d,
    internalCheckouts24h,
    internalCheckouts7d,
    internalCheckouts30d,
    internalOnboarding24h,
    internalOnboarding7d,
    internalOnboarding30d,
    stripeTrials24h,
    stripeTrials7d,
    stripeTrials30d,
    stripeSubscriptions24h,
    stripeSubscriptions7d,
    stripeSubscriptions30d,
    internalActiveTotalCount: activeUsersCount,
    trendActive,
    trendRegistrations,
    trendOnboarding,
    trendTrials,
    trendSubscriptions,
    conversionCheckoutToTrial7d,
  };
}