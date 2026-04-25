import { ADMIN_EMAIL } from '@/lib/admin-config';
import type { Ga4AdminAnalytics } from '@/lib/ga4-admin';

/** Prix mensuel par plan (abonnement annuel / 12). */
const PLAN_MONTHLY_PRICE: Record<string, number> = {
  essentiel: 30,
  confort: 45,
  illimite: 80,
};

// ── Types d'entrée ──────────────────────────────────────────────

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

export type PlanDistributionRow = {
  plan_id: string | null;
};

export type SessionRow = {
  started_at: string | null;
  ended_at: string | null;
};

export type RecentFeedEvent = {
  event_type: string;
  created_at: string | null;
  user_email: string | null;
  user_id: string | null;
  label: string | null;
  severity: string | null;
};

// ── Types de sortie ─────────────────────────────────────────────

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
  // ── Revenue & Billing
  mrrEstimate: number;
  activeSubscriptions: number;
  activeTrials: number;
  trialToPaidRate30d: number | null;
  paymentFailed7d: number;
  paymentFailed30d: number;
  subscriptionCancelled7d: number;
  subscriptionCancelled30d: number;
  trialCancelled7d: number;
  trialCancelled30d: number;

  // ── Acquisition
  internalRegistrations24h: number;
  internalRegistrations7d: number;
  internalRegistrations30d: number;
  internalOnboarding24h: number;
  internalOnboarding7d: number;
  internalOnboarding30d: number;
  internalCheckouts24h: number;
  internalCheckouts7d: number;
  internalCheckouts30d: number;
  stripeTrials24h: number;
  stripeTrials7d: number;
  stripeTrials30d: number;
  stripeSubscriptions24h: number;
  stripeSubscriptions7d: number;
  stripeSubscriptions30d: number;

  // ── Engagement
  internalActive24h: number;
  internalActive7d: number;
  internalActive30d: number;
  internalActiveTotalCount: number;
  sessionsTotal7d: number;
  avgSessionDurationMinutes: number | null;

  // ── GA4 web
  gaWebUsers7d: number;
  gaWebUsers30d: number;
  gaWebSessions7d: number;
  gaWebPageViews7d: number;
  gaSignUps7d: number;
  gaSignUps30d: number;
  dashboardPageViews7d: number;
  dashboardPageViews30d: number;

  // ── Funnel conversion rates
  conversionCheckoutToTrial7d: number | null;
  conversionTrialToPaid30d: number | null;
  conversionSignupToOnboarding7d: number | null;
  conversionOnboardingToTrial7d: number | null;

  // ── Trends (7j actuel vs 7j precedents)
  trendActive: TrendValue;
  trendRegistrations: TrendValue;
  trendOnboarding: TrendValue;
  trendTrials: TrendValue;
  trendSubscriptions: TrendValue;

  // ── Retention & friction
  churnRate30d: number | null;
  blockedAtOnboarding30d: number;
  sessionsCompletedPct: number | null;

  // ── Feed activite
  recentFeedEvents: RecentFeedEvent[];

  // ── Diagnostics bruts
  gaMetrics: SourceMetric[];
  internalMetrics: SourceMetric[];
  stripeMetrics: SourceMetric[];
};

// ── Helpers ─────────────────────────────────────────────────────

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

// ── Fonction principale ─────────────────────────────────────────

