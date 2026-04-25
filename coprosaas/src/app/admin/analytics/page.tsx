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
  CreditCard,
  ExternalLink,
  Eye,
  RefreshCcw,
  ShieldCheck,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Users,
  Zap,
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

// ── Utilitaires d'affichage ─────────────────────────────────────

function fmtNumber(value: number) {
  return new Intl.NumberFormat('fr-FR').format(value);
}

function fmtEur(value: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
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
    <div className={`flex-1 min-w-[90px] rounded-xl border px-3 py-3 text-center ${colorClass}`}>
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
    <div className="flex flex-col items-center justify-center gap-0.5 shrink-0 px-1">
      <span className="text-gray-300 text-lg leading-none">→</span>
      {rate !== null && (
        <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 rounded px-1 py-0.5">{rate}%</span>
      )}
    </div>
  );
}

const FEED_META: Record<string, { icon: string; label: string; color: string }> = {
  user_registered:       { icon: '🆕', label: 'Inscription',           color: 'text-violet-700 bg-violet-50 border-violet-200' },
  subscription_created:  { icon: '✓',  label: 'Abonnement activé',     color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  trial_started:         { icon: '↗',  label: 'Essai démarré',         color: 'text-amber-700 bg-amber-50 border-amber-200' },
  payment_failed:        { icon: '✗',  label: 'Paiement échoué',       color: 'text-red-700 bg-red-50 border-red-200' },
  subscription_cancelled:{ icon: '↓',  label: 'Résiliation',           color: 'text-orange-700 bg-orange-50 border-orange-200' },
};

function FeedEvent({ event }: { event: RecentFeedEvent }) {
  const meta = FEED_META[event.event_type];
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <span className={`shrink-0 inline-flex items-center gap-1 text-[11px] font-medium border rounded px-1.5 py-0.5 ${meta?.color ?? 'text-gray-600 bg-gray-50 border-gray-200'}`}>
        {meta?.icon ?? '·'} {meta?.label ?? event.event_type}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-700 truncate">{maskEmail(event.user_email)}</p>
        {event.label && <p className="text-[10px] text-gray-400 truncate">{event.label}</p>}
      </div>
      <p className="shrink-0 text-[11px] text-gray-400 tabular-nums">{relativeTime(event.created_at)}</p>
    </div>
  );
}

