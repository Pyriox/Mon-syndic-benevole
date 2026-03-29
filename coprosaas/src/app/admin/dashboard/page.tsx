// ============================================================
// Admin — Dashboard (KPIs, lecture seule)
// ============================================================
import type { ElementType } from 'react';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { stripe } from '@/lib/stripe';
import {
  DoorOpen, Receipt, CalendarDays,
  AlertTriangle, Wallet, TrendingUp, UserCheck, Users, Clock,
  Mail, ExternalLink, Activity, CheckCircle2, CreditCard,
  Banknote, BarChart3, TrendingDown, Zap, Bell, XCircle,
  Send, Database, Search, LifeBuoy, Building2,
} from 'lucide-react';

import { isAdminUser } from '@/lib/admin-config';
const ARR_PRICES: Record<string, number> = { essentiel: 300, confort: 360, illimite: 540 };
const MONTH_LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

function fmtEur(n: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}
function fmtDate(s: string | null | undefined): string {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}
function timeAgo(s: string | null | undefined): string {
  if (!s) return '—';
  const d = Math.floor((Date.now() - new Date(s).getTime()) / 86400000);
  if (d === 0) return "Aujourd'hui";
  if (d === 1) return 'Hier';
  if (d < 30) return `Il y a ${d} j`;
  if (d < 365) return `Il y a ${Math.floor(d / 30)} mois`;
  return `Il y a ${Math.floor(d / 365)} an${Math.floor(d / 365) > 1 ? 's' : ''}`;
}

