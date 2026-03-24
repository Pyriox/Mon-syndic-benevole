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
  Send, Database, Search,
} from 'lucide-react';

import { isAdminUser } from '@/lib/admin-config';
const MRR_PRICES: Record<string, number> = { essentiel: 25, confort: 30, illimite: 45 };
const ARR_PRICES: Record<string, number> = { essentiel: 300, confort: 360, illimite: 540 };

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
    { data: incidentsRecents },
    { data: lotsParCopro },
    { data: agParCopro },
    { data: depParCopro },
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
    admin.from('incidents').select('id, titre, statut, created_at, coproprietes(nom)').order('created_at', { ascending: false }).limit(10),
    admin.from('lots').select('copropriete_id'),
    admin.from('assemblees_generales').select('copropriete_id'),
    admin.from('depenses').select('copropriete_id, montant'),
  ]);

  const { data: adminRows } = await admin.from('admin_users').select('user_id');
  const adminUserIds = new Set((adminRows ?? []).map((r) => r.user_id as string));

  // Stripe (non-blocking)
  type StripeCharge = { id: string; amount: number; status: string; customerId: string | null };
  let stripeCharges: StripeCharge[] = [];
  try {
    const list = await stripe.charges.list({ limit: 50 });
    stripeCharges = list.data.map((c) => ({
      id: c.id,
      amount: c.amount / 100,
      status: c.status,
      customerId: typeof c.customer === 'string' ? c.customer : null,
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
  const mrr = Object.entries(planBreakdown).reduce((sum, [id, nb]) => sum + (MRR_PRICES[id] ?? 0) * nb, 0);
  const arr = Object.entries(planBreakdown).reduce((sum, [id, nb]) => sum + (ARR_PRICES[id] ?? 0) * nb, 0);
  const conversionPct = nbCoproprietes > 0 ? Math.round((nbActifs / nbCoproprietes) * 100) : 0;

  const hadStripe = coprosTyped.filter((c) => c.stripe_customer_id);
  const churned   = hadStripe.filter((c) => c.plan === 'inactif' || c.plan === 'passe_du');
  const churnRate = hadStripe.length > 0 ? Math.round((churned.length / hadStripe.length) * 100) : 0;

  const in14d = new Date(Date.now() + 14 * 86400000).toISOString();
  const upcomingRenewals = coprosTyped.filter((c) =>
    c.plan === 'actif' && c.plan_period_end && c.plan_period_end >= new Date().toISOString() && c.plan_period_end <= in14d
  );

  const lotsCount: Record<string, number> = {};
  for (const l of lotsParCopro ?? []) lotsCount[l.copropriete_id] = (lotsCount[l.copropriete_id] ?? 0) + 1;
  const agCount: Record<string, number> = {};
  for (const a of agParCopro ?? []) agCount[a.copropriete_id] = (agCount[a.copropriete_id] ?? 0) + 1;
  const depCount: Record<string, { nb: number; total: number }> = {};
  for (const d of depParCopro ?? []) {
    if (!depCount[d.copropriete_id]) depCount[d.copropriete_id] = { nb: 0, total: 0 };
    depCount[d.copropriete_id].nb++;
    depCount[d.copropriete_id].total += d.montant;
  }
  const topCopros = [...coprosTyped].sort((a, b) => (depCount[b.id]?.total ?? 0) - (depCount[a.id]?.total ?? 0)).slice(0, 5);

  const stripeFailures = stripeCharges.filter((c) => c.status === 'failed');
  const alertNonConfirmedOld = authUsers.filter((u) => !u.email_confirmed_at && u.created_at < new Date(Date.now() - 7 * 86400000).toISOString() && !adminUserIds.has(u.id));
  const alertInvitationsExpirees = (invitations ?? []).filter((inv) => inv.statut === 'en_attente' && new Date(inv.expires_at) < new Date());
  const alertCoprosWithoutLots = coprosTyped.filter((c) => (lotsCount[c.id] ?? 0) === 0);
  const alertPasseDu = coprosTyped.filter((c) => c.plan === 'passe_du');
  const nbAlertes = alertNonConfirmedOld.length + alertInvitationsExpirees.length + alertCoprosWithoutLots.length + alertPasseDu.length + stripeFailures.length + upcomingRenewals.length;

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
              { val: fmtEur(mrr), lbl: 'MRR' },
              { val: String(nbActifs), lbl: 'Abonnés' },
              { val: String(nbEssai), lbl: 'Essais' },
              { val: String(nbUsers), lbl: 'Comptes' },
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

      {/* ── KPIs principaux ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="MRR" value={fmtEur(mrr)} sub={`ARR : ${fmtEur(arr)} · conv. ${conversionPct} %`} icon={Banknote} color="bg-emerald-100 text-emerald-600" />
        <KpiCard label="Abonnés actifs" value={nbActifs} sub={`${nbEssai} en essai · ${nbPasseDu} impayés`} icon={CreditCard} color="bg-blue-100 text-blue-600" danger={nbPasseDu > 0} />
        <KpiCard label="Essais actifs" value={nbEssai} sub={`+${newUsers7} inscrits cette semaine`} icon={Zap} color="bg-amber-100 text-amber-600" />
        <KpiCard label="Résiliation (total)" value={`${churnRate} %`} sub={`${churned.length} résiliés / ${hadStripe.length} abonnés`} icon={TrendingDown} color={churnRate > 20 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'} danger={churnRate > 20} />
      </div>

      {/* ── Alertes ── */}
      {nbAlertes > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
            <Bell size={12} className="text-amber-700" />
            {nbAlertes} alerte{nbAlertes > 1 ? 's' : ''}
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
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
          <KpiCard label="Syndics inscrits"  value={syndicUsers.length}     icon={UserCheck}    color="bg-indigo-100 text-indigo-600" sub={`+${newSyndics30} ce mois`} />
          <KpiCard label="Membres inscrits"  value={memberUsers.length}     icon={Users}        color="bg-teal-100 text-teal-600"    sub={`${memberUsers.filter(u => !!u.email_confirmed_at).length} vérifiés`} />
          <KpiCard label="Emails vérifiés"    value={`${confirmedPct} %`}    sub={`${nbUsers - nbUnconfirmed} / ${nbUsers}`} icon={CheckCircle2} color="bg-green-100 text-green-600" />
        </div>
      </section>

      {/* ── Activité récente ── */}
      <div className="grid md:grid-cols-2 gap-6">
        <section>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Incidents récents</p>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {(incidentsRecents ?? []).length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-8">Aucun incident récent</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {(incidentsRecents ?? []).map((inc) => {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const copro = (inc as any).coproprietes as { nom: string } | null;
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const statut = (inc as any).statut as string;
                  const statutCls: Record<string, string> = { ouvert: 'bg-red-50 text-red-600', en_cours: 'bg-amber-50 text-amber-600', resolu: 'bg-green-50 text-green-600' };
                  return (
                    <div key={inc.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 font-medium truncate">{inc.titre}</p>
                        <p className="text-xs text-gray-400">{copro?.nom ?? '—'} · {timeAgo(inc.created_at)}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${statutCls[statut] ?? 'bg-gray-100 text-gray-500'}`}>{statut.replace('_', ' ')}</span>
                    </div>
                  );
                })}
              </div>
            )}
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

      {/* ── Top copros par dépenses ── */}
      <section>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Top 5 copropriétés par dépenses</p>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-100">
            {topCopros.map((c) => {
              const dep = depCount[c.id];
              const maxDep = depCount[topCopros[0]?.id]?.total ?? 1;
              const pct = dep ? Math.round((dep.total / maxDep) * 100) : 0;
              return (
                <div key={c.id} className="px-4 py-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-gray-800 truncate">{c.nom}</span>
                    <div className="flex items-center gap-3 text-xs text-gray-500 shrink-0 ml-3">
                      <span>{lotsCount[c.id] ?? 0} lots</span>
                      <span>{agCount[c.id] ?? 0} AG</span>
                      <span className="font-bold text-gray-800">{dep ? fmtEur(dep.total) : '—'}</span>
                    </div>
                  </div>
                  <ProgressBar value={pct} color="bg-indigo-400" />
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