export function buildAdminAnalyticsMetrics({
  analytics,
  recentUserEvents,
  billingAlertEvents,
  recentCopros,
  recentProfiles,
  adminRows,
  activeUsersCount,
  activePlanRows,
  activeTrialsCount,
  sessionRows,
  recentFeedEvents,
  nowMs,
}: {
  analytics: Ga4AdminAnalytics;
  recentUserEvents: UserEventRow[];
  billingAlertEvents: UserEventRow[];
  recentCopros: CoproActivityRow[];
  recentProfiles: ProfileActivityRow[];
  adminRows: AdminRow[];
  activeUsersCount: number;
  activePlanRows: PlanDistributionRow[];
  activeTrialsCount: number;
  sessionRows: SessionRow[];
  recentFeedEvents: RecentFeedEvent[];
  nowMs: number;
}): AdminAnalyticsMetrics {
  const last24hMs = nowMs - 24 * 60 * 60 * 1000;
  const last7dMs = nowMs - 7 * 24 * 60 * 60 * 1000;
  const last14dMs = nowMs - 14 * 24 * 60 * 60 * 1000;
  const adminUserIds = new Set(adminRows.map((row) => row.user_id));

  const filterAdmins = <T extends { user_id: string | null; user_email: string | null }>(rows: T[]) =>
    rows.filter((row) => {
      if (row.user_id && adminUserIds.has(row.user_id)) return false;
      if (!row.user_id && isLegacyAdminEmail(row.user_email)) return false;
      return true;
    });

  const filteredUserEvents = filterAdmins(recentUserEvents);
  const filteredBillingAlerts = filterAdmins(billingAlertEvents);
  const filteredFeedEvents = filterAdmins(recentFeedEvents);
  const filteredCopros = recentCopros.filter((copro) => !copro.syndic_id || !adminUserIds.has(copro.syndic_id));
  const activeProfiles = recentProfiles.filter((profile) => !adminUserIds.has(profile.id) && !!profile.last_active_at);

  // Revenue
  const mrrEstimate = activePlanRows.reduce((sum, row) => {
    const price = PLAN_MONTHLY_PRICE[row.plan_id ?? ''] ?? PLAN_MONTHLY_PRICE.essentiel;
    return sum + price;
  }, 0);
  const activeSubscriptions = activePlanRows.length;
  const activeTrials = activeTrialsCount;

  // Alertes billing
  const paymentFailedEvents = filteredBillingAlerts.filter((e) => e.event_type === 'payment_failed');
  const cancelledEvents = filteredBillingAlerts.filter((e) => e.event_type === 'subscription_cancelled');
  const trialCancelledEvents = filteredBillingAlerts.filter((e) => e.event_type === 'trial_cancelled');
  const paymentFailed7d = countSinceDateValues(paymentFailedEvents.map((e) => e.created_at), last7dMs);
  const paymentFailed30d = paymentFailedEvents.length;
  const subscriptionCancelled7d = countSinceDateValues(cancelledEvents.map((e) => e.created_at), last7dMs);
  const subscriptionCancelled30d = cancelledEvents.length;
  const trialCancelled7d = countSinceDateValues(trialCancelledEvents.map((e) => e.created_at), last7dMs);
  const trialCancelled30d = trialCancelledEvents.length;

  // Acquisition
  const registrationEvents = filteredUserEvents.filter((e) => e.event_type === 'user_registered');
  const checkoutEvents = filteredUserEvents.filter((e) => e.event_type === 'begin_checkout');
  const trialEvents = filteredUserEvents.filter((e) => e.event_type === 'trial_started');
  const subscriptionEvents = filteredUserEvents.filter((e) => e.event_type === 'subscription_created');

  const internalRegistrations30d = registrationEvents.length;
  const internalRegistrations7d = countSinceDateValues(registrationEvents.map((e) => e.created_at), last7dMs);
  const internalRegistrations24h = countSinceDateValues(registrationEvents.map((e) => e.created_at), last24hMs);
  const internalRegistrationsPrev7d = countBetweenDates(registrationEvents.map((e) => e.created_at), last14dMs, last7dMs);

  const internalCheckouts30d = checkoutEvents.length;
  const internalCheckouts7d = countSinceDateValues(checkoutEvents.map((e) => e.created_at), last7dMs);
  const internalCheckouts24h = countSinceDateValues(checkoutEvents.map((e) => e.created_at), last24hMs);

  const internalOnboarding30d = filteredCopros.length;
  const internalOnboarding7d = countSinceDateValues(filteredCopros.map((row) => row.created_at), last7dMs);
  const internalOnboarding24h = countSinceDateValues(filteredCopros.map((row) => row.created_at), last24hMs);
  const internalOnboardingPrev7d = countBetweenDates(filteredCopros.map((row) => row.created_at), last14dMs, last7dMs);

  const stripeTrials30d = trialEvents.length;
  const stripeTrials7d = countSinceDateValues(trialEvents.map((e) => e.created_at), last7dMs);
  const stripeTrials24h = countSinceDateValues(trialEvents.map((e) => e.created_at), last24hMs);
  const stripeTrialsPrev7d = countBetweenDates(trialEvents.map((e) => e.created_at), last14dMs, last7dMs);

  const stripeSubscriptions30d = subscriptionEvents.length;
  const stripeSubscriptions7d = countSinceDateValues(subscriptionEvents.map((e) => e.created_at), last7dMs);
  const stripeSubscriptions24h = countSinceDateValues(subscriptionEvents.map((e) => e.created_at), last24hMs);
  const stripeSubscriptionsPrev7d = countBetweenDates(subscriptionEvents.map((e) => e.created_at), last14dMs, last7dMs);

  // Engagement
  const internalActive30d = activeUsersCount; // use the server-side COUNT query (full 30d window)
  const internalActive7d = countSinceDateValues(activeProfiles.map((p) => p.last_active_at), last7dMs);
  const internalActive24h = countSinceDateValues(activeProfiles.map((p) => p.last_active_at), last24hMs);
  const internalActivePrev7d = countBetweenDates(activeProfiles.map((p) => p.last_active_at), last14dMs, last7dMs);

  const sessionsTotal7d = sessionRows.length;
  const completedSessions = sessionRows.filter((s) => s.started_at && s.ended_at);
  const avgSessionDurationMinutes = completedSessions.length > 0
    ? Math.round(
        completedSessions.reduce((sum, s) => {
          const dur = (Date.parse(s.ended_at!) - Date.parse(s.started_at!)) / 60_000;
          return sum + (Number.isFinite(dur) && dur > 0 ? dur : 0);
        }, 0) / completedSessions.length,
      )
    : null;

  // GA4
  const gaSignUps7d = (analytics.businessEvents7d.sign_up ?? 0) + (analytics.businessEvents7d.sign_up_anonymous ?? 0);
  const gaSignUps30d = (analytics.businessEvents30d.sign_up ?? 0) + (analytics.businessEvents30d.sign_up_anonymous ?? 0);
  const dashboardPageViews7d = analytics.businessEvents7d.dashboard_page_view ?? 0;
  const dashboardPageViews30d = analytics.businessEvents30d.dashboard_page_view ?? 0;
  const gaLogins7d = (analytics.businessEvents7d.login ?? 0) + (analytics.businessEvents7d.login_anonymous ?? 0);
  const gaLogins30d = (analytics.businessEvents30d.login ?? 0) + (analytics.businessEvents30d.login_anonymous ?? 0);
  const gaCheckouts7d = analytics.businessEvents7d.begin_checkout ?? 0;
  const gaCheckouts30d = analytics.businessEvents30d.begin_checkout ?? 0;
  const gaPurchases7d = analytics.businessEvents7d.purchase ?? 0;
  const gaPurchases30d = analytics.businessEvents30d.purchase ?? 0;
  const gaOnboarding7d = analytics.businessEvents7d.onboarding_complete ?? 0;
  const gaOnboarding30d = analytics.businessEvents30d.onboarding_complete ?? 0;

  // Funnel
  const trialToPaidRate30d = stripeTrials30d > 0 ? Math.round((stripeSubscriptions30d / stripeTrials30d) * 100) : null;
  const conversionCheckoutToTrial7d = internalCheckouts7d > 0 ? Math.round((stripeTrials7d / internalCheckouts7d) * 100) : null;
  const conversionTrialToPaid30d = trialToPaidRate30d;
  const conversionSignupToOnboarding7d = internalRegistrations7d > 0 ? Math.round((internalOnboarding7d / internalRegistrations7d) * 100) : null;
  const conversionOnboardingToTrial7d = internalOnboarding7d > 0 ? Math.round((stripeTrials7d / internalOnboarding7d) * 100) : null;

  // Retention & friction
  // Dénominateur = stock début de période = actifs maintenant + ceux qui ont résilié sur 30j
  const churnBase30d = activeSubscriptions + subscriptionCancelled30d;
  const churnRate30d = churnBase30d > 0
    ? Math.round((subscriptionCancelled30d / churnBase30d) * 100)
    : null;
  // Approximation : inscrits sans copro créée sur la période (1 inscription = 1 copro attendue)
  const blockedAtOnboarding30d = Math.max(0, internalRegistrations30d - internalOnboarding30d);
  const sessionsCompletedPct = sessionsTotal7d > 0
    ? Math.round((completedSessions.length / sessionsTotal7d) * 100)
    : null;

  // Trends
  const trendActive = makeTrend(internalActive7d, internalActivePrev7d);
  const trendRegistrations = makeTrend(internalRegistrations7d, internalRegistrationsPrev7d);
  const trendOnboarding = makeTrend(internalOnboarding7d, internalOnboardingPrev7d);
  const trendTrials = makeTrend(stripeTrials7d, stripeTrialsPrev7d);
  const trendSubscriptions = makeTrend(stripeSubscriptions7d, stripeSubscriptionsPrev7d);

  // Diagnostics
  const gaMetrics: SourceMetric[] = [
    { label: 'Inscriptions', value7d: gaSignUps7d, value30d: gaSignUps30d, source: 'GA4 sign_up / sign_up_anonymous' },
    { label: 'Connexions', value7d: gaLogins7d, value30d: gaLogins30d, source: 'GA4 login / login_anonymous' },
    { label: 'Checkouts', value7d: gaCheckouts7d, value30d: gaCheckouts30d, source: 'GA4 begin_checkout' },
    { label: 'Purchases', value7d: gaPurchases7d, value30d: gaPurchases30d, source: 'GA4 purchase' },
    { label: 'Onboarding', value7d: gaOnboarding7d, value30d: gaOnboarding30d, source: 'GA4 onboarding_complete' },
    { label: 'Pages dashboard', value7d: dashboardPageViews7d, value30d: dashboardPageViews30d, source: 'GA4 dashboard_page_view' },
  ];

  const internalMetrics: SourceMetric[] = [
    { label: 'Utilisateurs actifs', value7d: internalActive7d, value30d: internalActive30d, source: 'profiles.last_active_at hors admins' },
    { label: 'Inscriptions', value7d: internalRegistrations7d, value30d: internalRegistrations30d, source: 'user_events.user_registered' },
    { label: 'Checkouts', value7d: internalCheckouts7d, value30d: internalCheckouts30d, source: 'user_events.begin_checkout' },
    { label: 'Copros creees', value7d: internalOnboarding7d, value30d: internalOnboarding30d, source: 'coproprietes.created_at hors admins' },
    { label: 'Paiements echoues', value7d: paymentFailed7d, value30d: paymentFailed30d, source: 'user_events.payment_failed' },
    { label: 'Résiliations payants', value7d: subscriptionCancelled7d, value30d: subscriptionCancelled30d, source: 'user_events.subscription_cancelled' },
    { label: 'Essais abandonnés', value7d: trialCancelled7d, value30d: trialCancelled30d, source: 'user_events.trial_cancelled' },
  ];

  const stripeMetrics: SourceMetric[] = [
    { label: 'Essais demarres', value7d: stripeTrials7d, value30d: stripeTrials30d, source: 'Webhook Stripe trial_started' },
    { label: 'Abonnements actives', value7d: stripeSubscriptions7d, value30d: stripeSubscriptions30d, source: 'Webhook Stripe subscription_created' },
  ];

  return {
    mrrEstimate,
    activeSubscriptions,
    activeTrials,
    trialToPaidRate30d,
    paymentFailed7d,
    paymentFailed30d,
    subscriptionCancelled7d,
    subscriptionCancelled30d,
    trialCancelled7d,
    trialCancelled30d,
    internalRegistrations24h,
    internalRegistrations7d,
    internalRegistrations30d,
    internalOnboarding24h,
    internalOnboarding7d,
    internalOnboarding30d,
    internalCheckouts24h,
    internalCheckouts7d,
    internalCheckouts30d,
    stripeTrials24h,
    stripeTrials7d,
    stripeTrials30d,
    stripeSubscriptions24h,
    stripeSubscriptions7d,
    stripeSubscriptions30d,
    internalActive24h,
    internalActive7d,
    internalActive30d,
    internalActiveTotalCount: activeUsersCount,
    sessionsTotal7d,
    avgSessionDurationMinutes,
    gaWebUsers7d: analytics.last7d.activeUsers,
    gaWebUsers30d: analytics.last30d.activeUsers,
    gaWebSessions7d: analytics.last7d.sessions,
    gaWebPageViews7d: analytics.last7d.pageViews,
    gaSignUps7d,
    gaSignUps30d,
    dashboardPageViews7d,
    dashboardPageViews30d,
    conversionCheckoutToTrial7d,
    conversionTrialToPaid30d,
    conversionSignupToOnboarding7d,
    conversionOnboardingToTrial7d,
    trendActive,
    trendRegistrations,
    trendOnboarding,
    trendTrials,
    trendSubscriptions,
    churnRate30d,
    blockedAtOnboarding30d,
    sessionsCompletedPct,
    recentFeedEvents: filteredFeedEvents,
    gaMetrics,
    internalMetrics,
    stripeMetrics,
  };
}