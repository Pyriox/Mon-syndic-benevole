import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AlertTriangle, ArrowRight, ExternalLink, RefreshCw, TrendingUp, Wallet } from 'lucide-react';

import AdminStatCard from '../AdminStatCard';
import { isAdminUser } from '@/lib/admin-config';
import { buildEstimatedRevenueMetrics, countActiveAddonCopros } from '@/lib/admin-dashboard';
import { formatAdminCurrency, formatAdminDate } from '@/lib/admin-format';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

type SubscriptionCoproRow = {
  id: string;
  nom: string;
  plan: string | null;
  plan_id: string | null;
  plan_period_end: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
};

export default async function AdminAbonnementsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !(await isAdminUser(user.id, supabase))) {
    redirect('/dashboard');
  }

  const admin = createAdminClient();
  const [{ data }, { data: coproAddons }] = await Promise.all([
    admin
      .from('coproprietes')
      .select('id, nom, plan, plan_id, plan_period_end, stripe_customer_id, stripe_subscription_id, created_at')
      .order('created_at', { ascending: false }),
    admin
      .from('copro_addons')
      .select('copropriete_id, addon_key, status, current_period_end, cancel_at_period_end')
      .eq('addon_key', 'charges_speciales'),
  ]);

  const copros = (data ?? []) as SubscriptionCoproRow[];
  const activeCount = copros.filter((copro) => copro.plan === 'actif').length;
  const pastDueCount = copros.filter((copro) => copro.plan === 'passe_du').length;

  const planBreakdown: Record<string, number> = { essentiel: 0, confort: 0, illimite: 0 };
  for (const copro of copros) {
    if (copro.plan === 'actif' && copro.plan_id) {
      planBreakdown[copro.plan_id] = (planBreakdown[copro.plan_id] ?? 0) + 1;
    }
  }

  const revenueMetrics = buildEstimatedRevenueMetrics(planBreakdown, coproAddons ?? []);
  const mrr = revenueMetrics.totalMrr;
  const arr = revenueMetrics.totalArr;
  const nbChargesSpecialesActives = countActiveAddonCopros(coproAddons ?? []);

  const nowIso = new Date().toISOString();
  const in14d = new Date(new Date(nowIso).getTime() + 14 * 86400000).toISOString();
  const upcomingRenewals = copros
    .filter((copro) => copro.plan === 'actif' && copro.plan_period_end && copro.plan_period_end >= nowIso && copro.plan_period_end <= in14d)
    .sort((a, b) => (a.plan_period_end ?? '').localeCompare(b.plan_period_end ?? ''));

  const atRisk = copros.filter((copro) => (
    copro.plan === 'passe_du' ||
    (copro.plan === 'actif' && (!copro.stripe_customer_id || !copro.stripe_subscription_id))
  ));

  const watchList = [
    ...atRisk.map((copro) => ({
      id: copro.id,
      nom: copro.nom,
      reason: copro.plan === 'passe_du' ? 'Paiement échoué / passé dû' : 'Référence Stripe incomplète',
      date: copro.plan_period_end,
    })),
    ...upcomingRenewals
      .filter((copro) => !atRisk.some((item) => item.id === copro.id))
      .map((copro) => ({
        id: copro.id,
        nom: copro.nom,
        reason: 'Renouvellement sous 14 jours',
        date: copro.plan_period_end,
      })),
  ].slice(0, 6);

  return (
    <div className="space-y-6 pb-16">
      <section className="rounded-2xl border border-gray-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-5 text-white shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">Admin finance</p>
            <h1 className="mt-1 text-2xl font-bold">Abonnements & revenus</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-200">
              La gestion détaillée est désormais centralisée dans <strong>Copropriétés → Abonnements</strong>. Cette page sert de lecture rapide
              pour le revenu estimé et les dossiers à surveiller.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/coproprietes?tab=abonnements"
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/15"
            >
              Ouvrir la vue détaillée <ArrowRight size={14} />
            </Link>
            <Link
              href="https://dashboard.stripe.com"
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/15"
            >
              Ouvrir Stripe <ExternalLink size={14} />
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="MRR total estimé"
          value={formatAdminCurrency(mrr)}
          sub={`${formatAdminCurrency(arr)} d’ARR total estimé · abonnements + options${nbChargesSpecialesActives > 0 ? ` · ${nbChargesSpecialesActives} option${nbChargesSpecialesActives > 1 ? 's' : ''} active${nbChargesSpecialesActives > 1 ? 's' : ''}` : ''}`}
          icon={Wallet}
          color="bg-emerald-50 text-emerald-600"
        />
        <AdminStatCard
          label="Copros actives"
          value={activeCount}
          sub="Plans actifs actuellement détectés"
          icon={TrendingUp}
          color="bg-blue-50 text-blue-600"
        />
        <AdminStatCard
          label="Renouvellements < 14 j"
          value={upcomingRenewals.length}
          sub="À anticiper côté relation client"
          icon={RefreshCw}
          color="bg-amber-50 text-amber-600"
        />
        <AdminStatCard
          label="À risque"
          value={atRisk.length}
          sub={`${pastDueCount} en passé dû ou sync Stripe incomplète`}
          icon={AlertTriangle}
          color="bg-red-50 text-red-600"
          danger={atRisk.length > 0}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900">Actions rapides</h2>
          <div className="mt-4 space-y-2 text-sm">
            <Link href="/admin/coproprietes?tab=abonnements" className="flex items-center justify-between rounded-xl border border-gray-200 px-3 py-2.5 hover:bg-gray-50">
              <span>Voir tous les abonnements</span>
              <ArrowRight size={14} className="text-gray-400" />
            </Link>
            <Link href="/admin/coproprietes?tab=abonnements&plan=passe_du" className="flex items-center justify-between rounded-xl border border-red-200 px-3 py-2.5 hover:bg-red-50/50">
              <span>Ouvrir les dossiers passés dus</span>
              <ArrowRight size={14} className="text-red-500" />
            </Link>
            <Link href="/admin/coproprietes?tab=abonnements&plan=actif&sort=renewal&order=asc" className="flex items-center justify-between rounded-xl border border-amber-200 px-3 py-2.5 hover:bg-amber-50/50">
              <span>Trier les renouvellements imminents</span>
              <ArrowRight size={14} className="text-amber-500" />
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900">Copropriétés à surveiller</h2>
          {watchList.length === 0 ? (
            <p className="mt-3 text-sm text-gray-500">Aucun signal critique détecté pour l’instant.</p>
          ) : (
            <div className="mt-4 space-y-2">
              {watchList.map((item) => (
                <Link key={`${item.id}-${item.reason}`} href={`/admin/coproprietes/${item.id}`} className="block rounded-xl border border-gray-200 px-3 py-2.5 hover:bg-gray-50">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.nom}</p>
                      <p className="text-xs text-gray-600">{item.reason}</p>
                    </div>
                    <span className="text-xs text-gray-500 whitespace-nowrap">{formatAdminDate(item.date)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
