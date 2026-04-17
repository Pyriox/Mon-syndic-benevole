import type { ElementType } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  Activity,
  BarChart3,
  Clock3,
  Cookie,
  ExternalLink,
  Eye,
  MousePointerClick,
  ShieldCheck,
  ShoppingCart,
  UserPlus,
  Users,
} from 'lucide-react';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAdminUser } from '@/lib/admin-config';
import { getGa4AdminAnalytics } from '@/lib/ga4-admin';

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

function countSince<T extends { created_at?: string | null }>(items: T[], sinceMs: number) {
  return items.reduce((sum, item) => {
    const parsed = item.created_at ? Date.parse(item.created_at) : Number.NaN;
    return Number.isFinite(parsed) && parsed >= sinceMs ? sum + 1 : sum;
  }, 0);
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  icon: ElementType;
  tone: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
          <p className="mt-1 text-xs text-gray-500">{hint}</p>
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
              <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full rounded-full bg-indigo-500" style={{ width: `${pct(item.value, total)}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default async function AdminAnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !(await isAdminUser(user.id, supabase))) {
    redirect('/dashboard');
  }

  const analytics = await getGa4AdminAnalytics();
  const admin = createAdminClient();
  const snapshotMs = Date.parse(analytics.fetchedAt);
  const nowMs = Number.isFinite(snapshotMs) ? snapshotMs : 0;
  const last7dMs = nowMs - 7 * 24 * 60 * 60 * 1000;
  const last30dIso = new Date(nowMs - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: recentUserEvents }, { data: recentCopros }] = await Promise.all([
    admin
      .from('user_events')
      .select('event_type, created_at')
      .in('event_type', ['user_registered', 'account_confirmed', 'begin_checkout', 'trial_started', 'subscription_created'])
      .gte('created_at', last30dIso),
    admin
      .from('coproprietes')
      .select('created_at')
      .gte('created_at', last30dIso),
  ]);

  const gaSignUps7d =
    (analytics.businessEvents7d.sign_up ?? 0) +
    (analytics.businessEvents7d.sign_up_anonymous ?? 0);
  const gaSignUps30d =
    (analytics.businessEvents30d.sign_up ?? 0) +
    (analytics.businessEvents30d.sign_up_anonymous ?? 0);
  const gaCheckouts7d = analytics.businessEvents7d.begin_checkout ?? 0;
  const gaCheckouts30d = analytics.businessEvents30d.begin_checkout ?? 0;
  const gaPurchases7d = analytics.businessEvents7d.purchase ?? 0;
  const gaPurchases30d = analytics.businessEvents30d.purchase ?? 0;
  const logins7d =
    (analytics.businessEvents7d.login ?? 0) +
    (analytics.businessEvents7d.login_anonymous ?? 0);
  const logins30d =
    (analytics.businessEvents30d.login ?? 0) +
    (analytics.businessEvents30d.login_anonymous ?? 0);
  const gaOnboardingComplete7d = analytics.businessEvents7d.onboarding_complete ?? 0;
  const gaOnboardingComplete30d = analytics.businessEvents30d.onboarding_complete ?? 0;

  const registrationEvents = (recentUserEvents ?? []).filter((event) => event.event_type === 'user_registered');
  const purchaseLikeEvents = (recentUserEvents ?? []).filter((event) => (
    event.event_type === 'trial_started' || event.event_type === 'subscription_created'
  ));
  const checkoutEvents = (recentUserEvents ?? []).filter((event) => event.event_type === 'begin_checkout');

  const internalSignUps30d = registrationEvents.length;
  const internalSignUps7d = countSince(registrationEvents, last7dMs);
  const internalPurchases30d = purchaseLikeEvents.length;
  const internalPurchases7d = countSince(purchaseLikeEvents, last7dMs);
  const internalCheckouts30d = Math.max(checkoutEvents.length, internalPurchases30d);
  const internalCheckouts7d = Math.max(countSince(checkoutEvents, last7dMs), internalPurchases7d);
  const internalOnboarding30d = (recentCopros ?? []).length;
  const internalOnboarding7d = countSince(recentCopros ?? [], last7dMs);

  const signUps7d = Math.max(gaSignUps7d, internalSignUps7d);
  const signUps30d = Math.max(gaSignUps30d, internalSignUps30d);
  const checkouts7d = Math.max(gaCheckouts7d, internalCheckouts7d);
  const checkouts30d = Math.max(gaCheckouts30d, internalCheckouts30d);
  const purchases7d = Math.max(gaPurchases7d, internalPurchases7d);
  const purchases30d = Math.max(gaPurchases30d, internalPurchases30d);
  const onboardingComplete7d = Math.max(gaOnboardingComplete7d, internalOnboarding7d);
  const onboardingComplete30d = Math.max(gaOnboardingComplete30d, internalOnboarding30d);
  const usingBusinessFallback = (
    signUps7d > gaSignUps7d ||
    signUps30d > gaSignUps30d ||
    checkouts7d > gaCheckouts7d ||
    checkouts30d > gaCheckouts30d ||
    purchases7d > gaPurchases7d ||
    purchases30d > gaPurchases30d ||
    onboardingComplete7d > gaOnboardingComplete7d ||
    onboardingComplete30d > gaOnboardingComplete30d
  );
  const audienceSourceLabel = analytics.configured && !analytics.error ? 'GA4 direct' : 'GA4 à vérifier';
  const businessSourceLabel = !analytics.configured
    ? 'Fallback interne + Stripe'
    : usingBusinessFallback
      ? 'GA4 + logs internes / Stripe'
      : 'GA4 direct';
  const businessSourceNote = !analytics.configured
    ? 'Les chiffres business restent visibles grâce aux événements applicatifs et à Stripe, même sans connexion GA4.'
    : usingBusinessFallback
      ? 'Les événements métier utilisent la meilleure valeur disponible entre GA4, les logs internes et Stripe pour éviter les faux zéros.'
      : 'Sur la période récente, GA4 couvre déjà correctement les événements métier sans correction supplémentaire.';

  return (
    <div className="space-y-6 pb-16">
      <section className="rounded-2xl border border-gray-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-5 text-white shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-200">GA4 • Admin</p>
            <h1 className="mt-1 text-2xl font-bold">Audience, conversions & consentement</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-200">
              Vue synthétique des chiffres marketing utiles directement dans l’admin, sans quitter l’app.
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

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Source audience</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">{audienceSourceLabel}</p>
          <p className="mt-1 text-sm text-gray-600">
            Utilisateurs, sessions et pages vues proviennent exclusivement de la propriété Google Analytics 4.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Source KPI business</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">{businessSourceLabel}</p>
          <p className="mt-1 text-sm text-gray-600">{businessSourceNote}</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Clock3 size={16} className="text-indigo-600" />
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Fraîcheur</p>
          </div>
          <p className="mt-1 text-lg font-semibold text-gray-900">{fmtDateTime(analytics.fetchedAt)}</p>
          <p className="mt-1 text-sm text-gray-600">
            Dernier snapshot serveur. GA4 peut avoir quelques minutes à 24 h de latence selon les événements.
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Utilisateurs actifs (7 j)"
          value={fmtNumber(analytics.last7d.activeUsers)}
          hint={`${fmtNumber(analytics.last30d.activeUsers)} sur 30 jours · source GA4`}
          icon={Users}
          tone="bg-blue-50 text-blue-600"
        />
        <StatCard
          label="Sessions (7 j)"
          value={fmtNumber(analytics.last7d.sessions)}
          hint={`${fmtNumber(analytics.last30d.sessions)} sur 30 jours · source GA4`}
          icon={Activity}
          tone="bg-violet-50 text-violet-600"
        />
        <StatCard
          label="Pages vues (7 j)"
          value={fmtNumber(analytics.last7d.pageViews)}
          hint={`${fmtNumber(analytics.last30d.pageViews)} sur 30 jours · source GA4`}
          icon={Eye}
          tone="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          label="Inscriptions (7 j)"
          value={fmtNumber(signUps7d)}
          hint={`${fmtNumber(signUps30d)} sur 30 jours · ${pct(signUps7d, analytics.last7d.activeUsers)}% des actifs 7 j · source ${businessSourceLabel}`}
          icon={UserPlus}
          tone="bg-indigo-50 text-indigo-600"
        />
        <StatCard
          label="Débuts de checkout (7 j)"
          value={fmtNumber(checkouts7d)}
          hint={`${fmtNumber(checkouts30d)} sur 30 jours · ${fmtNumber(purchases7d)} achats sur 7 j · source ${businessSourceLabel}`}
          icon={MousePointerClick}
          tone="bg-amber-50 text-amber-600"
        />
        <StatCard
          label="Achats / conversions (7 j)"
          value={fmtNumber(purchases7d)}
          hint={checkouts7d > 0 ? `${fmtNumber(purchases30d)} sur 30 jours · ${pct(purchases7d, checkouts7d)}% de conversion 7 j · source ${businessSourceLabel}` : `${fmtNumber(purchases30d)} sur 30 jours · aucun checkout sur 7 j · source ${businessSourceLabel}`}
          icon={ShoppingCart}
          tone="bg-rose-50 text-rose-600"
        />
      </section>

      {usingBusinessFallback && (
        <section className="rounded-2xl border border-sky-200 bg-sky-50 p-4 shadow-sm">
          <p className="text-sm text-sky-900">
            Les cartes <strong>Inscription</strong>, <strong>Onboarding</strong>, <strong>Begin checkout</strong> et <strong>Purchase</strong>
            utilisent aussi les logs internes de l’app (et Stripe pour la facturation) pour éviter les faux zéros quand GA4 ne remonte pas
            encore certains événements métier.
          </p>
        </section>
      )}

      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <BarChart3 size={16} className="text-indigo-600" />
          <h2 className="text-sm font-semibold text-gray-900">Contrôle source KPI business (7 jours)</h2>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Inscriptions', ga: gaSignUps7d, internal: internalSignUps7d, retained: signUps7d },
            { label: 'Checkout', ga: gaCheckouts7d, internal: internalCheckouts7d, retained: checkouts7d },
            { label: 'Achats', ga: gaPurchases7d, internal: internalPurchases7d, retained: purchases7d },
            { label: 'Onboarding', ga: gaOnboardingComplete7d, internal: internalOnboarding7d, retained: onboardingComplete7d },
          ].map((item) => (
            <div key={item.label} className="rounded-xl bg-gray-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{item.label}</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">{fmtNumber(item.retained)}</p>
              <p className="mt-1 text-xs text-gray-600">
                GA4 {fmtNumber(item.ga)} · interne {fmtNumber(item.internal)}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-gray-500">
          Valeur retenue dans l’admin = maximum disponible entre GA4 et les données internes / Stripe sur la même période.
        </p>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm xl:col-span-1">
          <h2 className="text-sm font-semibold text-gray-900">Événements business utiles</h2>
          <div className="mt-4 space-y-3">
            {[
              { label: 'Connexion', value7d: logins7d, value30d: logins30d },
              { label: 'Onboarding / copro créée', value7d: onboardingComplete7d, value30d: onboardingComplete30d },
              { label: 'Sign up', value7d: signUps7d, value30d: signUps30d },
              { label: 'Begin checkout', value7d: checkouts7d, value30d: checkouts30d },
              { label: 'Purchase', value7d: purchases7d, value30d: purchases30d },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2">
                <span className="text-sm text-gray-700">{item.label}</span>
                <span className="text-right text-sm font-semibold text-gray-900">
                  {fmtNumber(item.value7d)}
                  <span className="block text-[11px] font-normal text-gray-500">{fmtNumber(item.value30d)} sur 30 j</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="xl:col-span-2 grid gap-4 md:grid-cols-2">
          <BreakdownCard
            title="Répartition `consent_state`"
            items={analytics.consentStates}
            emptyText="La dimension personnalisée `consent_state` n’est pas encore disponible dans GA4."
          />
          <BreakdownCard
            title="Type d’appareil"
            items={analytics.deviceCategories}
            emptyText="GA4 ne renvoie pas encore la dimension `deviceCategory` pour cette propriété."
          />
        </div>
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

      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-indigo-600" />
          <h2 className="text-sm font-semibold text-gray-900">Notes de lecture</h2>
        </div>
        <ul className="mt-3 space-y-1.5 text-sm text-gray-600">
          {analytics.notes.map((note) => (
            <li key={note}>• {note}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