function BreakdownBar({ items }: { items: Array<{ label: string; value: number }> }) {
  const total = items.reduce((s, i) => s + i.value, 0);
  return (
    <div className="space-y-3 mt-3">
      {items.map((item) => (
        <div key={item.label} className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-gray-700">{item.label}</span>
            <span className="font-medium text-gray-900">{fmtNumber(item.value)} <span className="text-gray-400">({pct(item.value, total)}%)</span></span>
          </div>
          <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
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
      <h3 className="text-sm font-semibold text-gray-900 mb-3">{title}</h3>
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
  const last7dIso  = new Date(nowMs -  7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    analytics,
    { data: recentUserEvents },
    { data: billingAlertEvents },
    { data: recentCopros },
    { data: recentProfiles },
    { data: adminRows },
    activeUsersCountResult,
    { data: activePlanRows },
    activeTrialsCountResult,
    { data: sessionRows },
    { data: recentFeedRows },
  ] = await Promise.all([
    getGa4AdminAnalytics(),
    admin.from('user_events')
      .select('event_type, created_at, user_email, user_id')
      .in('event_type', ['user_registered', 'begin_checkout', 'trial_started', 'subscription_created'])
      .gte('created_at', last30dIso),
    admin.from('user_events')
      .select('event_type, created_at, user_email, user_id')
      .in('event_type', ['payment_failed', 'subscription_cancelled'])
      .gte('created_at', last30dIso),
    admin.from('coproprietes')
      .select('created_at, syndic_id')
      .gte('created_at', last30dIso),
    admin.from('profiles')
      .select('id, full_name, last_active_at')
      .not('last_active_at', 'is', null)
      .gte('last_active_at', last30dIso)
      .order('last_active_at', { ascending: false })
      .limit(5000),
    admin.from('admin_users').select('user_id'),
    admin.from('profiles')
      .select('id', { count: 'exact', head: true })
      .not('last_active_at', 'is', null)
      .gte('last_active_at', last30dIso),
    admin.from('coproprietes').select('plan_id').eq('plan', 'actif'),
    admin.from('coproprietes').select('id', { count: 'exact', head: true }).eq('plan', 'essai'),
    admin.from('user_sessions')
      .select('started_at, ended_at')
      .gte('started_at', last7dIso),
    admin.from('user_events')
      .select('event_type, created_at, user_email, user_id, label, severity')
      .in('event_type', ['user_registered', 'subscription_created', 'trial_started', 'payment_failed', 'subscription_cancelled'])
      .order('created_at', { ascending: false })
      .limit(30),
  ]);

  const activeUsersCount = activeUsersCountResult.count ?? recentProfiles?.length ?? 0;
  const activeTrialsCount = activeTrialsCountResult.count ?? 0;

  const m = buildAdminAnalyticsMetrics({
    analytics,
    recentUserEvents:    (recentUserEvents    ?? []) as UserEventRow[],
    billingAlertEvents:  (billingAlertEvents  ?? []) as UserEventRow[],
    recentCopros:        (recentCopros        ?? []) as CoproActivityRow[],
    recentProfiles:      (recentProfiles      ?? []) as ProfileActivityRow[],
    adminRows:           (adminRows           ?? []) as AdminRow[],
    activePlanRows:      (activePlanRows      ?? []) as PlanDistributionRow[],
    sessionRows:         (sessionRows         ?? []) as SessionRow[],
    recentFeedEvents:    (recentFeedRows      ?? []) as RecentFeedEvent[],
    activeUsersCount,
    activeTrialsCount,
    nowMs,
  });

  const billingHealthy = m.paymentFailed7d === 0 && m.subscriptionCancelled30d === 0;

  const recentSignups = m.recentFeedEvents
    .filter((e) => e.event_type === 'user_registered')
    .slice(0, 10);

  const recentKeyEvents = m.recentFeedEvents
    .filter((e) => e.event_type !== 'user_registered')
    .slice(0, 12);

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
            </div>
          </div>
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
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-300">
          <span className="rounded-full bg-white/10 px-2.5 py-1">GA4 : {analytics.propertyId ?? 'non configurée'}</span>
          <span className="rounded-full bg-white/10 px-2.5 py-1">Màj : {fmtDateTime(analytics.fetchedAt)}</span>
          {analytics.error && <span className="rounded-full bg-red-500/30 px-2.5 py-1 text-red-200">Erreur GA4 : {analytics.error.slice(0, 60)}</span>}
        </div>
      </header>

      {/* ── Config warning ──────────────────────────────────── */}
      {!analytics.configured && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-amber-900">Configuration GA4 requise</h2>
          <p className="mt-1 text-xs text-amber-800">Variables manquantes : {analytics.missingVars.join(', ')}</p>
        </section>
      )}

      {/* ── Alertes opérationnelles ─────────────────────────── */}
      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <SectionHeader icon={AlertTriangle} title="Alertes opérationnelles" subtitle="Billing · 30 derniers jours" />
        {billingHealthy ? (
          <div className="grid gap-3 md:grid-cols-3">
            <AlertCard label="Paiements échoués (7j)" value="0" detail="Aucun incident de paiement" level="ok" />
            <AlertCard label="Résiliations (30j)" value="0" detail="Aucune résiliation" level="ok" />
            <AlertCard label="Billing" value="Sain" detail="Tout va bien sur les 30 derniers jours" level="ok" />
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            <AlertCard
              label="Paiements échoués (7j)"
              value={fmtNumber(m.paymentFailed7d)}
              detail={`${fmtNumber(m.paymentFailed30d)} sur 30j`}
              level={m.paymentFailed7d > 0 ? 'error' : 'ok'}
            />
            <AlertCard
              label="Résiliations (30j)"
              value={fmtNumber(m.subscriptionCancelled30d)}
              detail={`${fmtNumber(m.subscriptionCancelled7d)} sur les 7 derniers jours`}
              level={m.subscriptionCancelled30d > 2 ? 'warn' : m.subscriptionCancelled30d > 0 ? 'warn' : 'ok'}
            />
            <AlertCard
              label="Pipeline en essai"
              value={fmtNumber(m.activeTrials)}
              detail={`${m.trialToPaidRate30d !== null ? `Conv. 30j : ${m.trialToPaidRate30d}%` : 'Taux de conv. insuffisant'}`}
              level={m.activeTrials > 0 ? 'warn' : 'ok'}
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
        <div className="flex flex-wrap items-center gap-2 mt-2">
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
        <p className="mt-3 text-[10px] text-gray-400">
          Les pourcentages sont les taux de conversion entre chaque etape (7j). GA4 = audience web publique (peut inclure robots).
        </p>
      </section>

      {/* ── Engagement ──────────────────────────────────────── */}
      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <SectionHeader icon={Activity} title="Engagement utilisateurs" subtitle="Logs internes (last_active_at) · hors admins" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Actifs 24h"
            value={fmtNumber(m.internalActive24h)}
            hint="utilisateurs ayant accede a une page"
            icon={Users}
            tone="bg-blue-50 text-blue-600"
          />
          <StatCard
            label="Actifs 7j"
            value={fmtNumber(m.internalActive7d)}
            hint={`${fmtNumber(m.internalActiveTotalCount)} sur 30j`}
            icon={Users}
            tone="bg-blue-50 text-blue-600"
            trend={m.trendActive}
          />
          <StatCard
            label="Sessions 7j"
            value={fmtNumber(m.sessionsTotal7d)}
            hint={m.sessionsTotal7d === 0 ? 'Donnees en cours de collecte' : 'Sessions demarrees (user_sessions)'}
            icon={RefreshCcw}
            tone="bg-teal-50 text-teal-600"
          />
          <StatCard
            label="Duree moy. session"
            value={fmtDuration(m.avgSessionDurationMinutes)}
            hint={m.avgSessionDurationMinutes === null ? 'Sessions encore ouvertes' : 'Sessions terminees (>30 min inactivite)'}
            icon={Activity}
            tone="bg-teal-50 text-teal-600"
          />
        </div>
      </section>

      {/* ── Inscriptions + Activité récente ─────────────────── */}
      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <SectionHeader icon={UserPlus} title="Dernières inscriptions" subtitle="hors admins · logs internes user_registered" />
          {recentSignups.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">Aucune inscription recente.</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentSignups.map((event, i) => (
                <div key={`signup-${i}`} className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-7 w-7 rounded-full bg-violet-100 flex items-center justify-center text-xs font-bold text-violet-600 shrink-0">
                      {(event.user_email ?? '?').slice(0, 1).toUpperCase()}
                    </div>
                    <p className="text-sm text-gray-700 truncate">{maskEmail(event.user_email)}</p>
                  </div>
                  <p className="text-[11px] text-gray-400 shrink-0 tabular-nums ml-3">{relativeTime(event.created_at)}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <SectionHeader icon={BarChart2} title="Evenements cles recents" subtitle="subscription_created · trial_started · payment_failed · subscription_cancelled" />
          {recentKeyEvents.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">Aucun evenement recent.</p>
          ) : (
            <div>
              {recentKeyEvents.map((event, i) => (
                <FeedEvent key={`feed-${i}`} event={event} />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ── Acquisition (KPI cartes) ─────────────────────────── */}
      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <SectionHeader icon={UserPlus} title="Acquisition — metriques detaillees" subtitle="Sources : logs internes + Stripe webhooks" />
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
            label="Copros creees (7j)"
            value={fmtNumber(m.internalOnboarding7d)}
            hint={`${fmtNumber(m.internalOnboarding24h)} / 24h  ·  ${fmtNumber(m.internalOnboarding30d)} / 30j`}
            icon={Building2}
            tone="bg-sky-50 text-sky-600"
            trend={m.trendOnboarding}
          />
          <StatCard
            label="Essais demarres (7j)"
            value={fmtNumber(m.stripeTrials7d)}
            hint={`${fmtNumber(m.stripeTrials24h)} / 24h  ·  ${fmtNumber(m.stripeTrials30d)} / 30j`}
            icon={ShoppingCart}
            tone="bg-amber-50 text-amber-600"
            trend={m.trendTrials}
          />
          <StatCard
            label="Abonnements actives (7j)"
            value={fmtNumber(m.stripeSubscriptions7d)}
            hint={`${fmtNumber(m.stripeSubscriptions24h)} / 24h  ·  ${fmtNumber(m.stripeSubscriptions30d)} / 30j`}
            icon={ShieldCheck}
            tone="bg-emerald-50 text-emerald-600"
            trend={m.trendSubscriptions}
          />
        </div>
      </section>

      {/* ── Audience web GA4 ────────────────────────────────── */}
      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <SectionHeader icon={Eye} title="Audience web — GA4" subtitle="Pages publiques uniquement · Consent Mode v2 · latence possible 24h" />
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
                <h3 className="text-xs font-semibold text-gray-700 mb-2">Top pages web (30j)</h3>
                <div className="space-y-2">
                  {analytics.topPages.slice(0, 6).map((page) => (
                    <div key={`${page.path}-${page.title}`} className="flex items-center justify-between rounded-xl border border-gray-100 px-3 py-2">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-gray-900">{page.title || page.path}</p>
                        <p className="truncate text-[10px] text-gray-400">{page.path}</p>
                      </div>
                      <div className="shrink-0 text-right ml-3">
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
                <h3 className="text-xs font-semibold text-gray-700 mb-2">Top pages dashboard (30j)</h3>
                <div className="space-y-2">
                  {analytics.internalPlatformPages.slice(0, 6).map((page) => (
                    <div key={`${page.area}-${page.path}`} className="flex items-center justify-between rounded-xl border border-gray-100 px-3 py-2">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-900 truncate">{page.path}</p>
                        <p className="text-[10px] text-gray-400">{page.area}</p>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 shrink-0 ml-3">{fmtNumber(page.views)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {analytics.deviceCategories.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-gray-700 mb-2">Appareils</h3>
                <BreakdownBar items={analytics.deviceCategories} />
              </div>
            )}

            {analytics.consentStates.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-gray-700 mb-2">Etat consentement</h3>
                <BreakdownBar items={analytics.consentStates} />
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── Diagnostics bruts ───────────────────────────────── */}
      <section>
        <details className="group">
          <summary className="cursor-pointer rounded-2xl border border-gray-200 bg-white p-3 shadow-sm flex items-center gap-2 text-sm font-medium text-gray-700 hover:bg-gray-50 list-none">
            <BarChart3 size={15} className="text-gray-400 group-open:text-indigo-500" />
            Diagnostics bruts (logs internes · GA4 · Stripe)
            <span className="ml-auto text-xs text-gray-400">cliquer pour ouvrir</span>
          </summary>
          <div className="mt-3 grid gap-4 xl:grid-cols-3">
            <DiagTable title="GA4 events bruts" items={m.gaMetrics} />
            <DiagTable title="Logs internes bruts" items={m.internalMetrics} />
            <DiagTable title="Stripe brut" items={m.stripeMetrics} />
          </div>
          {analytics.topEvents.length > 0 && (
            <section className="mt-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Top evenements GA4 custom (30j)</h3>
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