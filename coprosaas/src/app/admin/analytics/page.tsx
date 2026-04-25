export const revalidate = 300;

import type { ElementType } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  Activity,
  AlertTriangle,
  BarChart2,
  BarChart3,
  Building2,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  Percent,
  RefreshCcw,
  ShieldCheck,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  UserMinus,
  UserPlus,
  Users,
} from 'lucide-react';

import { isAdminUser } from '@/lib/admin-config';
import { getGa4AdminAnalytics } from '@/lib/ga4-admin';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import {
  buildAdminAnalyticsMetrics,
  type AdminRow,
  type CoproActivityRow,
  type PlanDistributionRow,
  type ProfileActivityRow,
  type RecentFeedEvent,
  type SessionRow,
  type SourceMetric,
  type TrendValue,
  type UserEventRow,
} from './metrics';
import { RefreshButton } from './RefreshButton';

// ── Utilitaires d'affichage ─────────────────────────────────────

function fmtNumber(value: number) {
  return new Intl.NumberFormat('fr-FR').format(value);
}

function fmtEur(value: number) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency', currency: 'EUR', maximumFractionDigits: 0,
  }).format(value);
}

function fmtDateTime(value: string) {
  return new Date(value).toLocaleString('fr-FR', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris',
  });
}

function relativeTime(iso: string | null): string {
  if (!iso) return '—';
  const diff = Date.now() - Date.parse(iso);
  if (diff < 60_000) return "a l'instant";
  if (diff < 3_600_000) return `il y a ${Math.floor(diff / 60_000)} min`;
  if (diff < 86_400_000) return `il y a ${Math.floor(diff / 3_600_000)} h`;
  if (diff < 7 * 86_400_000) return `il y a ${Math.floor(diff / 86_400_000)} j`;
  return fmtDateTime(iso);
}

function maskEmail(email: string | null): string {
  if (!email) return '—';
  const at = email.indexOf('@');
  if (at < 0) return email.slice(0, 3) + '***';
  const local = email.slice(0, at);
  const domain = email.slice(at);
  const visible = Math.min(2, local.length);
  return `${local.slice(0, visible)}${'*'.repeat(Math.max(2, local.length - visible))}${domain}`;
}