function KpiCard({ label, value, sub, icon: Icon, color, danger }: {
  label: string; value: string | number; sub?: string;
  icon: ElementType; color: string; danger?: boolean;
}) {
  return (
    <div className={`bg-white rounded-xl border shadow-sm p-5 flex items-start gap-4 ${danger ? 'border-red-200 bg-red-50/30' : 'border-gray-200'}`}>
      <div className={`p-3 rounded-xl ${color} shrink-0 mt-0.5`}><Icon size={20} /></div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
        <p className={`text-2xl font-bold mt-0.5 ${danger ? 'text-red-600' : 'text-gray-900'}`}>{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  );
}

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await isAdminUser(user.id, supabase))) redirect('/dashboard');

  const admin = createAdminClient();
  const today = new Date();
  const startOf30Days = new Date(Date.now() - 30 * 86400000).toISOString();
  const startOf7Days  = new Date(Date.now() - 7  * 86400000).toISOString();
  const startOfYear   = `${today.getFullYear()}-01-01`;

  const [
    { count: nbLots },
    { count: nbCoproprietaires },
    { count: nbAG },
    { count: nbIncidentsOuverts },
    { count: nbAppels },
    { data: depensesTotales },
    { data: depensesAnnee },
    { data: coproprietes },
    authResult,
    { data: invitations },
    { data: ticketsSupport },
    { data: lotsParCopro },
    { data: coproprietairesParCopro },
    { data: agParCopro },
  ] = await Promise.all([
    admin.from('lots').select('id', { count: 'exact', head: true }),
    admin.from('coproprietaires').select('id', { count: 'exact', head: true }),
    admin.from('assemblees_generales').select('id', { count: 'exact', head: true }),
    admin.from('incidents').select('id', { count: 'exact', head: true }).in('statut', ['ouvert', 'en_cours']),
    admin.from('appels_de_fonds').select('id', { count: 'exact', head: true }),
    admin.from('depenses').select('montant'),
    admin.from('depenses').select('montant').gte('date_depense', startOfYear),
    admin.from('coproprietes').select('id, nom, plan, plan_id, stripe_customer_id, plan_period_end, created_at').order('created_at', { ascending: false }),
    admin.auth.admin.listUsers({ perPage: 1000 }),
    admin.from('invitations').select('id, email, statut, expires_at, created_at').order('created_at', { ascending: false }).limit(100),
    admin.from('support_tickets').select('id, user_name, user_email, subject, status, updated_at').in('status', ['ouvert', 'en_cours']).order('updated_at', { ascending: false }).limit(8),
    admin.from('lots').select('copropriete_id'),
    admin.from('coproprietaires').select('copropriete_id'),
    admin.from('assemblees_generales').select('copropriete_id'),
  ]);

  const { data: adminRows } = await admin.from('admin_users').select('user_id');
  const adminUserIds = new Set((adminRows ?? []).map((r) => r.user_id as string));

  // Stripe (non-blocking)
  type StripeCharge = { id: string; amount: number; status: string; customerId: string | null; created: number };
  type StripeInvoice = { id: string; amount_paid: number; status: string; customerId: string | null; created: number; billingReason: string | null };
  let stripeCharges: StripeCharge[] = [];
  let stripeInvoices: StripeInvoice[] = [];
  try {
    const [chargesList, invoicesList] = await Promise.all([
      stripe.charges.list({ limit: 100 }),
      stripe.invoices.list({ limit: 100, status: 'paid' }),
    ]);
    stripeCharges = chargesList.data.map((c) => ({
      id: c.id,
      amount: c.amount / 100,
      status: c.status,
      customerId: typeof c.customer === 'string' ? c.customer : null,
      created: c.created,
    }));
    stripeInvoices = invoicesList.data.map((inv) => ({
      id: inv.id,
      amount_paid: inv.amount_paid / 100,
      status: inv.status ?? 'paid',
      customerId: typeof inv.customer === 'string' ? inv.customer : null,
      created: inv.created,
      billingReason: inv.billing_reason ?? null,
    }));
  } catch { /* non-blocking */ }

  // ── Computed ──
  const authUsers = authResult.data?.users ?? [];
  const nbUsers = authUsers.length;
  const newUsers30 = authUsers.filter((u) => u.created_at >= startOf30Days).length;
  const newUsers7  = authUsers.filter((u) => u.created_at >= startOf7Days).length;
  const nbUnconfirmed = authUsers.filter((u) => !u.email_confirmed_at).length;
  const confirmedPct = nbUsers > 0 ? Math.round(((nbUsers - nbUnconfirmed) / nbUsers) * 100) : 0;

  const totalDepenses = depensesTotales?.reduce((s, d) => s + d.montant, 0) ?? 0;
  const totalDepensesAnnee = depensesAnnee?.reduce((s, d) => s + d.montant, 0) ?? 0;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const coprosTyped = (coproprietes ?? []) as any[];
  const nbCoproprietes = coprosTyped.length;
  const nbActifs  = coprosTyped.filter((c) => c.plan === 'actif').length;
  const nbEssai   = coprosTyped.filter((c) => !c.plan || c.plan === 'essai').length;
  const nbPasseDu = coprosTyped.filter((c) => c.plan === 'passe_du').length;
  const planBreakdown: Record<string, number> = { essentiel: 0, confort: 0, illimite: 0 };
  for (const c of coprosTyped) {
    if (c.plan === 'actif' && c.plan_id) planBreakdown[c.plan_id] = (planBreakdown[c.plan_id] ?? 0) + 1;
  }
  const arr = Object.entries(planBreakdown).reduce((sum, [id, nb]) => sum + (ARR_PRICES[id] ?? 0) * nb, 0);
  const conversionPct = nbCoproprietes > 0 ? Math.round((nbActifs / nbCoproprietes) * 100) : 0;

  const hadStripe = coprosTyped.filter((c) => c.stripe_customer_id);
  const churned   = hadStripe.filter((c) => c.plan === 'resilie');
  const churnRate = hadStripe.length > 0 ? Math.round((churned.length / hadStripe.length) * 100) : 0;

  const in14d = new Date(Date.now() + 14 * 86400000).toISOString();
  const upcomingRenewals = coprosTyped.filter((c) =>
    c.plan === 'actif' && c.plan_period_end && c.plan_period_end >= new Date().toISOString() && c.plan_period_end <= in14d
  );

  // ── KPIs financiers avancés ──
  // Cash réel du mois en cours (factures Stripe payées ce mois)
  const nowTs = today.getTime() / 1000;
  const startOfMonthTs = new Date(today.getFullYear(), today.getMonth(), 1).getTime() / 1000;
  const cashCeMois = stripeInvoices
    .filter((inv) => inv.created >= startOfMonthTs && inv.created <= nowTs)
    .reduce((s, inv) => s + inv.amount_paid, 0);

  // Renouvellements effectifs cette année (billing_reason = 'subscription_cycle')
  const startOfYearTs = new Date(today.getFullYear(), 0, 1).getTime() / 1000;
  const renouvellements = stripeInvoices.filter(
    (inv) => inv.billingReason === 'subscription_cycle' && inv.created >= startOfYearTs
  );
  const nbRenouvellements = renouvellements.length;
  const cashRenouvellements = renouvellements.reduce((s, inv) => s + inv.amount_paid, 0);

  // Nouveaux abonnements cette année (subscription_create)
  const newSubsAnnee = stripeInvoices.filter(
    (inv) => inv.billingReason === 'subscription_create' && inv.created >= startOfYearTs
  );
  const cashNewSubsAnnee = newSubsAnnee.reduce((s, inv) => s + inv.amount_paid, 0);

  // Total cash encaissé cette année
  const cashTotalAnnee = stripeInvoices
    .filter((inv) => inv.created >= startOfYearTs)
    .reduce((s, inv) => s + inv.amount_paid, 0);

  // Répartition mensuelle des paiements sur l'année en cours
  const cashParMois: number[] = Array(12).fill(0);
  const subsParMois: number[] = Array(12).fill(0);
  for (const inv of stripeInvoices) {
    const d = new Date(inv.created * 1000);
    if (d.getFullYear() === today.getFullYear()) {
      cashParMois[d.getMonth()] += inv.amount_paid;
      subsParMois[d.getMonth()]++;
    }
  }
  const maxCashMois = Math.max(...cashParMois, 1);

  const lotsCount: Record<string, number> = {};
  for (const l of lotsParCopro ?? []) lotsCount[l.copropriete_id] = (lotsCount[l.copropriete_id] ?? 0) + 1;
  const coproCount: Record<string, number> = {};
  for (const c of coproprietairesParCopro ?? []) coproCount[c.copropriete_id] = (coproCount[c.copropriete_id] ?? 0) + 1;
  const agCount: Record<string, number> = {};
  for (const a of agParCopro ?? []) agCount[a.copropriete_id] = (agCount[a.copropriete_id] ?? 0) + 1;
  const topCopros = [...coprosTyped]
    .sort((a, b) => {
      const byMembers = (coproCount[b.id] ?? 0) - (coproCount[a.id] ?? 0);
      if (byMembers !== 0) return byMembers;
      const byLots = (lotsCount[b.id] ?? 0) - (lotsCount[a.id] ?? 0);
      if (byLots !== 0) return byLots;
      return (agCount[b.id] ?? 0) - (agCount[a.id] ?? 0);
    })
    .slice(0, 5);

  const stripeFailures = stripeCharges.filter((c) => c.status === 'failed');
  const alertNonConfirmedOld = authUsers.filter((u) => !u.email_confirmed_at && u.created_at < new Date(Date.now() - 7 * 86400000).toISOString() && !adminUserIds.has(u.id));
  const alertInvitationsExpirees = (invitations ?? []).filter((inv) => inv.statut === 'en_attente' && new Date(inv.expires_at) < new Date());
  const alertCoprosWithoutLots = coprosTyped.filter((c) => (lotsCount[c.id] ?? 0) === 0);
  const alertPasseDu = coprosTyped.filter((c) => c.plan === 'passe_du');
  const nbTicketsOuverts = (ticketsSupport ?? []).filter((t) => (t as { status: string }).status === 'ouvert').length;
  const nbAlertes = alertNonConfirmedOld.length + alertInvitationsExpirees.length + alertCoprosWithoutLots.length + alertPasseDu.length + stripeFailures.length + upcomingRenewals.length + nbTicketsOuverts;

  const syndicUsers = authUsers.filter((u) => (u.user_metadata as Record<string, string> | null)?.role !== 'copropriétaire');
  const memberUsers = authUsers.filter((u) => (u.user_metadata as Record<string, string> | null)?.role === 'copropriétaire');
  const newSyndics30 = syndicUsers.filter((u) => u.created_at >= startOf30Days).length;

  void fmtDate; // used below

  return (
    <div className="space-y-6 pb-16">
      {/* ── Header strip ── */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 rounded-2xl px-6 py-5 text-white">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs text-blue-300 uppercase tracking-wider font-medium mb-1">Console administrateur</p>
            <h1 className="text-xl font-bold">Dashboard</h1>
            <p className="text-blue-200 text-sm mt-0.5">
              {today.toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex gap-3 flex-wrap">
            {([
              { val: fmtEur(arr), lbl: 'ARR' },
              { val: fmtEur(cashCeMois), lbl: 'Cash mois' },
              { val: String(nbActifs), lbl: 'Abonnés' },
              { val: String(nbEssai), lbl: 'Essais' },
            ] as { val: string; lbl: string }[]).map(({ val, lbl }) => (
              <div key={lbl} className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-center min-w-[72px]">
                <p className="text-lg font-bold">{val}</p>
                <p className="text-[11px] text-blue-200 mt-0.5">{lbl}</p>
              </div>
            ))}
            {nbAlertes > 0 && (
              <div className="bg-red-500/20 border border-red-400/30 rounded-xl px-4 py-2 text-center min-w-[72px]">
                <p className="text-lg font-bold text-red-300">{nbAlertes}</p>
                <p className="text-[11px] text-red-300 mt-0.5">Alertes</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── KPIs financiers principaux ── */}
      <section>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Revenus &amp; abonnements</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="ARR" value={fmtEur(arr)} sub={`Conv. ${conversionPct} % · ${nbActifs} abonnés actifs`} icon={Banknote} color="bg-emerald-100 text-emerald-600" />
          <KpiCard label="Cash encaissé (mois)" value={fmtEur(cashCeMois)} sub={`${today.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`} icon={Receipt} color="bg-blue-100 text-blue-600" />
          <KpiCard label="Cash encaissé (année)" value={fmtEur(cashTotalAnnee)} sub={`Dont ${fmtEur(cashNewSubsAnnee)} nouveaux · ${fmtEur(cashRenouvellements)} renouv.`} icon={BarChart3} color="bg-violet-100 text-violet-600" />
          <KpiCard label="Renouvellements (année)" value={nbRenouvellements} sub={`${fmtEur(cashRenouvellements)} encaissés · ${newSubsAnnee.length} nouveaux abonnés`} icon={TrendingUp} color="bg-teal-100 text-teal-600" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          <KpiCard label="Abonnés actifs" value={nbActifs} sub={`Essentiel ${planBreakdown.essentiel} · Confort ${planBreakdown.confort} · Illimité ${planBreakdown.illimite}`} icon={CreditCard} color="bg-blue-100 text-blue-600" />
          <KpiCard label="Essais actifs" value={nbEssai} icon={Zap} color="bg-amber-100 text-amber-600" />
          <KpiCard label="Impayés" value={nbPasseDu} sub={nbPasseDu > 0 ? 'Action requise' : 'Aucun impayé'} icon={XCircle} color={nbPasseDu > 0 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-400'} danger={nbPasseDu > 0} />
          <KpiCard label="Taux de résiliation" value={`${churnRate} %`} sub={`${churned.length} résiliés / ${hadStripe.length} ayant eu un abonnement`} icon={TrendingDown} color={churnRate > 20 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'} danger={churnRate > 20} />
        </div>
      </section>

      {/* ── Répartition mensuelle des encaissements ── */}
      <section>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Encaissements mensuels — {today.getFullYear()}</p>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          {cashTotalAnnee === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Aucune donnée Stripe disponible pour cette année</p>
          ) : (
            <>
              <div className="flex gap-1.5 h-28">
                {cashParMois.map((cash, i) => {
                  const pct = Math.max(Math.round((cash / maxCashMois) * 100), cash > 0 ? 4 : 0);
                  const isCurrent = i === today.getMonth();
                  return (
                    <div key={i} className="flex-1 h-full flex flex-col justify-end group relative">
                      {cash > 0 && (
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                          {fmtEur(cash)}
                        </div>
                      )}
                      <div
                        className={`w-full rounded-t-md transition-all ${isCurrent ? 'bg-emerald-500' : 'bg-indigo-200 group-hover:bg-indigo-400'}`}
                        style={{ height: `${pct}%` }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-1.5 mt-1.5">
                {MONTH_LABELS.map((lbl, i) => (
                  <div key={i} className={`flex-1 text-center text-[10px] font-medium ${i === today.getMonth() ? 'text-emerald-600' : 'text-gray-400'}`}>{lbl}</div>
                ))}
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 flex-wrap gap-2">
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block" /> Mois en cours</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-indigo-200 inline-block" /> Autres mois</span>
                </div>
                <div className="flex gap-4 text-xs">
                  {cashParMois.map((cash, i) => cash > 0 && (
                    <span key={i} className={`font-medium ${i === today.getMonth() ? 'text-emerald-600' : 'text-gray-600'}`}>
                      {MONTH_LABELS[i]} : {fmtEur(cash)} ({subsParMois[i]} sub{subsParMois[i] > 1 ? 's' : ''})
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── Alertes ── */}
      {nbAlertes > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
            <Bell size={12} className="text-amber-700" />
            {nbAlertes} alerte{nbAlertes > 1 ? 's' : ''}
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {nbTicketsOuverts > 0 && (
              <div className="flex items-start gap-3 bg-indigo-50 border border-indigo-200 rounded-xl p-3">
                <LifeBuoy size={14} className="text-indigo-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-indigo-800">{nbTicketsOuverts} ticket{nbTicketsOuverts > 1 ? 's' : ''} support en attente</p>
                  <Link href="/admin/support" className="text-xs text-indigo-600 mt-0.5 hover:underline">Voir les tickets</Link>
                </div>
              </div>
            )}
            {alertPasseDu.length > 0 && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-3">
                <CreditCard size={14} className="text-red-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-red-800">{alertPasseDu.length} abonnement{alertPasseDu.length > 1 ? 's' : ''} impayé{alertPasseDu.length > 1 ? 's' : ''}</p>
                  <Link href="/admin/abonnements" className="text-xs text-red-600 mt-0.5 hover:underline">Voir abonnements</Link>
                </div>
              </div>
            )}
            {stripeFailures.length > 0 && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-3">
                <XCircle size={14} className="text-red-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-red-800">{stripeFailures.length} paiement{stripeFailures.length > 1 ? 's' : ''} échoué{stripeFailures.length > 1 ? 's' : ''}</p>
                  <Link href="/admin/abonnements" className="text-xs text-red-600 mt-0.5 hover:underline">Voir abonnements</Link>
                </div>
              </div>
            )}
            {upcomingRenewals.length > 0 && (
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
                <Clock size={14} className="text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">{upcomingRenewals.length} renouvellement{upcomingRenewals.length > 1 ? 's' : ''} dans moins de 14 jours</p>
                  <p className="text-xs text-amber-600 mt-0.5 truncate">{upcomingRenewals.map((c: { nom: string }) => c.nom).join(', ')}</p>
                </div>
              </div>
            )}
            {alertNonConfirmedOld.length > 0 && (
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
                <Clock size={14} className="text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">{alertNonConfirmedOld.length} compte{alertNonConfirmedOld.length > 1 ? 's' : ''} non vérifié depuis plus de 7j</p>
                  <Link href="/admin/utilisateurs" className="text-xs text-amber-600 mt-0.5 hover:underline">Voir utilisateurs</Link>
                </div>
              </div>
            )}
            {alertInvitationsExpirees.length > 0 && (
              <div className="flex items-start gap-3 bg-orange-50 border border-orange-200 rounded-xl p-3">
                <Send size={14} className="text-orange-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-orange-800">{alertInvitationsExpirees.length} invitation{alertInvitationsExpirees.length > 1 ? 's' : ''} expirée{alertInvitationsExpirees.length > 1 ? 's' : ''}</p>
                  <Link href="/admin/utilisateurs" className="text-xs text-orange-600 mt-0.5 hover:underline">Voir utilisateurs</Link>
                </div>
              </div>
            )}
            {alertCoprosWithoutLots.length > 0 && (
              <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-3">
                <DoorOpen size={14} className="text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-blue-800">{alertCoprosWithoutLots.length} copropriété{alertCoprosWithoutLots.length > 1 ? 's' : ''} sans lots</p>
                  <Link href="/admin/coproprietes" className="text-xs text-blue-600 mt-0.5 hover:underline">Voir copropriétés</Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Stats plateforme ── */}
      <section>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Plateforme en chiffres</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="Lots gérés"       value={nbLots ?? 0}            icon={DoorOpen}     color="bg-violet-100 text-violet-600" />
          <KpiCard label="Copropriétaires"    value={nbCoproprietaires ?? 0} icon={UserCheck}    color="bg-green-100 text-green-600" />
          <KpiCard label="Assemblées"         value={nbAG ?? 0}              icon={CalendarDays} color="bg-pink-100 text-pink-600" />
          <KpiCard label="Appels de fonds"   value={nbAppels ?? 0}          icon={Wallet}       color="bg-amber-100 text-amber-600" />
          <KpiCard label="Incidents ouverts" value={nbIncidentsOuverts ?? 0} icon={AlertTriangle} color={nbIncidentsOuverts ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-400'} danger={!!nbIncidentsOuverts && nbIncidentsOuverts > 5} />
          <KpiCard label="Utilisateurs inscrits" value={nbUsers} sub={`${syndicUsers.length} syndics · ${memberUsers.length} membres`} icon={Users} color="bg-indigo-100 text-indigo-600" />
          <KpiCard label="Copropriétés"           value={nbCoproprietes} icon={Building2} color="bg-teal-100 text-teal-600" />
          <KpiCard label="Emails vérifiés"         value={`${confirmedPct} %`} sub={`${nbUsers - nbUnconfirmed} / ${nbUsers}`} icon={CheckCircle2} color="bg-green-100 text-green-600" />
        </div>
      </section>

      {/* ── Activité récente ── */}
      <div className="grid md:grid-cols-2 gap-6">
        <section>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <LifeBuoy size={12} />
            Tickets support
            {nbTicketsOuverts > 0 && (
              <span className="ml-1 bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">{nbTicketsOuverts}</span>
            )}
          </p>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {(ticketsSupport ?? []).length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-8">Aucun ticket en cours</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {(ticketsSupport ?? []).map((t) => {
                  const status = (t as { id: string; user_name: string; subject: string; status: string; updated_at: string }).status;
                  const statusCls: Record<string, string> = { ouvert: 'bg-blue-50 text-blue-700', en_cours: 'bg-amber-50 text-amber-700' };
                  const statusLabel: Record<string, string> = { ouvert: 'Ouvert', en_cours: 'En cours' };
                  const ticket = t as { id: string; user_name: string; subject: string; status: string; updated_at: string };
                  return (
                    <Link key={ticket.id} href={`/admin/support?ticket=${ticket.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 font-medium truncate">{ticket.subject}</p>
                        <p className="text-xs text-gray-400">{ticket.user_name} · {timeAgo(ticket.updated_at)}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-md font-medium whitespace-nowrap ${statusCls[status] ?? 'bg-gray-100 text-gray-500'}`}>{statusLabel[status] ?? status}</span>
                    </Link>
                  );
                })}
              </div>
            )}
            <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50">
              <Link href="/admin/support" className="text-xs text-indigo-600 hover:underline font-medium">Voir tous les tickets →</Link>
            </div>
          </div>
        </section>

        <section>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Inscriptions récentes (7 jours)</p>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {authUsers.filter((u) => u.created_at >= startOf7Days).length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-8">Aucune inscription cette semaine</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {authUsers.filter((u) => u.created_at >= startOf7Days).slice(0, 8).map((u) => {
                  const meta = u.user_metadata as Record<string, string> | null;
                  const role = meta?.role ?? 'syndic';
                  return (
                    <div key={u.id} className="flex items-center gap-3 px-4 py-2.5">
                      <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                        <span className="text-[11px] font-bold text-indigo-600">{(u.email ?? '?')[0].toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 truncate">{u.email}</p>
                        <p className="text-xs text-gray-400">{timeAgo(u.created_at)}</p>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${role === 'copropriétaire' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200'}`}>
                        {role === 'copropriétaire' ? 'Membre' : 'Syndic'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* ── Top copros par taille (copropriétaires) ── */}
      <section>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Top 5 copropriétés par taille</p>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-100">
            {topCopros.map((c) => {
              const nbCopro = coproCount[c.id] ?? 0;
              const maxCopro = coproCount[topCopros[0]?.id] ?? 1;
              const pct = Math.round((nbCopro / maxCopro) * 100);
              return (
                <div key={c.id} className="px-4 py-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-gray-800 truncate">{c.nom}</span>
                    <div className="flex items-center gap-3 text-xs text-gray-500 shrink-0 ml-3">
                      <span>{nbCopro} copro</span>
                      <span>{lotsCount[c.id] ?? 0} lots</span>
                      <span>{agCount[c.id] ?? 0} AG</span>
                    </div>
                  </div>
                  <ProgressBar value={pct} color="bg-emerald-400" />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Outils externes ── */}
      <section>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Outils &amp; liens rapides</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {([
            { href: 'https://dashboard.stripe.com/subscriptions',                    label: 'Stripe',         sub: 'Paiements',        icon: CreditCard, color: 'bg-indigo-50 text-indigo-600' },
            { href: 'https://supabase.com/dashboard/project/ybhqvpnafwertoricfce', label: 'Supabase',       sub: 'Base de données', icon: Database,   color: 'bg-green-50 text-green-600' },
            { href: 'https://vercel.com/dashboard',                                  label: 'Vercel',         sub: 'Déploiements',  icon: Activity,   color: 'bg-gray-100 text-gray-600' },
            { href: 'https://resend.com/emails',                                     label: 'Resend',         sub: 'Emails',           icon: Mail,       color: 'bg-purple-50 text-purple-600' },
            { href: 'https://analytics.google.com',                                  label: 'Analytics',      sub: 'GA4',              icon: Search,     color: 'bg-orange-50 text-orange-600' },
            { href: 'https://search.google.com/search-console',                      label: 'Search Console', sub: 'SEO',              icon: TrendingUp, color: 'bg-blue-50 text-blue-600' },
          ] as { href: string; label: string; sub: string; icon: ElementType; color: string }[]).map(({ href, label, sub, icon: Icon, color }) => (
            <a key={href} href={href} target="_blank" rel="noopener noreferrer"
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col items-center gap-2 hover:border-gray-300 hover:shadow-md transition-all text-center">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}><Icon size={16} /></div>
              <div>
                <p className="text-xs font-semibold text-gray-800">{label} <ExternalLink size={9} className="inline" /></p>
                <p className="text-[10px] text-gray-400">{sub}</p>
              </div>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
