// ============================================================
// Page Administration — statistiques globales & gestion du site
// Accessible uniquement pour tpn.fabien@gmail.com
// ============================================================
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import AdminUserActions from './AdminUserActions';
import AdminCoproActions from './AdminCoproActions';
import AdminInvitationDelete from './AdminInvitationDelete';
import AdminTabs from './AdminTabs';
import type { TabId } from './AdminTabs';
import {
  Users,
  Building2,
  DoorOpen,
  Receipt,
  CalendarDays,
  AlertTriangle,
  Wallet,
  TrendingUp,
  UserCheck,
  Clock,
  Mail,
  ExternalLink,
  ShieldCheck,
  Database,
  Activity,
  Send,
  XCircle,
  CheckCircle2,
  CreditCard,
  Banknote,
  BarChart3,
} from 'lucide-react';

const ADMIN_EMAIL = 'tpn.fabien@gmail.com';
const MRR_PRICES: Record<string, number> = { essentiel: 25, confort: 30, illimite: 45 };
const ARR_PRICES: Record<string, number> = { essentiel: 300, confort: 360, illimite: 540 };

function formatEuros(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}
function formatDate(s: string | null | undefined) {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}
function timeAgo(s: string | null | undefined): string {
  if (!s) return '—';
  const diff = Date.now() - new Date(s).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return "Aujourd'hui";
  if (d === 1) return 'Hier';
  if (d < 30) return `Il y a ${d} j`;
  if (d < 365) return `Il y a ${Math.floor(d / 30)} mois`;
  return `Il y a ${Math.floor(d / 365)} an${Math.floor(d / 365) > 1 ? 's' : ''}`;
}