function fmtDuration(minutes: number | null): string {
  if (minutes === null) return '—';
  if (minutes < 1) return '< 1 min';
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

function pct(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

// ── Composants UI ───────────────────────────────────────────────

function TrendBadge({ trend }: { trend: TrendValue }) {
  if (trend.pct === null) {
    return <span className="text-xs text-gray-400">vs 7j prec. : {trend.prev}</span>;
  }
  if (trend.pct === 0) {
    return <span className="text-xs text-gray-400">= 7j prec. ({trend.prev})</span>;
  }
  const up = trend.pct > 0;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${up ? 'text-emerald-600' : 'text-red-500'}`}>
      {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {up ? '+' : ''}{trend.pct}% vs 7j prec. ({trend.prev})
    </span>
  );
}

function StatCard({
  label, value, sub, hint, icon: Icon, tone, trend,
}: {
  label: string; value: string; sub?: string; hint?: React.ReactNode;
  icon: ElementType; tone: string; trend?: TrendValue;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 truncate">{value}</p>
          {sub && <p className="mt-0.5 text-xs font-medium text-gray-600">{sub}</p>}
          {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
          {trend && <div className="mt-1"><TrendBadge trend={trend} /></div>}
        </div>
        <div className={`shrink-0 rounded-xl p-2.5 ${tone}`}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

function AlertCard({
  label, value, detail, level,
}: {
  label: string; value: string; detail?: string;
  level: 'ok' | 'warn' | 'error';
}) {
  const styles = {
    ok:    { card: 'border-emerald-200 bg-emerald-50', title: 'text-emerald-800', val: 'text-emerald-700', icon: <CheckCircle2 size={18} className="text-emerald-500 shrink-0" /> },
    warn:  { card: 'border-amber-200  bg-amber-50',   title: 'text-amber-800',   val: 'text-amber-700',   icon: <AlertTriangle size={18} className="text-amber-500 shrink-0" /> },
    error: { card: 'border-red-200    bg-red-50',     title: 'text-red-800',     val: 'text-red-700',     icon: <AlertTriangle size={18} className="text-red-500 shrink-0" /> },
  }[level];
  return (
    <div className={`rounded-2xl border p-4 ${styles.card}`}>
      <div className="flex items-start gap-3">
        {styles.icon}
        <div>
          <p className={`text-xs font-semibold uppercase tracking-wide ${styles.title}`}>{label}</p>
          <p className={`mt-1 text-2xl font-bold ${styles.val}`}>{value}</p>
          {detail && <p className={`mt-0.5 text-xs ${styles.title} opacity-75`}>{detail}</p>}
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle }: { icon: ElementType; title: string; subtitle?: string }) {
  return (
    <div className="flex items-start gap-2 mb-4">
      <div className="mt-0.5 shrink-0 rounded-lg bg-indigo-50 p-1.5">
        <Icon size={15} className="text-indigo-600" />
      </div>
      <div>
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

function FunnelStep({
  value, label, source, colorClass, trend,
}: {
  value: number; label: string; source: string; colorClass: string; trend?: TrendValue;
}) {
  return (
    <div className={`min-w-[88px] flex-1 rounded-xl border px-3 py-3 text-center ${colorClass}`}>
      <p className="text-xl font-bold">{fmtNumber(value)}</p>
      <p className="text-xs font-medium mt-0.5">{label}</p>
      <p className="text-[10px] opacity-60 mt-0.5">{source}</p>
      {trend && (
        <div className="mt-1 text-[10px]">
          <TrendBadge trend={trend} />
        </div>
      )}
    </div>
  );
}

function FunnelArrow({ rate }: { rate: number | null }) {
  return (
    <div className="flex shrink-0 flex-col items-center justify-center gap-0.5 px-1">
      <span className="text-lg leading-none text-gray-300">→</span>
      {rate !== null && (
        <span className="rounded bg-indigo-50 px-1 py-0.5 text-[10px] font-semibold text-indigo-600">{rate}%</span>
      )}
    </div>
  );
}

const FEED_META: Record<string, { icon: string; label: string; color: string }> = {
  user_registered:        { icon: '🆕', label: 'Inscription',       color: 'text-violet-700 bg-violet-50 border-violet-200' },
  subscription_created:   { icon: '✓',  label: 'Abonnement activé', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  trial_started:          { icon: '↗',  label: 'Essai démarré',     color: 'text-amber-700 bg-amber-50 border-amber-200' },
  payment_failed:         { icon: '✗',  label: 'Paiement échoué',   color: 'text-red-700 bg-red-50 border-red-200' },
  subscription_cancelled: { icon: '↓',  label: 'Résiliation',       color: 'text-orange-700 bg-orange-50 border-orange-200' },
};

function FeedEvent({ event }: { event: RecentFeedEvent }) {
  const meta = FEED_META[event.event_type];
  return (
    <div className="flex items-start gap-3 border-b border-gray-50 py-2.5 last:border-0">
      <span className={`shrink-0 inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] font-medium ${meta?.color ?? 'border-gray-200 bg-gray-50 text-gray-600'}`}>
        {meta?.icon ?? '·'} {meta?.label ?? event.event_type}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs text-gray-700">{maskEmail(event.user_email)}</p>
        {event.label && <p className="truncate text-[10px] text-gray-400">{event.label}</p>}
      </div>
      <p className="ml-2 shrink-0 tabular-nums text-[11px] text-gray-400">{relativeTime(event.created_at)}</p>
    </div>
  );
}

function BreakdownBar({ items }: { items: Array<{ label: string; value: number }> }) {
  const total = items.reduce((s, i) => s + i.value, 0);
  return (
    <div className="mt-3 space-y-3">
      {items.map((item) => (
        <div key={item.label} className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-gray-700">{item.label}</span>
            <span className="font-medium text-gray-900">
              {fmtNumber(item.value)} <span className="text-gray-400">({pct(item.value, total)}%)</span>
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
            <div className="h-full rounded-full bg-indigo-500" style={{ width: `${pct(item.value, total)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function DiagTable({ title, items }: { title: string; items: SourceMetric[] }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-gray-900">{title}</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="border-b border-gray-100 text-left text-[10px] uppercase tracking-wide text-gray-400">
              <th className="pb-2 pr-4 font-semibold">Signal</th>
              <th className="pb-2 pr-4 font-semibold">7 j</th>
              <th className="pb-2 pr-4 font-semibold">30 j</th>
              <th className="pb-2 font-semibold">Source</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.label} className="border-b border-gray-50 last:border-0">
                <td className="py-1.5 pr-4 font-medium text-gray-900">{item.label}</td>
                <td className="py-1.5 pr-4 text-gray-700">{item.value7d === null ? '—' : fmtNumber(item.value7d)}</td>
                <td className="py-1.5 pr-4 text-gray-700">{item.value30d === null ? '—' : fmtNumber(item.value30d)}</td>
                <td className="py-1.5 text-gray-400">{item.source}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ── Page ────────────────────────────────────────────────────────

export default async function AdminAnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await isAdminUser(user.id, supabase))) redirect('/dashboard');

  const admin = createAdminClient();
  const nowMs = Date.now();
  const last30dIso = new Date(nowMs - 30 * 24 * 60 * 60 * 1000).toISOString();
  const last14dIso = new Date(nowMs - 14 * 24 * 60 * 60 * 1000).toISOString();
  const last7dIso  = new Date(nowMs -  7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    analytics,
    { data: recentUserEvents,   error: errUserEvents },
    { data: billingAlertEvents, error: errBillingAlerts },
    { data: recentCopros,       error: errCopros },
    { data: recentProfiles,     error: errProfiles },
    { data: adminRows },
    activeUsersCountResult,
    { data: activePlanRows,     error: errPlans },
    activeTrialsCountResult,
    { data: sessionRows },
    { data: conversionFeedRows },
    { data: signupFeedRows },
    { data: allTimePaidRows },
    { data: allCoproRows },
  ] = await Promise.all([
    getGa4AdminAnalytics(),
    // Acquisition events 30j
    admin.from('user_events')
      .select('event_type, created_at, user_email, user_id')
      .in('event_type', ['user_registered', 'begin_checkout', 'trial_started', 'subscription_created'])
      .gte('created_at', last30dIso),
    // Billing alerts 30j (payants + essais abandonnés)
    admin.from('user_events')
      .select('event_type, created_at, user_email, user_id')
      .in('event_type', ['payment_failed', 'subscription_cancelled', 'trial_cancelled'])
      .gte('created_at', last30dIso),
    // Copros créées 30j
    admin.from('coproprietes')
      .select('created_at, syndic_id')
      .gte('created_at', last30dIso),
    // Profils actifs 14j (pour tendances 7j vs 7j prec.) — limite réduite, total 30j via count
    admin.from('profiles')
      .select('id, last_active_at')
      .not('last_active_at', 'is', null)
      .gte('last_active_at', last14dIso)
      .order('last_active_at', { ascending: false })
      .limit(500),
    // Admins
    admin.from('admin_users').select('user_id'),
    // Count actifs 30j (source de vérité pour internalActive30d)
    admin.from('profiles')
      .select('id', { count: 'exact', head: true })
      .not('last_active_at', 'is', null)
      .gte('last_active_at', last30dIso),
    // Plan actif pour MRR
    admin.from('coproprietes').select('plan_id').eq('plan', 'actif'),
    // Essais actifs
    admin.from('coproprietes').select('id', { count: 'exact', head: true }).eq('plan', 'essai'),
    // Sessions 7j
    admin.from('user_sessions')
      .select('started_at, ended_at')
      .gte('started_at', last7dIso),
    // Feed événements clés (conversions + alertes) — séparé des inscriptions
    admin.from('user_events')
      .select('event_type, created_at, user_email, user_id, label, severity')
      .in('event_type', ['subscription_created', 'trial_started', 'payment_failed', 'subscription_cancelled'])
      .order('created_at', { ascending: false })
      .limit(20),
    // Feed inscriptions — séparé pour garantir la présence
    admin.from('user_events')
      .select('event_type, created_at, user_email, user_id, label, severity')
      .eq('event_type', 'user_registered')
      .order('created_at', { ascending: false })
      .limit(15),
    // All-time : emails ayant eu subscription_created (pour reclassifier les anciens subscription_cancelled)
    admin.from('user_events')
      .select('user_email')
      .eq('event_type', 'subscription_created'),
    // All-time : syndic_id de toutes les copropriétés (pour bloqués à l'onboarding exact)
    admin.from('coproprietes')
      .select('syndic_id')
      .not('syndic_id', 'is', null),
  ]);

  const activeUsersCount = activeUsersCountResult.count ?? recentProfiles?.length ?? 0;
  const activeTrialsCount = activeTrialsCountResult.count ?? 0;
  const paidUserEmails = new Set(
    (allTimePaidRows ?? []).map((r) => (r.user_email ?? '').toLowerCase()).filter(Boolean),
  );
  const syndicIdsWithCopro = new Set(
    (allCoproRows ?? []).map((r) => r.syndic_id).filter(Boolean) as string[],
  );

  const hasQueryError = [errUserEvents, errBillingAlerts, errCopros, errProfiles, errPlans].some(Boolean);

  // Combine les deux feeds (déjà triés desc par created_at, merge stable)
  const combinedFeedRows: RecentFeedEvent[] = [
    ...(conversionFeedRows ?? []),
    ...(signupFeedRows ?? []),
  ].sort((a, b) => Date.parse(b.created_at ?? '0') - Date.parse(a.created_at ?? '0'));

  const m = buildAdminAnalyticsMetrics({
    analytics,
    recentUserEvents:   (recentUserEvents   ?? []) as UserEventRow[],
    billingAlertEvents: (billingAlertEvents ?? []) as UserEventRow[],
    recentCopros:       (recentCopros       ?? []) as CoproActivityRow[],
    recentProfiles:     (recentProfiles     ?? []) as ProfileActivityRow[],
    adminRows:          (adminRows          ?? []) as AdminRow[],
    activePlanRows:     (activePlanRows     ?? []) as PlanDistributionRow[],
    sessionRows:        (sessionRows        ?? []) as SessionRow[],
    recentFeedEvents:   combinedFeedRows,
    paidUserEmails,
    syndicIdsWithCopro,
    activeUsersCount,
    activeTrialsCount,
    nowMs,
  });

  const billingHealthy = m.paymentFailed7d === 0 && m.subscriptionCancelled30d === 0 && m.trialCancelled30d === 0;
  const diagSignalCount = m.gaMetrics.length + m.internalMetrics.length + m.stripeMetrics.length;

  const signupFeedEvents = m.recentFeedEvents.filter((e) => e.event_type === 'user_registered');
  const conversionFeedEvents = m.recentFeedEvents.filter((e) => e.event_type !== 'user_registered');

  return (
    <div className="space-y-6 pb-16">

      {/* ── Header ──────────────────────────────────────────── */}
      <header className="rounded-2xl border border-gray-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-5 text-white shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-200">Analytics · Admin</p>
            <h1 className="mt-1 text-2xl font-bold">Pilotage SaaS</h1>
            <div className="mt-3 flex flex-wrap gap-4 text-sm">
              <div>
                <p className="text-slate-400 text-[10px] uppercase tracking-wide">MRR estimé</p>
                <p className="font-bold text-emerald-300">{fmtEur(m.mrrEstimate)}/mois</p>
              </div>
              <div>
                <p className="text-slate-400 text-[10px] uppercase tracking-wide">Abonnements actifs</p>
                <p className="font-bold text-white">{fmtNumber(m.activeSubscriptions)}</p>
              </div>
              <div>
                <p className="text-slate-400 text-[10px] uppercase tracking-wide">Essais en cours</p>
                <p className="font-bold text-amber-300">{fmtNumber(m.activeTrials)}</p>
              </div>
              <div>
                <p className="text-slate-400 text-[10px] uppercase tracking-wide">Conv. essai→payant (30j)</p>
                <p className="font-bold text-indigo-300">{m.trialToPaidRate30d !== null ? `${m.trialToPaidRate30d}%` : '—'}</p>
              </div>
              <div>
                <p className="text-slate-400 text-[10px] uppercase tracking-wide">Churn payants (30j)</p>
                <p className={`font-bold ${m.churnRate30d !== null && m.churnRate30d > 5 ? 'text-red-300' : 'text-slate-200'}`}>
                  {m.churnRate30d !== null ? `${m.churnRate30d}%` : '—'}
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-[10px] uppercase tracking-wide">Essais abandonnés (30j)</p>
                <p className={`font-bold ${m.trialCancelled30d > 0 ? 'text-orange-300' : 'text-slate-200'}`}>
                  {fmtNumber(m.trialCancelled30d)}
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex flex-wrap gap-2">
              <Link href="https://analytics.google.com" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/15">
                GA4 <ExternalLink size={13} />
              </Link>
              <Link href="https://tagmanager.google.com" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/15">
                GTM <ExternalLink size={13} />
              </Link>
              <Link href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/15">
                Stripe <ExternalLink size={13} />
              </Link>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-slate-300">
              <span className="rounded-full bg-white/10 px-2.5 py-1">GA4 : {analytics.propertyId ?? 'non configurée'}</span>
              <RefreshButton fetchedAt={analytics.fetchedAt} />
              {analytics.error && (
                <span className="rounded-full bg-red-500/30 px-2.5 py-1 text-red-200">
                  Erreur GA4 : {analytics.error.slice(0, 60)}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Warnings ────────────────────────────────────────── */}
      {(!analytics.configured || hasQueryError) && (
        <div className="space-y-2">
          {!analytics.configured && (
            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-amber-900">Configuration GA4 requise</h2>
              <p className="mt-1 text-xs text-amber-800">Variables manquantes : {analytics.missingVars.join(', ')}</p>
            </section>
          )}
          {hasQueryError && (
            <section className="rounded-2xl border border-red-200 bg-red-50 p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-red-900">Erreur de chargement partielle</h2>
              <p className="mt-1 text-xs text-red-800">
                Une ou plusieurs requêtes ont échoué. Certaines métriques peuvent afficher 0. Actualiser la page pour réessayer.
              </p>
            </section>
          )}
        </div>
      )}

      {/* ── Alertes opérationnelles ─────────────────────────── */}
      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <SectionHeader icon={AlertTriangle} title="Alertes opérationnelles" subtitle="Billing · 30 derniers jours" />
        {billingHealthy ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <AlertCard label="Paiements échoués (7j)" value="0" detail="Aucun incident de paiement" level="ok" />
            <AlertCard label="Résiliations payants (30j)" value="0" detail="Aucune résiliation" level="ok" />
            <AlertCard label="Essais abandonnés (30j)" value="0" detail="Tous les essais ont converti" level="ok" />
            <AlertCard label="Billing" value="Sain" detail="Tout va bien sur les 30 derniers jours" level="ok" />
            <AlertCard
              label="Churn payants (30j)"
              value={m.churnRate30d !== null ? `${m.churnRate30d}%` : '—'}
              detail={m.activeSubscriptions > 0 ? `${m.activeSubscriptions} abonnés actifs` : 'Aucun abonné actif'}
              level={m.churnRate30d !== null && m.churnRate30d > 5 ? 'warn' : 'ok'}
            />
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <AlertCard
              label="Paiements échoués (7j)"
              value={fmtNumber(m.paymentFailed7d)}
              detail={`${fmtNumber(m.paymentFailed30d)} sur 30j`}
              level={m.paymentFailed7d > 0 ? 'error' : 'ok'}
            />
            <AlertCard
              label="Résiliations payants (30j)"
              value={fmtNumber(m.subscriptionCancelled30d)}
              detail={`${fmtNumber(m.subscriptionCancelled7d)} sur les 7 derniers jours`}
              level={m.subscriptionCancelled30d > 0 ? 'warn' : 'ok'}
            />
            <AlertCard
              label="Essais abandonnés (30j)"
              value={fmtNumber(m.trialCancelled30d)}
              detail={`${fmtNumber(m.trialCancelled7d)} sur les 7 derniers jours`}
              level={m.trialCancelled30d > 0 ? 'warn' : 'ok'}
            />
            <AlertCard
              label="Essais en cours"
              value={fmtNumber(m.activeTrials)}
              detail={m.trialToPaidRate30d !== null ? `Conv. 30j : ${m.trialToPaidRate30d}%` : 'Taux de conv. insuffisant'}
              level={m.activeTrials > 0 ? 'warn' : 'ok'}
            />
            <AlertCard
              label="Churn payants (30j)"
              value={m.churnRate30d !== null ? `${m.churnRate30d}%` : '—'}
              detail={`${m.subscriptionCancelled30d} résiliation(s) / ${m.activeSubscriptions + m.subscriptionCancelled30d} abonnés début période`}
              level={m.churnRate30d !== null && m.churnRate30d > 5 ? 'warn' : 'ok'}
            />
          </div>
        )}
      </section>

      {/* ── Funnel d'acquisition ────────────────────────────── */}
      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <SectionHeader
          icon={TrendingUp}
          title="Funnel d'acquisition — 7 jours"
          subtitle="Visiteurs web GA4 · Inscriptions · Copros créées · Essais Stripe · Abonnements"
        />
        {/* Scroll horizontal sur mobile, row sur sm+ */}
        <div className="-mx-1 overflow-x-auto px-1">
          <div className="flex min-w-max items-center gap-2 pt-1 pb-2">
            <FunnelStep value={m.gaWebUsers7d} label="Visiteurs web" source="GA4" colorClass="border-slate-200 bg-slate-50 text-slate-700" />
            <FunnelArrow rate={null} />
            <FunnelStep value={m.internalRegistrations7d} label="Inscrits" source="Interne" colorClass="border-violet-200 bg-violet-50 text-violet-700" trend={m.trendRegistrations} />
            <FunnelArrow rate={m.conversionSignupToOnboarding7d} />
            <FunnelStep value={m.internalOnboarding7d} label="Copros créées" source="Interne" colorClass="border-sky-200 bg-sky-50 text-sky-700" trend={m.trendOnboarding} />
            <FunnelArrow rate={m.conversionOnboardingToTrial7d} />
            <FunnelStep value={m.stripeTrials7d} label="Essais" source="Stripe" colorClass="border-amber-200 bg-amber-50 text-amber-700" trend={m.trendTrials} />
            <FunnelArrow rate={m.conversionCheckoutToTrial7d} />
            <FunnelStep value={m.stripeSubscriptions7d} label="Abonnements" source="Stripe" colorClass="border-emerald-200 bg-emerald-50 text-emerald-700" trend={m.trendSubscriptions} />
          </div>
        </div>
        {m.blockedAtOnboarding30d > 0 && (
          <div className="mt-2 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
            <AlertTriangle size={13} className="shrink-0 text-amber-500" />
            <p className="text-xs text-amber-800">
              <strong>{fmtNumber(m.blockedAtOnboarding30d)}</strong> inscription(s) sans copro créée sur 30j — possible friction à l'onboarding.
            </p>
          </div>
        )}
        <p className="mt-2 text-[10px] text-gray-400">
          % = taux de conversion entre chaque étape (7j). GA4 = audience web publique (peut inclure robots). Friction = inscrits sans copro créée sur 30j.
        </p>
      </section>
      {/* ── Tier 2 : Comprendre le business ─────────────── */}
      <div className="flex items-center gap-3 py-1">
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Comprendre le business</span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>
      {/* ── Engagement ──────────────────────────────────────── */}
      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <SectionHeader icon={Activity} title="Engagement utilisateurs" subtitle="Logs internes (last_active_at) · hors admins" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Actifs 24h"
            value={m.internalActive24h === 0 ? '—' : fmtNumber(m.internalActive24h)}
            hint={m.internalActive24h === 0 ? 'Aucune activité détectée' : 'utilisateurs ayant accédé à une page'}
            icon={Users}
            tone="bg-blue-50 text-blue-600"
          />
          <StatCard
            label="Actifs 7j"
            value={m.internalActive7d === 0 ? '—' : fmtNumber(m.internalActive7d)}
            hint={`${fmtNumber(m.internalActiveTotalCount)} sur 30j`}
            icon={Users}
            tone="bg-blue-50 text-blue-600"
            trend={m.trendActive}
          />
          <StatCard
            label="Sessions 7j"
            value={m.sessionsTotal7d === 0 ? '—' : fmtNumber(m.sessionsTotal7d)}
            hint={
              m.sessionsTotal7d === 0
                ? 'Données en cours de collecte'
                : m.sessionsCompletedPct !== null
                  ? `${m.sessionsCompletedPct}% terminées proprement`
                  : 'Sessions démarrées (user_sessions)'
            }
            icon={RefreshCcw}
            tone="bg-teal-50 text-teal-600"
          />
          <StatCard
            label="Durée moy. session"
            value={fmtDuration(m.avgSessionDurationMinutes)}
            hint={
              m.avgSessionDurationMinutes === null
                ? 'Toutes sessions encore ouvertes'
                : `Sur ${m.sessionsCompletedPct ?? '?'}% de sessions terminées`
            }
            icon={Clock}
            tone="bg-teal-50 text-teal-600"
          />
        </div>
      </section>

      {/* ── Inscriptions + Activité récente ─────────────────── */}
      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <SectionHeader icon={UserPlus} title="Dernières inscriptions" subtitle="hors admins · user_registered" />
          {signupFeedEvents.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <UserPlus size={24} className="text-gray-200 mb-2" />
              <p className="text-sm text-gray-400">Aucune inscription récente.</p>
              <p className="text-xs text-gray-300 mt-1">Les nouvelles inscriptions apparaîtront ici.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {signupFeedEvents.map((event, i) => (
                <div key={`signup-${i}`} className="flex items-center justify-between py-2.5">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-600">
                      {(event.user_email ?? '?').slice(0, 1).toUpperCase()}
                    </div>
                    <p className="truncate text-sm text-gray-700">{event.user_email ?? '—'}</p>
                  </div>
                  <p className="ml-3 shrink-0 tabular-nums text-[11px] text-gray-400">{relativeTime(event.created_at)}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <SectionHeader
            icon={BarChart2}
            title="Événements clés récents"
            subtitle="subscription_created · trial_started · payment_failed · subscription_cancelled"
          />
          {conversionFeedEvents.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <BarChart2 size={24} className="text-gray-200 mb-2" />
              <p className="text-sm text-gray-400">Aucun événement de conversion récent.</p>
              <p className="text-xs text-gray-300 mt-1">Les essais, abonnements et alertes apparaîtront ici.</p>
            </div>
          ) : (
            <div>
              {conversionFeedEvents.map((event, i) => (
                <FeedEvent key={`feed-${i}`} event={event} />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ── Acquisition (KPI cartes) ─────────────────────────── */}
      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <SectionHeader icon={UserPlus} title="Acquisition — métriques détaillées" subtitle="Sources : logs internes + Stripe webhooks" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Inscriptions (7j)"
            value={fmtNumber(m.internalRegistrations7d)}
            hint={`${fmtNumber(m.internalRegistrations24h)} / 24h  ·  ${fmtNumber(m.internalRegistrations30d)} / 30j`}
            icon={UserPlus}
            tone="bg-violet-50 text-violet-600"
            trend={m.trendRegistrations}
          />
          <StatCard
            label="Copros créées (7j)"
            value={fmtNumber(m.internalOnboarding7d)}
            hint={`${fmtNumber(m.internalOnboarding24h)} / 24h  ·  ${fmtNumber(m.internalOnboarding30d)} / 30j`}
            icon={Building2}
            tone="bg-sky-50 text-sky-600"
            trend={m.trendOnboarding}
          />
          <StatCard
            label="Essais démarrés (7j)"
            value={fmtNumber(m.stripeTrials7d)}
            hint={`${fmtNumber(m.stripeTrials24h)} / 24h  ·  ${fmtNumber(m.stripeTrials30d)} / 30j`}
            icon={ShoppingCart}
            tone="bg-amber-50 text-amber-600"
            trend={m.trendTrials}
          />
          <StatCard
            label="Bloqués à l'onboarding (30j)"
            value={fmtNumber(m.blockedAtOnboarding30d)}
            hint={
              m.blockedAtOnboarding30d === 0
                ? 'Tous les inscrits ont créé une copro'
                : `${fmtNumber(m.internalRegistrations30d)} inscrits, ${fmtNumber(m.internalOnboarding30d)} copros`
            }
            icon={UserMinus}
            tone={m.blockedAtOnboarding30d > 0 ? 'bg-orange-50 text-orange-600' : 'bg-emerald-50 text-emerald-600'}
          />
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <StatCard
            label="Abonnements activés (7j)"
            value={fmtNumber(m.stripeSubscriptions7d)}
            hint={`${fmtNumber(m.stripeSubscriptions24h)} / 24h  ·  ${fmtNumber(m.stripeSubscriptions30d)} / 30j`}
            icon={ShieldCheck}
            tone="bg-emerald-50 text-emerald-600"
            trend={m.trendSubscriptions}
          />
          <StatCard
            label="Churn payants (30j)"
            value={m.churnRate30d !== null ? `${m.churnRate30d}%` : '—'}
            hint={`${m.subscriptionCancelled30d} résiliation(s) / ${m.activeSubscriptions + m.subscriptionCancelled30d} abonnés début période`}
            icon={Percent}
            tone={m.churnRate30d !== null && m.churnRate30d > 5 ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-600'}
          />
          <StatCard
            label="Essais abandonnés (30j)"
            value={fmtNumber(m.trialCancelled30d)}
            hint={`${fmtNumber(m.trialCancelled7d)} sur 7j · essais terminés sans conversion`}
            icon={UserMinus}
            tone={m.trialCancelled30d > 0 ? 'bg-orange-50 text-orange-600' : 'bg-gray-50 text-gray-600'}
          />
        </div>
      </section>

      {/* ── Tier 3 : Instrumentation ────────────────────── */}
      <div className="flex items-center gap-3 py-1">
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Instrumentation & diagnostics</span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      {/* ── Audience web GA4 ────────────────────────────────── */}
      <section>
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center gap-2 rounded-2xl border border-gray-200 bg-white p-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
            <Eye size={15} className="text-gray-400 group-open:text-indigo-500" />
            Audience web — GA4
            <span className="ml-1 text-[10px] text-gray-400">pages publiques · Consent Mode v2 · latence 24h</span>
            <span className="ml-auto text-xs text-gray-400">cliquer pour ouvrir</span>
          </summary>
          <div className="mt-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Visiteurs uniques (7j)"
            value={fmtNumber(m.gaWebUsers7d)}
            hint={`${fmtNumber(m.gaWebUsers30d)} sur 30j`}
            icon={Users}
            tone="bg-slate-100 text-slate-600"
          />
          <StatCard
            label="Sessions web (7j)"
            value={fmtNumber(m.gaWebSessions7d)}
            hint="sessions GA4 (publiques)"
            icon={Activity}
            tone="bg-slate-100 text-slate-600"
          />
          <StatCard
            label="Pages vues (7j)"
            value={fmtNumber(m.gaWebPageViews7d)}
            hint="pages_view GA4 publiques"
            icon={Eye}
            tone="bg-slate-100 text-slate-600"
          />
          <StatCard
            label="Pages dashboard (7j)"
            value={fmtNumber(m.dashboardPageViews7d)}
            hint={`${fmtNumber(m.dashboardPageViews30d)} sur 30j · dashboard_page_view`}
            icon={BarChart3}
            tone="bg-slate-100 text-slate-600"
          />
        </div>

        {(analytics.topPages.length > 0 || analytics.internalPlatformPages.length > 0) && (
          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            {analytics.topPages.length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-semibold text-gray-700">Top pages web (30j)</h3>
                <div className="space-y-2">
                  {analytics.topPages.slice(0, 6).map((page) => (
                    <div key={`${page.path}-${page.title}`} className="flex items-center justify-between rounded-xl border border-gray-100 px-3 py-2">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-gray-900">{page.title || page.path}</p>
                        <p className="truncate text-[10px] text-gray-400">{page.path}</p>
                      </div>
                      <div className="ml-3 shrink-0 text-right">
                        <p className="text-sm font-semibold text-gray-900">{fmtNumber(page.views)}</p>
                        <p className="text-[10px] text-gray-400">{fmtNumber(page.users)} util.</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {analytics.internalPlatformPages.length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-semibold text-gray-700">Top pages dashboard (30j)</h3>
                <div className="space-y-2">
                  {analytics.internalPlatformPages.slice(0, 6).map((page) => (
                    <div key={`${page.area}-${page.path}`} className="flex items-center justify-between rounded-xl border border-gray-100 px-3 py-2">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-gray-900">{page.path}</p>
                        <p className="text-[10px] text-gray-400">{page.area}</p>
                      </div>
                      <p className="ml-3 shrink-0 text-sm font-semibold text-gray-900">{fmtNumber(page.views)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {analytics.deviceCategories.length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-semibold text-gray-700">Appareils</h3>
                <BreakdownBar items={analytics.deviceCategories} />
              </div>
            )}

            {analytics.consentStates.length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-semibold text-gray-700">État consentement</h3>
                <BreakdownBar items={analytics.consentStates} />
              </div>
            )}
          </div>
        )}
          </div>
        </details>
      </section>

      {/* ── Diagnostics bruts ───────────────────────────────── */}
      <section>
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center gap-2 rounded-2xl border border-gray-200 bg-white p-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
            <BarChart3 size={15} className="text-gray-400 group-open:text-indigo-500" />
            Diagnostics bruts (logs internes · GA4 · Stripe)
            <span className="ml-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">{diagSignalCount} signaux</span>
            <span className="ml-auto text-xs text-gray-400">cliquer pour ouvrir</span>
          </summary>
          <div className="mt-3 grid gap-4 xl:grid-cols-3">
            <DiagTable title="GA4 events bruts" items={m.gaMetrics} />
            <DiagTable title="Logs internes bruts" items={m.internalMetrics} />
            <DiagTable title="Stripe brut" items={m.stripeMetrics} />
          </div>
          {analytics.topEvents.length > 0 && (
            <section className="mt-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-gray-900">Top événements GA4 custom (30j)</h3>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {analytics.topEvents.map((event) => (
                  <div key={event.name} className="flex items-center justify-between rounded-xl border border-gray-100 px-3 py-2">
                    <p className="text-xs font-medium text-gray-700">{event.name}</p>
                    <p className="text-sm font-semibold text-gray-900">{fmtNumber(event.count)}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </details>
      </section>

    </div>
  );
}