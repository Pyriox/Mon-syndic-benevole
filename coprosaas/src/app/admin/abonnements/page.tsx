// ============================================================
// Admin — Abonnements (lecture seule + sync Stripe)
// Modification de plan : dashboard Stripe directement,
// puis "Sync depuis Stripe" dans les actions.
// ============================================================
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AdminCoproActions from '../AdminCoproActions';
import { stripe } from '@/lib/stripe';
import {
  CreditCard, TrendingUp, Banknote, BarChart3, Clock,
  CheckCircle2, XCircle, ExternalLink,
} from 'lucide-react';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'tpn.fabien@gmail.com';
const MRR_PRICES: Record<string, number> = { essentiel: 25, confort: 30, illimite: 45 };
const ARR_PRICES: Record<string, number> = { essentiel: 300, confort: 360, illimite: 540 };

function fmtEur(n: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}
function fmtDate(s: string | null | undefined): string {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function PlanBadge({ plan, planId }: { plan: string | null; planId: string | null }) {
  if (plan === 'actif') {
    const cfg: Record<string, { label: string; cls: string }> = {
      essentiel: { label: 'Essentiel', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
      confort:   { label: 'Confort',   cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
      illimite:  { label: 'Illimité',  cls: 'bg-purple-50 text-purple-700 border-purple-200' },
    };
    const c = cfg[planId ?? ''] ?? { label: 'Actif', cls: 'bg-green-50 text-green-700 border-green-200' };
    return <span className={`inline-flex text-xs px-2 py-0.5 rounded-md font-medium border ${c.cls}`}>{c.label}</span>;
  }
  if (plan === 'passe_du') return <span className="inline-flex text-xs px-2 py-0.5 rounded-md font-medium bg-red-50 text-red-600 border border-red-200">Impayé</span>;
  if (plan === 'inactif')  return <span className="inline-flex text-xs px-2 py-0.5 rounded-md font-medium bg-gray-100 text-gray-500 border border-gray-200">Inactif</span>;
  return <span className="inline-flex text-xs px-2 py-0.5 rounded-md font-medium bg-amber-50 text-amber-700 border border-amber-200">Essai</span>;
}

export default async function AdminAbonnementsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) redirect('/dashboard');

  const admin = createAdminClient();
  const { data: coproprietes } = await admin
    .from('coproprietes')
    .select('id, nom, plan, plan_id, stripe_subscription_id, stripe_customer_id, plan_period_end, created_at, profiles!coproprietes_syndic_id_fkey(email)')
    .order('plan', { ascending: false })
    .order('created_at', { ascending: false });

  // Stripe (non-blocking)
  type StripeCharge = { id: string; amount: number; status: string; created: number; customerId: string | null; description: string | null };
  let stripeCharges: StripeCharge[] = [];
  try {
    const list = await stripe.charges.list({ limit: 50 });
    stripeCharges = list.data.map((c) => ({
      id: c.id,
      amount: c.amount / 100,
      status: c.status,
      created: c.created,
      customerId: typeof c.customer === 'string' ? c.customer : null,
      description: c.description ?? null,
    }));
  } catch { /* non-blocking */ }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const coprosTyped = (coproprietes ?? []) as any[];
  const nbActifs  = coprosTyped.filter((c) => c.plan === 'actif').length;
  const nbEssai   = coprosTyped.filter((c) => !c.plan || c.plan === 'essai').length;
  const nbInactif = coprosTyped.filter((c) => c.plan === 'inactif').length;
  const nbPasseDu = coprosTyped.filter((c) => c.plan === 'passe_du').length;
  const planBreakdown: Record<string, number> = { essentiel: 0, confort: 0, illimite: 0 };
  for (const c of coprosTyped) {
    if (c.plan === 'actif' && c.plan_id) planBreakdown[c.plan_id] = (planBreakdown[c.plan_id] ?? 0) + 1;
  }
  const mrr = Object.entries(planBreakdown).reduce((sum, [id, nb]) => sum + (MRR_PRICES[id] ?? 0) * nb, 0);
  const arr = Object.entries(planBreakdown).reduce((sum, [id, nb]) => sum + (ARR_PRICES[id] ?? 0) * nb, 0);
  const conversionPct = coprosTyped.length > 0 ? Math.round((nbActifs / coprosTyped.length) * 100) : 0;

  const in14d = new Date(Date.now() + 14 * 86400000).toISOString();
  const upcomingRenewals = coprosTyped.filter((c) =>
    c.plan === 'actif' && c.plan_period_end && c.plan_period_end >= new Date().toISOString() && c.plan_period_end <= in14d
  );

  const customerToCopro: Record<string, string> = {};
  for (const c of coprosTyped) {
    if (c.stripe_customer_id) customerToCopro[c.stripe_customer_id] = c.nom;
  }

  void fmtDate; // used in JSX template strings

  return (
    <div className="space-y-8 pb-16">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Abonnements</h1>
        <p className="text-sm text-gray-500 mt-1">
          Données Supabase + Stripe. Lecture seule — pour modifier un abonnement, utiliser le dashboard Stripe directement puis « Sync depuis Stripe ».
        </p>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {([
          { label: 'MRR',              value: fmtEur(mrr),   sub: `ARR : ${fmtEur(arr)}`,              icon: Banknote,   color: 'bg-emerald-100 text-emerald-600' },
          { label: 'Abonnés actifs',  value: nbActifs,      sub: `taux conv. ${conversionPct} %`,     icon: CreditCard, color: 'bg-blue-100 text-blue-600' },
          { label: 'Trials',           value: nbEssai,       sub: 'Essai gratuit',                         icon: TrendingUp, color: 'bg-amber-100 text-amber-600' },
          { label: 'Impayés/Inactifs',value: nbPasseDu + nbInactif, sub: `${nbPasseDu} impayés · ${nbInactif} inactifs`, icon: BarChart3, color: nbPasseDu > 0 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-400' },
        ] as { label: string; value: string | number; sub: string; icon: React.ElementType; color: string }[]).map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-start gap-4">
            <div className={`p-3 rounded-xl ${color} shrink-0`}><Icon size={18} /></div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
              <p className="text-xs text-gray-400">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Répartition plans + renouvellements ── */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <p className="text-sm font-semibold text-gray-800 mb-4">Répartition des plans actifs</p>
          <div className="space-y-4">
            {([
              { id: 'essentiel', label: 'Essentiel', price: '25 €/mois', color: 'bg-blue-500',   textColor: 'text-blue-700' },
              { id: 'confort',   label: 'Confort',   price: '30 €/mois', color: 'bg-indigo-500', textColor: 'text-indigo-700' },
              { id: 'illimite',  label: 'Illimité',  price: '45 €/mois', color: 'bg-purple-500', textColor: 'text-purple-700' },
            ] as const).map(({ id, label, price, color, textColor }) => {
              const nb = planBreakdown[id] ?? 0;
              const pct = nbActifs > 0 ? Math.round((nb / nbActifs) * 100) : 0;
              const revenue = nb * ARR_PRICES[id];
              return (
                <div key={id}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
                      <span className={`font-semibold ${textColor}`}>{label}</span>
                      <span className="text-gray-400 text-xs">· {price}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">{fmtEur(revenue)}/an</span>
                      <span className="font-bold text-gray-800">{nb}</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-4 gap-2 text-center text-xs">
            <div><p className="font-bold text-amber-700">{nbEssai}</p><p className="text-amber-600">Essai</p></div>
            <div><p className="font-bold text-green-700">{nbActifs}</p><p className="text-green-600">Actifs</p></div>
            <div><p className="font-bold text-gray-500">{nbInactif}</p><p className="text-gray-400">Inactifs</p></div>
            <div><p className="font-bold text-red-600">{nbPasseDu}</p><p className="text-red-500">Impayés</p></div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <p className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Clock size={14} className="text-amber-500" />
            Renouvellements &lt; 14 jours
            {upcomingRenewals.length > 0 && (
              <span className="ml-auto text-xs bg-amber-100 text-amber-700 rounded-full px-2 py-0.5 font-semibold">{upcomingRenewals.length}</span>
            )}
          </p>
          {upcomingRenewals.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">Aucun renouvellement imminent</p>
          ) : (
            <div className="space-y-2">
              {upcomingRenewals.map((c) => (
                <div key={c.id} className="flex items-center justify-between bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{c.nom}</p>
                    <PlanBadge plan={c.plan} planId={c.plan_id} />
                  </div>
                  <p className="text-xs font-semibold text-amber-700">{fmtDate(c.plan_period_end)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Table abonnements ── */}
      <section>
        <div className="flex items-center justify-between mb-3 gap-3">
          <div>
            <p className="text-sm font-semibold text-gray-900">Tous les abonnements</p>
            <p className="text-xs text-gray-400">
              Modification de plan : via le dashboard Stripe uniquement, puis « Sync depuis Stripe » dans les actions.
            </p>
          </div>
          <a href="https://dashboard.stripe.com/subscriptions" target="_blank" rel="noopener noreferrer"
            className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 shrink-0">
            Ouvrir Stripe <ExternalLink size={11} />
          </a>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Copropriété</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Syndic</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Plan</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Renouvellement</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden xl:table-cell">ID Stripe sub.</th>
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {coprosTyped.map((c) => {
                const profile = c.profiles as { email?: string } | null;
                const isLate = c.plan === 'passe_du';
                return (
                  <tr key={c.id} className={`hover:bg-gray-50 transition-colors ${isLate ? 'bg-red-50/30' : ''}`}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{c.nom}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 hidden md:table-cell truncate max-w-[180px]">
                      {profile?.email ?? '—'}
                    </td>
                    <td className="px-4 py-3"><PlanBadge plan={c.plan} planId={c.plan_id} /></td>
                    <td className="px-4 py-3 text-xs text-gray-600 hidden lg:table-cell">
                      {c.plan_period_end ? fmtDate(c.plan_period_end) : '—'}
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      {c.stripe_subscription_id ? (
                        <a href={`https://dashboard.stripe.com/subscriptions/${c.stripe_subscription_id}`}
                          target="_blank" rel="noopener noreferrer"
                          className="text-xs font-mono text-indigo-500 hover:text-indigo-700">
                          {c.stripe_subscription_id.slice(0, 20)}…
                        </a>
                      ) : <span className="text-xs text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <AdminCoproActions coproId={c.id} coproNom={c.nom} currentPlan={c.plan ?? 'essai'} currentPlanId={c.plan_id ?? null} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Paiements Stripe ── */}
      <section>
        <div className="flex items-center justify-between mb-3 gap-3">
          <div>
            <p className="text-sm font-semibold text-gray-900">Derniers paiements Stripe</p>
            <p className="text-xs text-gray-400">50 les plus récents — données en lecture seule.</p>
          </div>
          <a href="https://dashboard.stripe.com/payments" target="_blank" rel="noopener noreferrer"
            className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 shrink-0">
            Voir tous <ExternalLink size={11} />
          </a>
        </div>
        {stripeCharges.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
            <p className="text-sm text-gray-400">Aucun paiement ou Stripe non configuré</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">ID Stripe</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Copropriété</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Montant</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stripeCharges.map((ch) => {
                  const coproNom = ch.customerId ? (customerToCopro[ch.customerId] ?? null) : null;
                  const isFailed = ch.status === 'failed';
                  const isOk = ch.status === 'succeeded';
                  return (
                    <tr key={ch.id} className={`hover:bg-gray-50 transition-colors ${isFailed ? 'bg-red-50/40' : ''}`}>
                      <td className="px-4 py-3">
                        <a href={`https://dashboard.stripe.com/charges/${ch.id}`} target="_blank" rel="noopener noreferrer"
                          className="text-xs font-mono text-indigo-500 hover:text-indigo-700">
                          {ch.id.slice(0, 18)}…
                        </a>
                        {ch.description && <p className="text-[10px] text-gray-400 truncate max-w-[140px]">{ch.description}</p>}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 hidden md:table-cell">
                        {coproNom ?? <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-sm font-bold ${isFailed ? 'text-red-600' : 'text-gray-800'}`}>{fmtEur(ch.amount)}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 hidden lg:table-cell">
                        {new Date(ch.created * 1000).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3">
                        {isOk ? (
                          <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                            <CheckCircle2 size={12} /> Réussi
                          </span>
                        ) : isFailed ? (
                          <span className="flex items-center gap-1 text-xs font-medium text-red-600">
                            <XCircle size={12} /> Échoué
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">{ch.status}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
