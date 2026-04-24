export const revalidate = 300;

import type { ElementType } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  Activity,
  BarChart3,
  Building2,
  Clock3,
  Cookie,
  ExternalLink,
  Eye,
  MousePointerClick,
  ShieldCheck,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
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
  type ProfileActivityRow,
  type SourceMetric,
  type TrendValue,
  type UserEventRow,
} from './metrics';

function fmtNumber(value: number) {
  return new Intl.NumberFormat('fr-FR').format(value);
}

function fmtDateTime(value: string) {
  return new Date(value).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function pct(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

function TrendBadge({ trend }: { trend: TrendValue }) {
  if (trend.pct === null) {
    return <span className="text-xs text-gray-400">vs 7j précédents : {trend.prev}</span>;
  }
  if (trend.pct === 0) {
    return <span className="text-xs text-gray-400">= 7j précédents ({trend.prev})</span>;
  }
  const up = trend.pct > 0;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${up ? 'text-emerald-600' : 'text-red-500'}`}>
      {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {up ? '+' : ''}{trend.pct} % vs 7j préc. ({trend.prev})
    </span>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone,
  trend,
}: {
  label: string;
  value: string;
  hint: React.ReactNode;
  icon: ElementType;
  tone: string;
  trend?: TrendValue;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
          <p className="mt-1 text-xs text-gray-500">{hint}</p>
          {trend && <div className="mt-1"><TrendBadge trend={trend} /></div>}
        </div>
        <div className={`rounded-xl p-2.5 ${tone}`}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

function BreakdownCard({
  title,
  items,
  emptyText,
}: {
  title: string;
  items: Array<{ label: string; value: number }>;
  emptyText: string;
}) {
  const total = items.reduce((sum, item) => sum + item.value, 0);

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-gray-500">{emptyText}</p>
      ) : (
        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <div key={item.label} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-gray-700">{item.label}</span>
                <span className="font-medium text-gray-900">
                  {fmtNumber(item.value)} <span className="text-xs text-gray-500">({pct(item.value, total)}%)</span>
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                <div className="h-full rounded-full bg-indigo-500" style={{ width: `${pct(item.value, total)}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function SourceMetricsTable({
  title,
  items,
}: {
  title: string;
  items: SourceMetric[];
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-500">
              <th className="pb-2 pr-4 font-semibold">Signal</th>
              <th className="pb-2 pr-4 font-semibold">7 jours</th>
              <th className="pb-2 pr-4 font-semibold">30 jours</th>
              <th className="pb-2 font-semibold">Source</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.label} className="border-b border-gray-50 align-top last:border-b-0">
                <td className="py-2 pr-4 font-medium text-gray-900">{item.label}</td>
                <td className="py-2 pr-4 text-gray-700">{item.value7d === null ? '—' : fmtNumber(item.value7d)}</td>
                <td className="py-2 pr-4 text-gray-700">{item.value30d === null ? '—' : fmtNumber(item.value30d)}</td>
                <td className="py-2 text-gray-500">{item.source}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default async function AdminAnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isAdminUser(user.id, supabase))) {
    redirect('/dashboard');
  }

  const admin = createAdminClient();
  const nowMs = Date.now();
  const last30dIso = new Date(nowMs - 30 * 24 * 60 * 60 * 1000).toISOString();
  const last14dIso = new Date(nowMs - 14 * 24 * 60 * 60 * 1000).toISOString();

  const [analytics, { data: recentUserEvents }, { data: recentCopros }, { data: recentProfiles }, { data: adminRows }, activeUsersCountResult] = await Promise.all([
    getGa4AdminAnalytics(),
    admin
      .from('user_events')
      .select('event_type, created_at, user_email, user_id')
      .in('event_type', ['user_registered', 'begin_checkout', 'trial_started', 'subscription_created', 'login_success'])
      .gte('created_at', last14dIso),
    admin
      .from('coproprietes')
      .select('created_at, syndic_id')
      .gte('created_at', last14dIso),
    admin
      .from('profiles')
      .select('id, full_name, last_active_at')
      .not('last_active_at', 'is', null)
      .gte('last_active_at', last30dIso)
      .order('last_active_at', { ascending: false })
      .limit(5000),
    admin
      .from('admin_users')
      .select('user_id'),
    admin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .not('last_active_at', 'is', null)
      .gte('last_active_at', last30dIso),
  ]);

  const activeUsersCount = activeUsersCountResult.count ?? recentProfiles?.length ?? 0;

  const {
    gaMetrics,
    internalMetrics,
    stripeMetrics,
    dashboardPageViews7d,
    dashboardPageViews30d,
    internalActive24h,
    internalActive7d,
    internalActive30d,
    internalActiveTotalCount,
    trendActive,
    trendRegistrations,
    trendOnboarding,
    trendTrials,
    trendSubscriptions,
    conversionCheckoutToTrial7d,
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
    latestActivityAt,
    latestActivityUser,
  } = buildAdminAnalyticsMetrics({
    analytics,
    recentUserEvents: (recentUserEvents ?? []) as UserEventRow[],
    recentCopros: (recentCopros ?? []) as CoproActivityRow[],
    recentProfiles: (recentProfiles ?? []) as ProfileActivityRow[],
    adminRows: (adminRows ?? []) as AdminRow[],
    activeUsersCount,
    nowMs,
  });

  return (
    <div className="space-y-6 pb-16">
      <section className="rounded-2xl border border-gray-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-5 text-white shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-200">Analytics • Admin</p>
            <h1 className="mt-1 text-2xl font-bold">KPI métier prioritaires, diagnostics par source</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-200">
              Les KPI quantifiables côté application utilisent désormais uniquement les logs internes ou Stripe. GA4 reste affiché pour l’audience web et les signaux sans équivalent fiable en base.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="https://analytics.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/15"
            >
              Ouvrir GA4 <ExternalLink size={14} />
            </Link>
            <Link
              href="https://tagmanager.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/15"
            >
              Ouvrir GTM <ExternalLink size={14} />
            </Link>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-200">
          <span className="rounded-full bg-white/10 px-2.5 py-1">Propriété : {analytics.propertyId ?? 'non configurée'}</span>
          <span className="rounded-full bg-white/10 px-2.5 py-1">Mise à jour : {fmtDateTime(analytics.fetchedAt)}</span>
          <span className="rounded-full bg-white/10 px-2.5 py-1">Latence GA4 possible : quelques minutes à 24 h</span>
          <span className="rounded-full bg-white/10 px-2.5 py-1">Pages admin non trackées</span>
        </div>
      </section>

      {!analytics.configured && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <h2 className="text-base font-semibold text-amber-900">Configuration GA4 requise</h2>
          <p className="mt-2 text-sm text-amber-800">
            Cette page est prête, mais l’accès API n’est pas encore configuré côté serveur.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-900">Variables d’environnement à ajouter</p>
              <ul className="mt-2 space-y-1 text-sm text-amber-900">
                {analytics.missingVars.map((item) => (
                  <li key={item}><code>{item}</code></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-900">Checklist</p>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-amber-800">
                <li>Créer un compte de service Google Cloud.</li>
                <li>L’ajouter en lecteur sur la propriété GA4.</li>
                <li>Renseigner l’ID de propriété et la clé privée côté serveur.</li>
              </ol>
            </div>
          </div>
        </section>
      )}

      {analytics.error && (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
          <h2 className="text-base font-semibold text-red-900">Connexion GA4 à vérifier</h2>
          <p className="mt-2 text-sm text-red-800">{analytics.error}</p>
          <p className="mt-2 text-sm text-red-700">
            Vérifie surtout l’accès “Lecteur / Analyste” du compte de service dans <strong>Admin → Gestion des accès à la propriété</strong>.
          </p>
        </section>
      )}

      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <BarChart3 size={16} className="text-indigo-600" />
          <h2 className="text-sm font-semibold text-gray-900">KPI prioritaires</h2>
        </div>
        <p className="mt-2 text-sm text-gray-600">
          Ces cartes suivent d’abord la fiabilité métier. Les parcours applicatifs viennent des logs internes, la facturation de Stripe, et GA4 n’apparaît ici que lorsqu’aucune source interne équivalente n’existe.
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Utilisateurs actifs (7 j)"
            value={fmtNumber(internalActive7d)}
            hint={<><strong>{fmtNumber(internalActive24h)}</strong> / 24 h &nbsp;·&nbsp; <strong>{fmtNumber(internalActiveTotalCount)}</strong> / 30 j &nbsp;·&nbsp; <span className="text-gray-400">logs internes</span></>}
            icon={Users}
            tone="bg-blue-50 text-blue-600"
            trend={trendActive}
          />
          <StatCard
            label="Dernière activité détectée"
            value={latestActivityAt ? fmtDateTime(latestActivityAt) : 'Aucune activité'}
            hint={latestActivityAt ? `${latestActivityUser} · logs internes` : 'Aucune activité client remontée'}
            icon={Clock3}
            tone="bg-slate-50 text-slate-700"
          />
          <StatCard
            label="Inscriptions (7 j)"
            value={fmtNumber(internalRegistrations7d)}
            hint={<><strong>{fmtNumber(internalRegistrations24h)}</strong> / 24 h &nbsp;·&nbsp; <strong>{fmtNumber(internalRegistrations30d)}</strong> / 30 j &nbsp;·&nbsp; <span className="text-gray-400">logs internes</span></>}
            icon={UserPlus}
            tone="bg-indigo-50 text-indigo-600"
            trend={trendRegistrations}
          />
          <StatCard
            label="Connexions formulaire (7 j)"
            value={fmtNumber(internalLoginForms7d)}
            hint={<><strong>{fmtNumber(internalLoginForms24h)}</strong> / 24 h &nbsp;·&nbsp; <strong>{fmtNumber(internalLoginForms30d)}</strong> / 30 j &nbsp;·&nbsp; <span className="text-gray-400">logs internes</span></>}
            icon={Activity}
            tone="bg-violet-50 text-violet-600"
          />
          <StatCard
            label="Checkouts applicatifs (7 j)"
            value={fmtNumber(internalCheckouts7d)}
            hint={<><strong>{fmtNumber(internalCheckouts24h)}</strong> / 24 h &nbsp;·&nbsp; <strong>{fmtNumber(internalCheckouts30d)}</strong> / 30 j &nbsp;·&nbsp; <span className="text-gray-400">logs internes</span></>}
            icon={MousePointerClick}
            tone="bg-amber-50 text-amber-600"
          />
          <StatCard
            label="Copros créées (7 j)"
            value={fmtNumber(internalOnboarding7d)}
            hint={<><strong>{fmtNumber(internalOnboarding24h)}</strong> / 24 h &nbsp;·&nbsp; <strong>{fmtNumber(internalOnboarding30d)}</strong> / 30 j &nbsp;·&nbsp; <span className="text-gray-400">logs internes</span></>}
            icon={Building2}
            tone="bg-teal-50 text-teal-600"
            trend={trendOnboarding}
          />
          <StatCard
            label="Essais démarrés (7 j)"
            value={fmtNumber(stripeTrials7d)}
            hint={<><strong>{fmtNumber(stripeTrials24h)}</strong> / 24 h &nbsp;·&nbsp; <strong>{fmtNumber(stripeTrials30d)}</strong> / 30 j &nbsp;·&nbsp; <span className="text-gray-400">Stripe</span></>}
            icon={ShoppingCart}
            tone="bg-rose-50 text-rose-600"
            trend={trendTrials}
          />
          <StatCard
            label="Abonnements activés (7 j)"
            value={fmtNumber(stripeSubscriptions7d)}
            hint={<><strong>{fmtNumber(stripeSubscriptions24h)}</strong> / 24 h &nbsp;·&nbsp; <strong>{fmtNumber(stripeSubscriptions30d)}</strong> / 30 j &nbsp;·&nbsp; <span className="text-gray-400">Stripe</span></>}
            icon={ShieldCheck}
            tone="bg-emerald-50 text-emerald-600"
            trend={trendSubscriptions}
          />
        </div>
      </section>

      {/* Funnel conversion */}
      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <MousePointerClick size={16} className="text-indigo-600" />
          <h2 className="text-sm font-semibold text-gray-900">Funnel billing — 7 jours</h2>
        </div>
        <p className="mt-1 text-xs text-gray-500">Sources internes + Stripe · les étapes sont indépendantes, pas un entonnoir strict.</p>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
          <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-center">
            <p className="text-lg font-bold text-gray-900">{fmtNumber(internalCheckouts7d)}</p>
            <p className="text-xs text-gray-500">Checkouts</p>
          </div>
          <span className="text-gray-300">→</span>
          <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-center">
            <p className="text-lg font-bold text-rose-700">{fmtNumber(stripeTrials7d)}</p>
            <p className="text-xs text-rose-500">Essais</p>
          </div>
          <span className="text-gray-300">→</span>
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-center">
            <p className="text-lg font-bold text-emerald-700">{fmtNumber(stripeSubscriptions7d)}</p>
            <p className="text-xs text-emerald-500">Abonnements</p>
          </div>
          {conversionCheckoutToTrial7d !== null && (
            <div className="ml-2 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-center">
              <p className="text-lg font-bold text-indigo-700">{conversionCheckoutToTrial7d} %</p>
              <p className="text-xs text-indigo-500">Checkout → Essai</p>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <BarChart3 size={16} className="text-indigo-600" />
          <h2 className="text-sm font-semibold text-gray-900">Audience web et signaux GA4</h2>
        </div>
        <p className="mt-2 text-sm text-gray-600">
          Ce bloc ne garde que les signaux où GA4 reste utile: audience web, pages vues, sessions et vues dashboard. Les KPI métier quantifiables en base sont sortis de ce bloc.
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Utilisateurs actifs web (7 j)"
            value={fmtNumber(analytics.last7d.activeUsers)}
            hint={`${fmtNumber(analytics.last30d.activeUsers)} sur 30 jours · GA4`}
            icon={Users}
            tone="bg-blue-50 text-blue-600"
          />
          <StatCard
            label="Sessions web (7 j)"
            value={fmtNumber(analytics.last7d.sessions)}
            hint={`${fmtNumber(analytics.last30d.sessions)} sur 30 jours · GA4`}
            icon={Activity}
            tone="bg-violet-50 text-violet-600"
          />
          <StatCard
            label="Pages vues web (7 j)"
            value={fmtNumber(analytics.last7d.pageViews)}
            hint={`${fmtNumber(analytics.last30d.pageViews)} sur 30 jours · GA4`}
            icon={Eye}
            tone="bg-emerald-50 text-emerald-600"
          />
          <StatCard
            label="Pages dashboard GA4 (7 j)"
            value={fmtNumber(dashboardPageViews7d)}
            hint={`${fmtNumber(dashboardPageViews30d)} sur 30 jours · dashboard_page_view`}
            icon={Eye}
            tone="bg-sky-50 text-sky-600"
          />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {analytics.consentStates.length > 0 && (
          <BreakdownCard
            title="Répartition consent_state"
            items={analytics.consentStates}
            emptyText="La dimension personnalisée consent_state n’est pas encore disponible dans GA4."
          />
        )}
        <BreakdownCard
          title="Type d’appareil"
          items={analytics.deviceCategories}
          emptyText="GA4 ne renvoie pas encore la dimension deviceCategory pour cette propriété."
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <BarChart3 size={16} className="text-indigo-600" />
            <h2 className="text-sm font-semibold text-gray-900">Top pages (30 jours)</h2>
          </div>

          {analytics.topPages.length === 0 ? (
            <p className="text-sm text-gray-500">Aucune page n’a encore été remontée par GA4.</p>
          ) : (
            <div className="space-y-3">
              {analytics.topPages.map((page) => (
                <div key={`${page.path}-${page.title}`} className="rounded-xl border border-gray-100 px-3 py-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">{page.title}</p>
                      <p className="truncate text-xs text-gray-500">{page.path}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold text-gray-900">{fmtNumber(page.views)}</p>
                      <p className="text-[11px] text-gray-500">{fmtNumber(page.users)} utilisateurs</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Activity size={16} className="text-indigo-600" />
            <h2 className="text-sm font-semibold text-gray-900">Top pages dashboard suivies (30 jours)</h2>
          </div>

          {analytics.internalPlatformPages.length === 0 ? (
            <p className="text-sm text-gray-500">
              Aucune page dashboard détaillée disponible. Vérifie que les dimensions GA4 `platform_area` et `platform_path` sont bien enregistrées.
            </p>
          ) : (
            <div className="space-y-3">
              {analytics.internalPlatformPages.map((page) => (
                <div key={`${page.area}-${page.path}`} className="rounded-xl border border-gray-100 px-3 py-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900">{page.path}</p>
                      <p className="text-xs text-gray-500">{page.area}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold text-gray-900">{fmtNumber(page.views)}</p>
                      <p className="text-[11px] text-gray-500">événements</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <SourceMetricsTable title="Diagnostic GA4 brut" items={gaMetrics} />
        <SourceMetricsTable title="Lecture applicative brute" items={internalMetrics} />
        <SourceMetricsTable title="Lecture Stripe brute" items={stripeMetrics} />

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Cookie size={16} className="text-indigo-600" />
            <h2 className="text-sm font-semibold text-gray-900">Top événements custom (30 jours)</h2>
          </div>

          {analytics.topEvents.length === 0 ? (
            <p className="text-sm text-gray-500">Aucun événement custom détecté pour le moment.</p>
          ) : (
            <div className="space-y-3">
              {analytics.topEvents.map((event) => (
                <div key={event.name} className="flex items-center justify-between rounded-xl border border-gray-100 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">{event.name}</p>
                    <p className="text-[11px] text-gray-500">Événement mesuré dans GTM / GA4</p>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{fmtNumber(event.count)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

    </div>
  );
}