function KpiCard({
  label, value, sub, icon: Icon, color, trend,
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string;
  trend?: { value: number; label: string };
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-start gap-4">
      <div className={`p-3 rounded-xl ${color} shrink-0 mt-0.5`}><Icon size={20} /></div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        {trend && (
          <p className={`text-xs mt-1 font-medium ${trend.value >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            ↑ {trend.value} {trend.label}
          </p>
        )}
      </div>
    </div>
  );
}

function PlanBadge({ plan, planId }: { plan: string | null; planId: string | null }) {
  if (plan === 'actif') {
    const cfg: Record<string, { label: string; cls: string }> = {
      essentiel: { label: 'Essentiel', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
      confort:   { label: 'Confort',   cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
      illimite:  { label: 'Illimité',  cls: 'bg-purple-50 text-purple-700 border-purple-200' },
    };
    const c = cfg[planId ?? ''] ?? { label: planId ?? 'Actif', cls: 'bg-green-50 text-green-700 border-green-200' };
    return <span className={`inline-flex text-xs px-2 py-0.5 rounded-md font-medium border ${c.cls}`}>{c.label}</span>;
  }
  if (plan === 'passe_du') return <span className="inline-flex text-xs px-2 py-0.5 rounded-md font-medium bg-red-50 text-red-600 border border-red-200">Impayé</span>;
  if (plan === 'inactif')  return <span className="inline-flex text-xs px-2 py-0.5 rounded-md font-medium bg-gray-100 text-gray-500 border border-gray-200">Inactif</span>;
  return <span className="inline-flex text-xs px-2 py-0.5 rounded-md font-medium bg-amber-50 text-amber-700 border border-amber-200">Essai</span>;
}

function SectionTitle({ icon: Icon, title, sub }: { icon: React.ElementType; title: string; sub?: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center"><Icon size={16} className="text-gray-600" /></div>
      <div>
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        {sub && <p className="text-xs text-gray-400">{sub}</p>}
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

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) redirect('/dashboard');

  const admin = createAdminClient();

  const today = new Date();
  const startOf30Days   = new Date(Date.now() - 30 * 86400000).toISOString();
  const startOf7Days    = new Date(Date.now() - 7  * 86400000).toISOString();
  const startOfYear     = `${today.getFullYear()}-01-01`;
  const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString();
  const endOfLastMonth   = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();

  const [
    { count: nbLots },
    { count: nbCoproprietaires },
    { count: nbAG },
    { count: nbIncidentsOuverts },
    { count: nbIncidentsClos },
    { count: nbAppels },
    { data: depensesTotales },
    { data: depensesAnnee },
    { data: coproprietes },
    { data: recentCopros30 },
    { data: recentCopros7 },
    authResult,
    { data: invitations },
    { data: incidentsRecents },
    { data: appelsRecents },
  ] = await Promise.all([
    admin.from('lots').select('id', { count: 'exact', head: true }),
    admin.from('coproprietaires').select('id', { count: 'exact', head: true }),
    admin.from('assemblees_generales').select('id', { count: 'exact', head: true }),
    admin.from('incidents').select('id', { count: 'exact', head: true }).in('statut', ['ouvert', 'en_cours']),
    admin.from('incidents').select('id', { count: 'exact', head: true }).eq('statut', 'resolu'),
    admin.from('appels_de_fonds').select('id', { count: 'exact', head: true }),
    admin.from('depenses').select('montant'),
    admin.from('depenses').select('montant').gte('date_depense', startOfYear),
    admin
      .from('coproprietes')
      .select('id, nom, adresse, ville, plan, plan_id, stripe_subscription_id, stripe_customer_id, plan_period_end, created_at, syndic_id, profiles!coproprietes_syndic_id_fkey(full_name, id, email)')
      .order('created_at', { ascending: false }),
    admin.from('coproprietes').select('id, nom, ville, created_at').gte('created_at', startOf30Days).order('created_at', { ascending: false }),
    admin.from('coproprietes').select('id').gte('created_at', startOf7Days),
    admin.auth.admin.listUsers({ perPage: 1000 }),
    admin.from('invitations').select('id, email, statut, expires_at, created_at, coproprietes(nom)').order('created_at', { ascending: false }).limit(100),
    admin.from('incidents').select('id, titre, statut, priorite, created_at, coproprietes(nom)').order('created_at', { ascending: false }).limit(10),
    admin.from('appels_de_fonds').select('id, titre, montant_total, date_echeance, created_at, coproprietes(nom)').order('created_at', { ascending: false }).limit(10),
  ]);

  const [
    { data: lotsParCopro },
    { data: agParCopro },
    { data: depParCopro },
    { data: incidentsParCopro },
  ] = await Promise.all([
    admin.from('lots').select('copropriete_id'),
    admin.from('assemblees_generales').select('copropriete_id'),
    admin.from('depenses').select('copropriete_id, montant'),
    admin.from('incidents').select('copropriete_id, statut'),
    admin.from('coproprietes').select('id').gte('created_at', startOfLastMonth).lt('created_at', endOfLastMonth),
  ]);

  const totalDepenses = depensesTotales?.reduce((s, d) => s + d.montant, 0) ?? 0;
  const totalDepensesAnnee = depensesAnnee?.reduce((s, d) => s + d.montant, 0) ?? 0;

  const authUsers = authResult.data?.users ?? [];
  const nbUsers = authUsers.length;
  const newUsers30 = authUsers.filter((u) => u.created_at && u.created_at >= startOf30Days).length;
  const newUsers7  = authUsers.filter((u) => u.created_at && u.created_at >= startOf7Days).length;
  const nbUnconfirmed = authUsers.filter((u) => !u.email_confirmed_at).length;
  const confirmedPct = nbUsers > 0 ? Math.round(((nbUsers - nbUnconfirmed) / nbUsers) * 100) : 0;

  const recentUsers = [...authUsers].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const syndicUsers = recentUsers.filter((u) => (u.user_metadata as Record<string, string> | null)?.role !== 'copropriétaire');
  const memberUsers = recentUsers.filter((u) => (u.user_metadata as Record<string, string> | null)?.role === 'copropriétaire');

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
  const incidentCount: Record<string, number> = {};
  for (const i of incidentsParCopro ?? []) {
    if (i.statut !== 'resolu') incidentCount[i.copropriete_id] = (incidentCount[i.copropriete_id] ?? 0) + 1;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const coprosTyped = (coproprietes ?? []) as any[];
  const nbCoproprietes = coprosTyped.length;

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
  const conversionPct = nbCoproprietes > 0 ? Math.round((nbActifs / nbCoproprietes) * 100) : 0;

  const topCopros = [...coprosTyped].sort((a, b) => (depCount[b.id]?.total ?? 0) - (depCount[a.id]?.total ?? 0)).slice(0, 5);

  const sevenDaysAgo = startOf7Days;
  const alertNonConfirmedOld = authUsers.filter((u) => !u.email_confirmed_at && u.created_at < sevenDaysAgo && u.email !== ADMIN_EMAIL);
  const alertInvitationsExpirees = (invitations ?? []).filter((inv) => inv.statut === 'en_attente' && new Date(inv.expires_at) < new Date());
  const alertCoprosWithoutLots = coprosTyped.filter((c) => (lotsCount[c.id] ?? 0) === 0);
  const alertPasseDu = coprosTyped.filter((c) => c.plan === 'passe_du');
  const nbAlertes = alertNonConfirmedOld.length + alertInvitationsExpirees.length + alertCoprosWithoutLots.length + alertPasseDu.length;

  const abonnesActifs = coprosTyped.filter((c) => c.plan === 'actif');
  const inactifs = coprosTyped.filter((c) => c.plan !== 'actif');

  return (
    <div className="space-y-8 pb-16">

      {/* ── En-tête ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Administration</h1>
          <p className="text-gray-500 mt-1 text-sm">Mon Syndic Bénévole — données en temps réel</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
            <ShieldCheck size={14} className="text-green-600" />
            <span className="text-xs text-green-700 font-medium">Admin</span>
          </div>
          <span className="text-xs text-gray-400">
            {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* ── KPIs rapides ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Utilisateurs" value={nbUsers} sub={`+${newUsers7} cette semaine · ${nbUnconfirmed} non vérifiés`} icon={Users} color="bg-blue-100 text-blue-600" trend={{ value: newUsers30, label: 'ce mois' }} />
        <KpiCard label="Copropriétés" value={nbCoproprietes} sub={`${nbActifs} abonnées · ${nbEssai} en essai`} icon={Building2} color="bg-indigo-100 text-indigo-600" trend={{ value: recentCopros30?.length ?? 0, label: 'ce mois' }} />
        <KpiCard label="MRR" value={formatEuros(mrr)} sub={`ARR : ${formatEuros(arr)} · ${conversionPct}% conversion`} icon={Banknote} color="bg-emerald-100 text-emerald-600" />
        <KpiCard label="Incidents ouverts" value={nbIncidentsOuverts ?? 0} sub={`${nbIncidentsClos ?? 0} résolus au total`} icon={AlertTriangle} color={(nbIncidentsOuverts ?? 0) > 0 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'} />
      </div>

      {/* ── Alertes ── */}
      {nbAlertes > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
            <AlertTriangle size={12} className="text-amber-500" />
            {nbAlertes} alerte{nbAlertes > 1 ? 's' : ''}
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {alertPasseDu.length > 0 && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-3">
                <CreditCard size={14} className="text-red-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-red-800">{alertPasseDu.length} abonnement{alertPasseDu.length > 1 ? 's' : ''} impayé{alertPasseDu.length > 1 ? 's' : ''}</p>
                  <p className="text-xs text-red-700 mt-0.5 truncate">{alertPasseDu.map((c: { nom: string }) => c.nom).join(', ')}</p>
                </div>
              </div>
            )}
            {alertNonConfirmedOld.length > 0 && (
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
                <Clock size={14} className="text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">{alertNonConfirmedOld.length} compte{alertNonConfirmedOld.length > 1 ? 's' : ''} non vérifié &gt;7j</p>
                  <p className="text-xs text-amber-700 mt-0.5 truncate">{alertNonConfirmedOld.map((u) => u.email).join(', ')}</p>
                </div>
              </div>
            )}
            {alertInvitationsExpirees.length > 0 && (
              <div className="flex items-start gap-3 bg-orange-50 border border-orange-200 rounded-xl p-3">
                <Send size={14} className="text-orange-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-orange-800">{alertInvitationsExpirees.length} invitation{alertInvitationsExpirees.length > 1 ? 's' : ''} expirée{alertInvitationsExpirees.length > 1 ? 's' : ''}</p>
                  <p className="text-xs text-orange-700 mt-0.5">Relancer depuis les fiches copropriété.</p>
                </div>
              </div>
            )}
            {alertCoprosWithoutLots.length > 0 && (
              <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-3">
                <DoorOpen size={14} className="text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-blue-800">{alertCoprosWithoutLots.length} copropriété{alertCoprosWithoutLots.length > 1 ? 's' : ''} sans lots</p>
                  <p className="text-xs text-blue-700 mt-0.5 truncate">{alertCoprosWithoutLots.map((c: { nom: string }) => c.nom).join(', ')}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Onglets ── */}
      <AdminTabs>
        {(tab: TabId) => (
          <>
            {/* ══════════ VUE D'ENSEMBLE ══════════ */}
            {tab === 'overview' && (
              <div className="space-y-8">
                <section>
                  <SectionTitle icon={BarChart3} title="Plateforme en chiffres" />
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <KpiCard label="Lots gérés"           value={nbLots ?? 0}              icon={DoorOpen}     color="bg-violet-100 text-violet-600" />
                    <KpiCard label="Copropriétaires"       value={nbCoproprietaires ?? 0}   icon={UserCheck}    color="bg-green-100 text-green-600" />
                    <KpiCard label="Assemblées"            value={nbAG ?? 0}                icon={CalendarDays} color="bg-pink-100 text-pink-600" />
                    <KpiCard label={`Dépenses ${today.getFullYear()}`} value={formatEuros(totalDepensesAnnee)} sub={`Total : ${formatEuros(totalDepenses)}`} icon={Receipt} color="bg-orange-100 text-orange-600" />
                    <KpiCard label="Appels de fonds"       value={nbAppels ?? 0}            icon={Wallet}       color="bg-amber-100 text-amber-600" />
                    <KpiCard label="Syndics inscrits"      value={syndicUsers.length}       icon={UserCheck}    color="bg-indigo-100 text-indigo-600" />
                    <KpiCard label="Membres inscrits"      value={memberUsers.length}       icon={Users}        color="bg-teal-100 text-teal-600" />
                    <KpiCard label="Emails vérifiés"       value={`${confirmedPct} %`}      sub={`${nbUsers - nbUnconfirmed} / ${nbUsers}`} icon={CheckCircle2} color="bg-green-100 text-green-600" />
                  </div>
                </section>

                <div className="grid md:grid-cols-2 gap-6">
                  <section>
                    <SectionTitle icon={AlertTriangle} title="Incidents récents" sub="10 derniers" />
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                      {(incidentsRecents ?? []).length === 0 ? (
                        <p className="text-center text-sm text-gray-400 py-8">Aucun incident</p>
                      ) : (
                        <div className="divide-y divide-gray-100">
                          {(incidentsRecents ?? []).map((inc) => {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            const copro = (inc as any).coproprietes as { nom: string } | null;
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            const statut = (inc as any).statut as string;
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            const priorite = (inc as any).priorite as string | null;
                            const statutCls: Record<string, string> = { ouvert: 'bg-red-50 text-red-600', en_cours: 'bg-amber-50 text-amber-600', resolu: 'bg-green-50 text-green-600' };
                            return (
                              <div key={inc.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-gray-800 font-medium truncate">{inc.titre}</p>
                                  <p className="text-xs text-gray-400">{copro?.nom ?? '—'} · {timeAgo(inc.created_at)}</p>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {priorite && <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${priorite === 'urgent' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>{priorite}</span>}
                                  <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${statutCls[statut] ?? 'bg-gray-100 text-gray-500'}`}>{statut.replace('_', ' ')}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </section>

                  <section>
                    <SectionTitle icon={Wallet} title="Appels de fonds récents" sub="10 derniers" />
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                      {(appelsRecents ?? []).length === 0 ? (
                        <p className="text-center text-sm text-gray-400 py-8">Aucun appel de fonds</p>
                      ) : (
                        <div className="divide-y divide-gray-100">
                          {(appelsRecents ?? []).map((a) => {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            const copro = (a as any).coproprietes as { nom: string } | null;
                            return (
                              <div key={a.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-gray-800 font-medium truncate">{a.titre}</p>
                                  <p className="text-xs text-gray-400">{copro?.nom ?? '—'} · {timeAgo(a.created_at)}</p>
                                </div>
                                <span className="text-sm font-bold text-gray-800 shrink-0">{formatEuros(a.montant_total)}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </section>
                </div>

                <section>
                  <SectionTitle icon={TrendingUp} title="Top 5 copropriétés par dépenses" />
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="divide-y divide-gray-100">
                      {topCopros.map((c) => {
                        const dep = depCount[c.id];
                        const maxDep = depCount[topCopros[0]?.id]?.total ?? 1;
                        const pct = dep ? Math.round((dep.total / maxDep) * 100) : 0;
                        return (
                          <div key={c.id} className="px-4 py-3">
                            <div className="flex items-center justify-between mb-1.5">
                              <div>
                                <span className="text-sm font-medium text-gray-800">{c.nom}</span>
                                <span className="ml-2 text-xs text-gray-400">{c.ville}</span>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-gray-500">
                                <span>{lotsCount[c.id] ?? 0} lots</span>
                                <span>{agCount[c.id] ?? 0} AG</span>
                                <span className="font-bold text-gray-800">{dep ? formatEuros(dep.total) : '—'}</span>
                              </div>
                            </div>
                            <ProgressBar value={pct} color="bg-indigo-400" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </section>

                <section>
                  <SectionTitle icon={Database} title="Outils de gestion" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { href: 'https://dashboard.stripe.com/subscriptions', label: 'Stripe', sub: 'Abonnements & factures', icon: CreditCard, color: 'bg-indigo-50 text-indigo-600', textColor: 'text-indigo-600 hover:text-indigo-800' },
                      { href: 'https://supabase.com/dashboard/project/ybhqvpnafwertoricfce', label: 'Supabase', sub: 'BDD & migrations RLS', icon: Database, color: 'bg-green-50 text-green-600', textColor: 'text-green-600 hover:text-green-800' },
                      { href: 'https://resend.com/emails', label: 'Resend', sub: 'Emails transactionnels', icon: Mail, color: 'bg-purple-50 text-purple-600', textColor: 'text-purple-600 hover:text-purple-800' },
                      { href: 'https://vercel.com/dashboard', label: 'Vercel', sub: 'Déploiements & logs', icon: Activity, color: 'bg-gray-100 text-gray-600', textColor: 'text-gray-600 hover:text-gray-800' },
                    ].map(({ href, label, sub, icon: Icon, color, textColor }) => (
                      <a key={href} href={href} target="_blank" rel="noopener noreferrer"
                        className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-3 hover:border-gray-300 transition-colors">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color} shrink-0`}><Icon size={16} /></div>
                        <div>
                          <p className={`text-sm font-semibold ${textColor} transition-colors`}>{label} <ExternalLink size={10} className="inline" /></p>
                          <p className="text-xs text-gray-400">{sub}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                </section>
              </div>
            )}

            {/* ══════════ SYNDICS ══════════ */}
            {tab === 'syndics' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <SectionTitle icon={UserCheck} title="Syndics bénévoles" sub={`${syndicUsers.length} comptes syndic`} />
                  <div className="flex gap-2 text-xs">
                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md font-medium">{syndicUsers.filter(u => !!u.email_confirmed_at).length} vérifiés</span>
                    <span className="bg-amber-50 text-amber-700 px-2 py-1 rounded-md font-medium">{syndicUsers.filter(u => !u.email_confirmed_at).length} en attente</span>
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email / Nom</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Inscription</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Dernière connexion</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Copropriétés</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Statut</th>
                        <th className="px-4 py-3 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {syndicUsers.map((u) => {
                        const meta = u.user_metadata as Record<string, string> | null;
                        const userCopros = coprosTyped.filter((c) => c.syndic_id === u.id);
                        return (
                          <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                                  <span className="text-xs font-bold text-indigo-600">{(u.email ?? '?')[0].toUpperCase()}</span>
                                </div>
                                <div className="min-w-0">
                                  <p className={`text-sm font-medium truncate ${u.email === ADMIN_EMAIL ? 'text-blue-700' : 'text-gray-800'}`}>
                                    {u.email}
                                    {u.email === ADMIN_EMAIL && <span className="ml-1.5 text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">Admin</span>}
                                  </p>
                                  <p className="text-xs text-gray-400">{meta?.full_name ?? '—'}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-500 hidden md:table-cell">{timeAgo(u.created_at)}</td>
                            <td className="px-4 py-3 text-xs text-gray-500 hidden lg:table-cell">{timeAgo(u.last_sign_in_at)}</td>
                            <td className="px-4 py-3 text-center hidden md:table-cell">
                              {userCopros.length > 0 ? (
                                <div className="flex flex-col items-center">
                                  <span className="text-sm font-bold text-gray-800">{userCopros.length}</span>
                                  <div className="flex gap-1 mt-0.5 flex-wrap justify-center max-w-[140px]">
                                    {userCopros.slice(0, 2).map((c: { id: string; nom: string }) => (
                                      <span key={c.id} className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded truncate max-w-[60px]">{c.nom}</span>
                                    ))}
                                    {userCopros.length > 2 && <span className="text-[10px] text-gray-400">+{userCopros.length - 2}</span>}
                                  </div>
                                </div>
                              ) : <span className="text-xs text-gray-300">—</span>}
                            </td>
                            <td className="px-4 py-3">
                              {u.email_confirmed_at ? (
                                <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 rounded-md px-2 py-0.5"><span className="w-1.5 h-1.5 rounded-full bg-green-500" />Vérifié</span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2 py-0.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" />En attente</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <AdminUserActions userId={u.id} userEmail={u.email ?? ''} isConfirmed={!!u.email_confirmed_at} isSelf={u.email === ADMIN_EMAIL} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ══════════ MEMBRES ══════════ */}
            {tab === 'members' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <SectionTitle icon={Users} title="Membres copropriétaires" sub={`${memberUsers.length} comptes membres`} />
                  <div className="flex gap-2 text-xs">
                    <span className="bg-green-50 text-green-700 px-2 py-1 rounded-md font-medium">{memberUsers.filter(u => !!u.email_confirmed_at).length} vérifiés</span>
                    <span className="bg-amber-50 text-amber-700 px-2 py-1 rounded-md font-medium">{memberUsers.filter(u => !u.email_confirmed_at).length} en attente</span>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  {[
                    { label: 'Invitations envoyées', value: (invitations ?? []).length, color: 'text-blue-700', bg: 'bg-blue-50 border-blue-100' },
                    { label: 'Acceptées', value: (invitations ?? []).filter(i => i.statut === 'acceptee').length, color: 'text-green-700', bg: 'bg-green-50 border-green-100' },
                    { label: 'En attente / expirées', value: (invitations ?? []).filter(i => i.statut === 'en_attente').length, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-100' },
                  ].map(({ label, value, color, bg }) => (
                    <div key={label} className={`rounded-xl border p-4 ${bg}`}>
                      <p className={`text-2xl font-bold ${color}`}>{value}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email / Nom</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Inscription</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Dernière connexion</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Statut</th>
                        <th className="px-4 py-3 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {memberUsers.length === 0 && (
                        <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">Aucun membre inscrit</td></tr>
                      )}
                      {memberUsers.map((u) => {
                        const meta = u.user_metadata as Record<string, string> | null;
                        return (
                          <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                  <span className="text-xs font-bold text-green-600">{(u.email ?? '?')[0].toUpperCase()}</span>
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium truncate text-gray-800">{u.email}</p>
                                  <p className="text-xs text-gray-400">{meta?.full_name ?? '—'}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-500 hidden md:table-cell">{timeAgo(u.created_at)}</td>
                            <td className="px-4 py-3 text-xs text-gray-500 hidden lg:table-cell">{timeAgo(u.last_sign_in_at)}</td>
                            <td className="px-4 py-3">
                              {u.email_confirmed_at ? (
                                <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 rounded-md px-2 py-0.5"><span className="w-1.5 h-1.5 rounded-full bg-green-500" />Vérifié</span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2 py-0.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" />En attente</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <AdminUserActions userId={u.id} userEmail={u.email ?? ''} isConfirmed={!!u.email_confirmed_at} isSelf={false} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <section>
                  <SectionTitle icon={Send} title="Invitations récentes" sub="100 dernières" />
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50">
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email invité</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Copropriété</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Envoyée</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Expire</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Statut</th>
                          <th className="px-4 py-3" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {(invitations ?? []).length === 0 && (
                          <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">Aucune invitation</td></tr>
                        )}
                        {(invitations ?? []).map((inv) => {
                          const copro = (inv.coproprietes as unknown as { nom: string } | null);
                          const isExpired = inv.statut === 'en_attente' && new Date(inv.expires_at) < new Date();
                          const statut: string = isExpired ? 'expiree' : inv.statut;
                          const statutMap: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
                            en_attente: { label: 'En attente', cls: 'bg-amber-50 text-amber-700 border-amber-200', icon: <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> },
                            acceptee:   { label: 'Acceptée',   cls: 'bg-green-50 text-green-700 border-green-200', icon: <CheckCircle2 size={10} /> },
                            expiree:    { label: 'Expirée',    cls: 'bg-gray-100 text-gray-500 border-gray-200',   icon: <XCircle size={10} /> },
                            annulee:    { label: 'Annulée',    cls: 'bg-red-50 text-red-600 border-red-200',       icon: <XCircle size={10} /> },
                          };
                          const sc = statutMap[statut] ?? { label: statut, cls: 'bg-gray-100 text-gray-500 border-gray-200', icon: null };
                          return (
                            <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3 text-sm text-gray-800">{inv.email}</td>
                              <td className="px-4 py-3 text-xs text-gray-500 hidden md:table-cell">{copro?.nom ?? '—'}</td>
                              <td className="px-4 py-3 text-xs text-gray-500 hidden lg:table-cell">{timeAgo(inv.created_at)}</td>
                              <td className="px-4 py-3 text-xs text-gray-500 hidden lg:table-cell">{formatDate(inv.expires_at)}</td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center gap-1 text-xs border rounded-md px-2 py-0.5 font-medium ${sc.cls}`}>{sc.icon}{sc.label}</span>
                              </td>
                              <td className="px-4 py-3">
                                <AdminInvitationDelete invitationId={inv.id} email={inv.email} />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            )}

            {/* ══════════ ABONNEMENTS ══════════ */}
            {tab === 'subscriptions' && (
              <div className="space-y-6">
                <SectionTitle icon={CreditCard} title="Abonnements Stripe" sub="Synchronisé avec Stripe" />

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <KpiCard label="MRR" value={formatEuros(mrr)} sub="Mensuel récurrent" icon={TrendingUp} color="bg-emerald-100 text-emerald-600" />
                  <KpiCard label="ARR" value={formatEuros(arr)} sub="Annuel récurrent" icon={Banknote} color="bg-green-100 text-green-600" />
                  <KpiCard label="Abonnés actifs" value={nbActifs} sub={`sur ${nbCoproprietes} copropriétés`} icon={CreditCard} color="bg-blue-100 text-blue-600" />
                  <KpiCard label="Taux conversion" value={`${conversionPct} %`} sub="essai → abonnement" icon={BarChart3} color="bg-indigo-100 text-indigo-600" />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                    <p className="text-sm font-semibold text-gray-800 mb-4">Répartition des plans</p>
                    <div className="space-y-4">
                      {([
                        { id: 'essentiel', label: 'Essentiel', price: '300 €/an', color: 'bg-blue-500', textColor: 'text-blue-700' },
                        { id: 'confort',   label: 'Confort',   price: '360 €/an', color: 'bg-indigo-500', textColor: 'text-indigo-700' },
                        { id: 'illimite',  label: 'Illimité',  price: '540 €/an', color: 'bg-purple-500', textColor: 'text-purple-700' },
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
                                <span className="text-xs text-gray-400">{formatEuros(revenue)}/an</span>
                                <span className="font-bold text-gray-800">{nb}</span>
                              </div>
                            </div>
                            <ProgressBar value={pct} color={color} />
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-2 text-center text-xs">
                      <div><p className="font-bold text-gray-800">{nbEssai}</p><p className="text-amber-600">En essai</p></div>
                      <div><p className="font-bold text-gray-800">{nbInactif}</p><p className="text-gray-400">Inactifs</p></div>
                      <div><p className="font-bold text-red-600">{nbPasseDu}</p><p className="text-red-500">Impayés</p></div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                    <p className="text-sm font-semibold text-gray-800 mb-4">Indicateurs</p>
                    <div className="space-y-3">
                      {[
                        { label: 'Nouvelles copros (7j)',   value: recentCopros7?.length ?? 0, color: 'bg-green-500' },
                        { label: 'Nouvelles copros (30j)',  value: recentCopros30?.length ?? 0, color: 'bg-blue-500' },
                        { label: 'Nouveaux users (30j)',    value: newUsers30, color: 'bg-indigo-500' },
                        { label: 'Invitations en attente',  value: alertInvitationsExpirees.length, color: 'bg-amber-500' },
                        { label: 'Comptes non vérifiés',    value: nbUnconfirmed, color: 'bg-orange-400' },
                        { label: 'Abonnements impayés',     value: nbPasseDu, color: 'bg-red-500' },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${color}`} />
                            <span className="text-xs text-gray-600">{label}</span>
                          </div>
                          <span className="text-sm font-bold text-gray-800">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <section>
                  <p className="text-sm font-semibold text-gray-700 mb-3">Abonnés actifs ({abonnesActifs.length})</p>
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50">
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Copropriété</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Syndic</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Plan</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Fin période</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden xl:table-cell">Stripe Sub ID</th>
                          <th className="px-4 py-3 w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {abonnesActifs.length === 0 && (
                          <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">Aucun abonné actif</td></tr>
                        )}
                        {abonnesActifs.map((c) => {
                          const syndicProfile = c.profiles as { full_name?: string; email?: string } | null;
                          return (
                            <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3"><p className="font-medium text-gray-800">{c.nom}</p><p className="text-xs text-gray-400">{c.ville}</p></td>
                              <td className="px-4 py-3 hidden md:table-cell"><p className="text-xs text-gray-700">{syndicProfile?.full_name ?? '—'}</p><p className="text-xs text-gray-400">{syndicProfile?.email ?? ''}</p></td>
                              <td className="px-4 py-3"><PlanBadge plan={c.plan} planId={c.plan_id} /></td>
                              <td className="px-4 py-3 text-xs text-gray-500 hidden lg:table-cell">{formatDate(c.plan_period_end)}</td>
                              <td className="px-4 py-3 hidden xl:table-cell">
                                {c.stripe_subscription_id ? (
                                  <a href={`https://dashboard.stripe.com/subscriptions/${c.stripe_subscription_id}`} target="_blank" rel="noopener noreferrer"
                                    className="text-xs text-indigo-500 hover:text-indigo-700 font-mono truncate max-w-[140px] block">
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

                <section>
                  <p className="text-sm font-semibold text-gray-700 mb-3">Non abonnés ({inactifs.length})</p>
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50">
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Copropriété</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Syndic</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Plan</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Créée</th>
                          <th className="px-4 py-3 w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {inactifs.map((c) => {
                          const syndicProfile = c.profiles as { full_name?: string } | null;
                          return (
                            <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3"><p className="font-medium text-gray-800">{c.nom}</p><p className="text-xs text-gray-400">{c.ville}</p></td>
                              <td className="px-4 py-3 text-xs text-gray-500 hidden md:table-cell">{syndicProfile?.full_name ?? '—'}</td>
                              <td className="px-4 py-3"><PlanBadge plan={c.plan} planId={c.plan_id} /></td>
                              <td className="px-4 py-3 text-xs text-gray-500 hidden lg:table-cell">{formatDate(c.created_at)}</td>
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
              </div>
            )}

            {/* ══════════ COPROPRIÉTÉS ══════════ */}
            {tab === 'copros' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <SectionTitle icon={Building2} title="Toutes les copropriétés" sub={`${nbCoproprietes} au total`} />
                  <div className="flex gap-2 text-xs flex-wrap">
                    <span className="bg-amber-50 text-amber-700 px-2 py-1 rounded-md font-medium">{nbEssai} essai</span>
                    <span className="bg-green-50 text-green-700 px-2 py-1 rounded-md font-medium">{nbActifs} actives</span>
                    {nbPasseDu > 0 && <span className="bg-red-50 text-red-600 px-2 py-1 rounded-md font-medium">{nbPasseDu} impayées</span>}
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Copropriété</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Syndic</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Lots</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">AG</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Incidents</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Dépenses</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Plan</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden xl:table-cell">Créée</th>
                        <th className="px-4 py-3 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {coprosTyped.map((c) => {
                        const syndicProfile = c.profiles as { full_name?: string } | null;
                        const dep = depCount[c.id];
                        const openInc = incidentCount[c.id] ?? 0;
                        return (
                          <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3"><p className="font-medium text-gray-800">{c.nom}</p><p className="text-xs text-gray-400">{c.ville}</p></td>
                            <td className="px-4 py-3 text-xs text-gray-600 hidden md:table-cell">{syndicProfile?.full_name ?? '—'}</td>
                            <td className="px-4 py-3 text-center">
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold">{lotsCount[c.id] ?? 0}</span>
                            </td>
                            <td className="px-4 py-3 text-center text-gray-600 hidden lg:table-cell text-xs">{agCount[c.id] ?? 0}</td>
                            <td className="px-4 py-3 text-center hidden lg:table-cell">
                              {openInc > 0
                                ? <span className="inline-flex items-center justify-center text-xs font-bold text-red-600 bg-red-50 rounded-full w-6 h-6">{openInc}</span>
                                : <span className="text-xs text-gray-300">—</span>}
                            </td>
                            <td className="px-4 py-3 text-right text-gray-700 hidden lg:table-cell text-xs font-medium">{dep ? formatEuros(dep.total) : '—'}</td>
                            <td className="px-4 py-3 hidden md:table-cell"><PlanBadge plan={c.plan} planId={c.plan_id} /></td>
                            <td className="px-4 py-3 text-gray-400 hidden xl:table-cell text-xs">{formatDate(c.created_at)}</td>
                            <td className="px-4 py-3">
                              <AdminCoproActions coproId={c.id} coproNom={c.nom} currentPlan={c.plan ?? 'essai'} currentPlanId={c.plan_id ?? null} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </AdminTabs>

      {/* ── Footer ── */}
      <div className="flex items-center gap-2 text-xs text-gray-400 pt-4 border-t border-gray-200">
        <Clock size={12} />
        <span>Données en temps réel — {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
      </div>

    </div>
  );
}

