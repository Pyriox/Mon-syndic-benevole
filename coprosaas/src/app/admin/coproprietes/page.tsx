// ============================================================
// Admin — Copropriétés + Abonnements
// Onglet "Copropriétés" : vue opérationnelle (lots, incidents, dépenses)
// Onglet "Abonnements"  : vue financière (MRR, Stripe, renouvellements)
// ============================================================
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import AdminCoproActions from '../AdminCoproActions';
import AdminImpersonate from '../AdminImpersonate';
import AdminCoproFilters from '../AdminCoproFilters';
import AdminCoproTabs from '../AdminCoproTabs';
import AdminSearch from '../AdminSearch';
import AdminPagination from '../AdminPagination';
import { Suspense } from 'react';
import {
  Building2, DoorOpen, Users,
  CreditCard, TrendingUp, Banknote, BarChart3, Clock,
  CheckCircle2, XCircle, ExternalLink,
} from 'lucide-react';
import { isAdminUser } from '@/lib/admin-config';
import { stripe } from '@/lib/stripe';

const MRR_PRICES: Record<string, number> = { essentiel: 25, confort: 30, illimite: 45 };
const ARR_PRICES: Record<string, number> = { essentiel: 300, confort: 360, illimite: 540 };

function fmtDate(s: string | null | undefined) {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtEur(n: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

type CoproRow = {
  id: string;
  nom: string;
  adresse: string | null;
  code_postal: string | null;
  ville: string | null;
  nombre_lots: number | null;
  plan: string | null;
  plan_id: string | null;
  syndic_id: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan_period_end: string | null;
  created_at: string;
  profiles: { full_name?: string; email?: string } | null;
};

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
  if (plan === 'resilie')  return <span className="inline-flex text-xs px-2 py-0.5 rounded-md font-medium bg-orange-50 text-orange-600 border border-orange-200">Résilié</span>;
  if (plan === 'inactif')  return <span className="inline-flex text-xs px-2 py-0.5 rounded-md font-medium bg-gray-100 text-gray-500 border border-gray-200">Inactif</span>;
  return <span className="inline-flex text-xs px-2 py-0.5 rounded-md font-medium bg-amber-50 text-amber-700 border border-amber-200">Essai</span>;
}

export default async function AdminCopropietesPage({
  searchParams,
}: {
  searchParams: Promise<{
    plan?: string;
    tab?: string;
    q?: string;
    page?: string;
    sort?: string;
    order?: string;
    orphaned?: string;
    no_lots?: string;
    no_members?: string;
    risk?: string;
  }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await isAdminUser(user.id, supabase))) redirect('/dashboard');

  const {
    plan: planFilter,
    tab: tabParam,
    q,
    page,
    sort,
    order,
    orphaned,
    no_lots,
    no_members,
    risk,
  } = await searchParams;
  const query = q?.trim().toLowerCase() ?? '';
  const currentPage = Math.max(1, Number(page) || 1);
  const PAGE_SIZE = 20;
  const sortBy = sort === 'name' || sort === 'health' || sort === 'incidents' || sort === 'depenses' || sort === 'lots' || sort === 'members'
    ? sort
    : 'created';
  const sortOrder = order === 'asc' ? 'asc' : 'desc';
  const filterOrphaned = orphaned === '1';
  const filterNoLots = no_lots === '1';
  const filterNoMembers = no_members === '1';
  const filterRisk = risk === 'high';
  const activeTab = tabParam === 'abonnements' ? 'abonnements' : 'coproprietes';

  const admin = createAdminClient();

  const baseSelect = 'id, nom, adresse, code_postal, ville, nombre_lots, plan, plan_id, syndic_id, stripe_customer_id, stripe_subscription_id, plan_period_end, created_at, profiles!coproprietes_syndic_id_fkey(full_name, email)';
  const applyServerFilters = <T,>(queryBuilder: T) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let qBuilder = queryBuilder as any;
    if (activeTab === 'coproprietes' && planFilter) {
      if (planFilter === 'essai') qBuilder = qBuilder.or('plan.is.null,plan.eq.essai');
      else qBuilder = qBuilder.eq('plan', planFilter);
    }
    if (activeTab === 'coproprietes' && query) {
      qBuilder = qBuilder.or(`nom.ilike.%${query}%,ville.ilike.%${query}%,code_postal.ilike.%${query}%`);
    }
    return qBuilder;
  };

  const sortIsServerNative = sortBy === 'created' || sortBy === 'name';
  const hasClientOnlyFilters = filterOrphaned || filterNoLots || filterNoMembers || filterRisk || !sortIsServerNative;

  const [{ data: coproStatsRows }, { data: adminRows }] = await Promise.all([
    admin.from('coproprietes').select('id, nom, plan, plan_id, stripe_customer_id, plan_period_end'),
    admin.from('admin_users').select('user_id'),
  ]);

  let coproprietes: CoproRow[] = [];
  let serverTotalCount = 0;

  if (activeTab === 'coproprietes' && !hasClientOnlyFilters) {
    const countQuery = applyServerFilters(admin.from('coproprietes').select('id', { count: 'exact', head: true }));
    const { count } = await countQuery;
    serverTotalCount = count ?? 0;

    const rangeStart = (currentPage - 1) * PAGE_SIZE;
    const rangeEnd = rangeStart + PAGE_SIZE - 1;
    const orderCol = sortBy === 'name' ? 'nom' : 'created_at';
    const dataQuery = applyServerFilters(admin.from('coproprietes').select(baseSelect))
      .order(orderCol, { ascending: sortOrder === 'asc' })
      .range(rangeStart, rangeEnd);
    const { data } = await dataQuery;
    coproprietes = (data ?? []) as CoproRow[];
  } else {
    const baseQuery = admin.from('coproprietes').select(baseSelect);
    const dataQuery = activeTab === 'coproprietes'
      ? applyServerFilters(baseQuery)
      : baseQuery;
    const { data } = await dataQuery.order('created_at', { ascending: false });
    coproprietes = (data ?? []) as CoproRow[];
    serverTotalCount = coproprietes.length;
  }

  const adminUserIds = new Set((adminRows ?? []).map((r) => r.user_id as string));

  const coprosTyped = coproprietes;
  const coprosStatsTyped = (coproStatsRows ?? []) as Pick<CoproRow, 'id' | 'nom' | 'plan' | 'plan_id' | 'stripe_customer_id' | 'plan_period_end'>[];
  const nbCoproprietes = coprosStatsTyped.length;
  const nbActifs  = coprosStatsTyped.filter((c) => c.plan === 'actif').length;
  const nbEssai   = coprosStatsTyped.filter((c) => !c.plan || c.plan === 'essai').length;
  const nbInactif = coprosStatsTyped.filter((c) => c.plan === 'inactif').length;
  const nbResilie = coprosStatsTyped.filter((c) => c.plan === 'resilie').length;
  const nbPasseDu = coprosStatsTyped.filter((c) => c.plan === 'passe_du').length;

  // ── Données opérationnelles (onglet coproprietes uniquement) ──
  let lotsParCopro: { copropriete_id: string }[] = [];
  let coproprietairesData: { copropriete_id: string }[] = [];
  let agParCopro: { copropriete_id: string }[] = [];
  let depParCopro: { copropriete_id: string; montant: number }[] = [];
  let incidentsParCopro: { copropriete_id: string; statut: string }[] = [];

  if (activeTab === 'coproprietes') {
    const [l, cp, ag, dep, inc] = await Promise.all([
      admin.from('lots').select('copropriete_id'),
      admin.from('coproprietaires').select('copropriete_id'),
      admin.from('assemblees_generales').select('copropriete_id'),
      admin.from('depenses').select('copropriete_id, montant'),
      admin.from('incidents').select('copropriete_id, statut'),
    ]);
    lotsParCopro        = l.data ?? [];
    coproprietairesData = cp.data ?? [];
    agParCopro          = ag.data ?? [];
    depParCopro         = dep.data ?? [];
    incidentsParCopro   = inc.data ?? [];
  }

  // ── Données Stripe (onglet abonnements uniquement) ──
  type StripeCharge = { id: string; amount: number; status: string; created: number; customerId: string | null; description: string | null };
  let stripeCharges: StripeCharge[] = [];
  if (activeTab === 'abonnements') {
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
  }

  // ── Lookup maps (onglet coproprietes) ──
  const lotsCount: Record<string, number> = {};
  for (const l of lotsParCopro) lotsCount[l.copropriete_id] = (lotsCount[l.copropriete_id] ?? 0) + 1;
  const coproCount: Record<string, number> = {};
  for (const cp of coproprietairesData) coproCount[cp.copropriete_id] = (coproCount[cp.copropriete_id] ?? 0) + 1;
  const agCount: Record<string, number> = {};
  for (const a of agParCopro) agCount[a.copropriete_id] = (agCount[a.copropriete_id] ?? 0) + 1;
  const depCount: Record<string, number> = {};
  for (const d of depParCopro) depCount[d.copropriete_id] = (depCount[d.copropriete_id] ?? 0) + d.montant;
  const incidentCount: Record<string, number> = {};
  for (const i of incidentsParCopro) {
    if (i.statut !== 'resolu') incidentCount[i.copropriete_id] = (incidentCount[i.copropriete_id] ?? 0) + 1;
  }

  const getHealthScore = (c: CoproRow): number => {
    let score = 100;
    const openInc = incidentCount[c.id] ?? 0;
    const lots = lotsCount[c.id] ?? 0;
    const members = coproCount[c.id] ?? 0;

    if (c.plan === 'passe_du') score -= 35;
    else if (c.plan === 'inactif') score -= 20;
    else if (c.plan === 'resilie') score -= 15;
    score -= Math.min(openInc * 10, 40);
    if (lots === 0) score -= 15;
    if (members === 0) score -= 10;

    return Math.max(0, Math.min(100, score));
  };

  const displayedCopros = activeTab === 'coproprietes'
    ? coprosTyped.filter((c) => {
        if (hasClientOnlyFilters && planFilter) {
          if (planFilter === 'essai') {
            if (c.plan && c.plan !== 'essai') return false;
          } else if (c.plan !== planFilter) {
            return false;
          }
        }

        if (hasClientOnlyFilters && query) {
          const haystack = `${c.nom ?? ''} ${c.ville ?? ''} ${c.code_postal ?? ''}`.toLowerCase();
          if (!haystack.includes(query)) return false;
        }

        if (filterOrphaned && !!c.syndic_id) return false;
        if (filterNoLots && (lotsCount[c.id] ?? 0) > 0) return false;
        if (filterNoMembers && (coproCount[c.id] ?? 0) > 0) return false;
        if (filterRisk && getHealthScore(c) > 59) return false;

        return true;
      })
    : coprosTyped;

  const sortedCopros = [...displayedCopros].sort((a, b) => {
    if (sortBy === 'health') {
      const av = getHealthScore(a);
      const bv = getHealthScore(b);
      return sortOrder === 'asc' ? av - bv : bv - av;
    }
    if (sortBy === 'incidents') {
      const av = incidentCount[a.id] ?? 0;
      const bv = incidentCount[b.id] ?? 0;
      return sortOrder === 'asc' ? av - bv : bv - av;
    }
    if (sortBy === 'depenses') {
      const av = depCount[a.id] ?? 0;
      const bv = depCount[b.id] ?? 0;
      return sortOrder === 'asc' ? av - bv : bv - av;
    }
    if (sortBy === 'lots') {
      const av = lotsCount[a.id] ?? 0;
      const bv = lotsCount[b.id] ?? 0;
      return sortOrder === 'asc' ? av - bv : bv - av;
    }
    if (sortBy === 'members') {
      const av = coproCount[a.id] ?? 0;
      const bv = coproCount[b.id] ?? 0;
      return sortOrder === 'asc' ? av - bv : bv - av;
    }
    if (sortBy === 'name') {
      return sortOrder === 'asc' ? a.nom.localeCompare(b.nom) : b.nom.localeCompare(a.nom);
    }
    const av = new Date(a.created_at).getTime();
    const bv = new Date(b.created_at).getTime();
    return sortOrder === 'asc' ? av - bv : bv - av;
  });

  const totalItems = activeTab === 'coproprietes' && !hasClientOnlyFilters ? serverTotalCount : sortedCopros.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const pagedCopros = activeTab === 'coproprietes' && !hasClientOnlyFilters
    ? sortedCopros
    : sortedCopros.slice(start, start + PAGE_SIZE);

  const hrefWith = (next: Partial<{ plan: string; tab: string; q: string; page: string; sort: string; order: string; orphaned: string; no_lots: string; no_members: string; risk: string }>) => {
    const params = new URLSearchParams();
    const valueTab = next.tab ?? activeTab;
    const valuePlan = next.plan ?? planFilter ?? '';
    const valueQ = next.q ?? q ?? '';
    const valuePage = next.page ?? String(safePage);
    const valueSort = next.sort ?? sortBy;
    const valueOrder = next.order ?? sortOrder;
    const valueOrphaned = next.orphaned ?? (filterOrphaned ? '1' : '0');
    const valueNoLots = next.no_lots ?? (filterNoLots ? '1' : '0');
    const valueNoMembers = next.no_members ?? (filterNoMembers ? '1' : '0');
    const valueRisk = next.risk ?? (filterRisk ? 'high' : '');

    if (valueTab !== 'coproprietes') params.set('tab', valueTab);
    if (valuePlan) params.set('plan', valuePlan);
    if (valueQ) params.set('q', valueQ);
    if (valuePage !== '1') params.set('page', valuePage);
    if (valueSort !== 'created') params.set('sort', valueSort);
    if (valueOrder !== 'desc') params.set('order', valueOrder);
    if (valueOrphaned === '1') params.set('orphaned', '1');
    if (valueNoLots === '1') params.set('no_lots', '1');
    if (valueNoMembers === '1') params.set('no_members', '1');
    if (valueRisk === 'high') params.set('risk', 'high');
    return `/admin/coproprietes${params.toString() ? `?${params.toString()}` : ''}`;
  };

  // ── Calculs abonnements ──
  const planBreakdown: Record<string, number> = { essentiel: 0, confort: 0, illimite: 0 };
  for (const c of coprosStatsTyped) {
    if (c.plan === 'actif' && c.plan_id) planBreakdown[c.plan_id] = (planBreakdown[c.plan_id] ?? 0) + 1;
  }
  const mrr = Object.entries(planBreakdown).reduce((sum, [id, nb]) => sum + (MRR_PRICES[id] ?? 0) * nb, 0);
  const arr = Object.entries(planBreakdown).reduce((sum, [id, nb]) => sum + (ARR_PRICES[id] ?? 0) * nb, 0);
  const conversionPct = coprosStatsTyped.length > 0 ? Math.round((nbActifs / coprosStatsTyped.length) * 100) : 0;
  const nowIso = new Date().toISOString();
  const in14d = new Date(new Date(nowIso).getTime() + 14 * 86400000).toISOString();
  const upcomingRenewals = coprosStatsTyped.filter((c) =>
    c.plan === 'actif' && c.plan_period_end && c.plan_period_end >= nowIso && c.plan_period_end <= in14d
  );
  const customerToCopro: Record<string, string> = {};
  for (const c of coprosTyped) {
    if (c.stripe_customer_id) customerToCopro[c.stripe_customer_id] = c.nom;
  }
  const coprosForAbonnements = [...coprosTyped].sort((a, b) => (b.plan ?? '').localeCompare(a.plan ?? ''));

  return (
    <div className="space-y-6 pb-16">
      {/* ── Header + Tabs ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Copropriétés</h1>
          <p className="text-sm text-gray-500 mt-1">
            {activeTab === 'coproprietes'
              ? 'Vue opérationnelle. Modifications via les actions disponibles.'
              : 'Données Supabase + Stripe. Pour modifier un abonnement, utiliser Stripe puis « Sync depuis Stripe ».'}
          </p>
        </div>
        <Suspense>
          <AdminCoproTabs activeTab={activeTab} />
        </Suspense>
      </div>

      {activeTab === 'coproprietes' ? (
        <>
          <Suspense><AdminSearch placeholder="Rechercher une copropriete, ville, CP..." defaultValue={q ?? ''} /></Suspense>

          {/* ── Stats ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total copropriétés',   value: nbCoproprietes,          icon: Building2, color: 'bg-blue-100 text-blue-600' },
              { label: 'Abonnées actives',      value: nbActifs,                icon: Building2, color: 'bg-green-100 text-green-600' },
              { label: 'En essai',              value: nbEssai,                 icon: Building2, color: 'bg-amber-100 text-amber-600' },
              { label: 'Inactives / résiliées / impayées',  value: nbInactif + nbResilie + nbPasseDu,  icon: Building2, color: nbPasseDu > 0 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-400' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-start gap-4">
                <div className={`p-3 rounded-xl ${color} shrink-0`}><Icon size={18} /></div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Filtres rapides ── */}
          <Suspense>
            <AdminCoproFilters
              counts={{
                essai: nbEssai,
                actif: nbActifs,
                inactif: nbInactif,
                resilie: nbResilie,
                passe_du: nbPasseDu,
                total: nbCoproprietes,
                lots: lotsParCopro.length,
                coproprietaires: coproprietairesData.length,
              }}
              activePlan={planFilter ?? ''}
            />
          </Suspense>

          <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Link
                href={hrefWith({ orphaned: filterOrphaned ? '0' : '1', page: '1' })}
                className={`px-2.5 py-1 rounded-full border font-medium ${filterOrphaned ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300'}`}
              >
                Sans syndic
              </Link>
              <Link
                href={hrefWith({ no_lots: filterNoLots ? '0' : '1', page: '1' })}
                className={`px-2.5 py-1 rounded-full border font-medium ${filterNoLots ? 'bg-orange-600 border-orange-600 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-orange-300'}`}
              >
                Sans lots
              </Link>
              <Link
                href={hrefWith({ no_members: filterNoMembers ? '0' : '1', page: '1' })}
                className={`px-2.5 py-1 rounded-full border font-medium ${filterNoMembers ? 'bg-teal-600 border-teal-600 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-teal-300'}`}
              >
                Sans coproprietaires
              </Link>
              <Link
                href={hrefWith({ risk: filterRisk ? '' : 'high', page: '1' })}
                className={`px-2.5 py-1 rounded-full border font-medium ${filterRisk ? 'bg-red-600 border-red-600 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-red-300'}`}
              >
                Risque eleve
              </Link>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {([
                { key: 'created:desc', label: 'Recents' },
                { key: 'name:asc', label: 'Nom A-Z' },
                { key: 'health:asc', label: 'Sante critique' },
                { key: 'incidents:desc', label: 'Incidents' },
              ] as const).map((item) => {
                const [nextSort, nextOrder] = item.key.split(':');
                const active = sortBy === nextSort && sortOrder === nextOrder;
                return (
                  <Link
                    key={item.key}
                    href={hrefWith({ sort: nextSort, order: nextOrder, page: '1' })}
                    className={`px-2.5 py-1 rounded-full border font-medium ${active ? 'bg-gray-800 text-white border-gray-800' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'}`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
            <p className="text-gray-500">
              {totalItems} resultat{totalItems > 1 ? 's' : ''}
            </p>
          </div>

          {/* ── Table copropriétés ── */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Copropriété</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Syndic</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    <DoorOpen size={11} className="inline mr-0.5" />Lots
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">
                    <Users size={11} className="inline mr-0.5" />Copro.
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">AG</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell" title="Incidents ouverts (non résolus)">Inc.</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden xl:table-cell">Dépenses</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Sante</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Plan</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden xl:table-cell">Créée</th>
                  <th className="px-4 py-3 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pagedCopros.length === 0 && (
                  <tr><td colSpan={11} className="px-4 py-8 text-center text-sm text-gray-400">Aucune copropriété pour ce filtre</td></tr>
                )}
                {pagedCopros.map((c) => {
                  const profile = c.profiles as { full_name?: string; email?: string } | null;
                  const openInc = incidentCount[c.id] ?? 0;
                  const health = getHealthScore(c);
                  const healthCls = health >= 80
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : health >= 60
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-red-50 text-red-700 border-red-200';
                  return (
                    <tr key={c.id} className={`hover:bg-gray-50 transition-colors ${c.plan === 'passe_du' ? 'bg-red-50/30' : ''}`}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{c.nom}</p>
                        <p className="text-xs text-gray-400">{c.ville}</p>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <p className="text-xs text-gray-700 truncate max-w-[130px]">{profile?.full_name ?? '—'}</p>
                        <p className="text-xs text-gray-400 truncate max-w-[130px]">{profile?.email ?? ''}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold">
                          {lotsCount[c.id] ?? 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center hidden md:table-cell">
                        <span className="text-xs text-gray-600 font-medium">{coproCount[c.id] ?? 0}</span>
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-gray-600 hidden lg:table-cell">{agCount[c.id] ?? 0}</td>
                      <td className="px-4 py-3 text-center hidden lg:table-cell">
                        {openInc > 0
                          ? <span className="inline-flex items-center justify-center text-xs font-bold text-red-600 bg-red-50 rounded-full w-6 h-6">{openInc}</span>
                          : <span className="text-xs text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-medium text-gray-700 hidden xl:table-cell">
                        {depCount[c.id] ? fmtEur(depCount[c.id]) : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex min-w-12 justify-center text-xs px-2 py-1 rounded-md border font-semibold ${healthCls}`}>
                          {health}
                        </span>
                      </td>
                      <td className="px-4 py-3"><PlanBadge plan={c.plan} planId={c.plan_id} /></td>
                      <td className="px-4 py-3 text-xs text-gray-400 hidden xl:table-cell">{fmtDate(c.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          {typeof profile?.email === 'string' && profile.email.length > 0 && (!c.syndic_id || !adminUserIds.has(c.syndic_id)) && (
                            <AdminImpersonate email={profile.email} iconOnly />
                          )}
                          <AdminCoproActions coproId={c.id} coproNom={c.nom} currentPlan={c.plan ?? 'essai'} currentPlanId={c.plan_id ?? null} isOrphaned={!c.syndic_id} adresse={c.adresse} codePostal={c.code_postal} ville={c.ville} nombreLots={c.nombre_lots} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <AdminPagination
            currentPage={safePage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={PAGE_SIZE}
            prevHref={hrefWith({ page: String(Math.max(1, safePage - 1)) })}
            nextHref={hrefWith({ page: String(Math.min(totalPages, safePage + 1)) })}
          />
        </>
      ) : (
        <div className="space-y-8">
          {/* ── KPIs ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {([
              { label: 'MRR',               value: fmtEur(mrr),           sub: `ARR : ${fmtEur(arr)}`,                            icon: Banknote,   color: 'bg-emerald-100 text-emerald-600' },
              { label: 'Abonnés actifs',    value: nbActifs,               sub: `taux conv. ${conversionPct} %`,                   icon: CreditCard, color: 'bg-blue-100 text-blue-600' },
              { label: 'Trials',            value: nbEssai,                sub: 'Essai gratuit',                                   icon: TrendingUp, color: 'bg-amber-100 text-amber-600' },
              { label: 'Impayés/Inactifs',  value: nbPasseDu + nbInactif,  sub: `${nbPasseDu} impayés · ${nbInactif} inactifs`,   icon: BarChart3,  color: nbPasseDu > 0 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-400' },
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
                <div><p className="font-bold text-gray-500">{nbInactif}</p><p className="text-gray-500">Inactifs</p></div>
                <div><p className="font-bold text-red-600">{nbPasseDu}</p><p className="text-red-600">Impayés</p></div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <p className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Clock size={14} className="text-amber-700" />
                Renouvellements &lt; 14 jours
                {upcomingRenewals.length > 0 && (
                  <span className="ml-auto text-xs bg-amber-100 text-amber-700 rounded-full px-2 py-0.5 font-semibold">{upcomingRenewals.length}</span>
                )}
              </p>
              {upcomingRenewals.length === 0 ? (
                <p className="text-sm text-gray-500 py-4 text-center">Aucun renouvellement imminent</p>
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
                <p className="text-xs text-gray-400">Modification de plan : via Stripe uniquement, puis « Sync depuis Stripe ».</p>
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
                  {coprosForAbonnements.map((c) => {
                    const profile = c.profiles as { email?: string } | null;
                    return (
                      <tr key={c.id} className={`hover:bg-gray-50 transition-colors ${c.plan === 'passe_du' ? 'bg-red-50/30' : ''}`}>
                        <td className="px-4 py-3"><p className="font-medium text-gray-800">{c.nom}</p></td>
                        <td className="px-4 py-3 text-xs text-gray-500 hidden md:table-cell truncate max-w-[180px]">{profile?.email ?? '—'}</td>
                        <td className="px-4 py-3"><PlanBadge plan={c.plan} planId={c.plan_id} /></td>
                        <td className="px-4 py-3 text-xs text-gray-600 hidden lg:table-cell">{fmtDate(c.plan_period_end)}</td>
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
                          <AdminCoproActions coproId={c.id} coproNom={c.nom} currentPlan={c.plan ?? 'essai'} currentPlanId={c.plan_id ?? null} adresse={c.adresse} codePostal={c.code_postal} ville={c.ville} nombreLots={c.nombre_lots} />
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
                              <span className="flex items-center gap-1 text-xs font-medium text-green-600"><CheckCircle2 size={12} /> Réussi</span>
                            ) : isFailed ? (
                              <span className="flex items-center gap-1 text-xs font-medium text-red-600"><XCircle size={12} /> Échoué</span>
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
      )}
    </div>
  );
}
