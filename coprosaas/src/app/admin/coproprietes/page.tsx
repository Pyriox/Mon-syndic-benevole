// ============================================================
// Admin — Copropriétés (vue opérationnelle : lots, incidents, dépenses)
// La vue financière (abonnements) est sur /admin/abonnements
// ============================================================
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import AdminCoproActions from '../AdminCoproActions';
import AdminImpersonate from '../AdminImpersonate';
import AdminCoproFilters from '../AdminCoproFilters';
import AdminSearch from '../AdminSearch';
import AdminPagination from '../AdminPagination';
import AdminStatCard from '../AdminStatCard';
import { Suspense } from 'react';
import {
  Building2, DoorOpen, Users,
  ExternalLink,
} from 'lucide-react';
import { isAdminUser } from '@/lib/admin-config';
import { appendAdminFrom, buildAdminListHref } from '@/lib/admin-list-params';
import { formatAdminCurrency, formatAdminDate } from '@/lib/admin-format';
import { PlanBadge } from '../AdminBadges';

/** Quand plan_period_end est absent pour un essai, on estime la fin à created_at + 14 jours. */
function trialEndEstimate(createdAt: string): string {
  return new Date(new Date(createdAt).getTime() + 14 * 86400 * 1000).toISOString();
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
  plan_cancel_at_period_end: boolean | null;
  created_at: string;
  profiles: { full_name?: string; email?: string } | null;
};


export default async function AdminCopropietesPage({
  searchParams,
}: {
  searchParams: Promise<{
    plan?: string;
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
  const sortBy = sort === 'name' || sort === 'health' || sort === 'incidents' || sort === 'depenses' || sort === 'lots' || sort === 'members' || sort === 'renewal'
    ? sort
    : 'created';
  const sortOrder = order === 'asc' ? 'asc' : 'desc';
  const filterOrphaned = orphaned === '1';
  const filterNoLots = no_lots === '1';
  const filterNoMembers = no_members === '1';
  const filterRisk = risk === 'high';

  const admin = createAdminClient();

  const baseSelect = 'id, nom, adresse, code_postal, ville, nombre_lots, plan, plan_id, syndic_id, stripe_customer_id, stripe_subscription_id, plan_period_end, plan_cancel_at_period_end, created_at, profiles!coproprietes_syndic_id_fkey(full_name, email)';
  const applyServerFilters = <T,>(queryBuilder: T) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let qBuilder = queryBuilder as any;
    if (planFilter) {
      if (planFilter === 'essai') qBuilder = qBuilder.or('plan.is.null,plan.eq.essai');
      else qBuilder = qBuilder.eq('plan', planFilter);
    }
    if (query) {
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

  if (!hasClientOnlyFilters) {
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
    const dataQuery = applyServerFilters(baseQuery);
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

  // ── Données opérationnelles ──
  let lotsParCopro: { copropriete_id: string }[] = [];
  let coproprietairesData: { copropriete_id: string }[] = [];
  let agParCopro: { copropriete_id: string }[] = [];
  let depParCopro: { copropriete_id: string; montant: number }[] = [];
  let incidentsParCopro: { copropriete_id: string; statut: string }[] = [];

  const scopedCoproIds = !hasClientOnlyFilters ? coprosTyped.map((copro) => copro.id) : [];

  const scopeByCoproId = <T,>(queryBuilder: T) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let qBuilder = queryBuilder as any;
    if (scopedCoproIds.length > 0) {
      qBuilder = qBuilder.in('copropriete_id', scopedCoproIds);
    }
    return qBuilder;
  };

  const [l, cp, ag, dep, inc] = await Promise.all([
    scopeByCoproId(admin.from('lots').select('copropriete_id')),
    scopeByCoproId(admin.from('coproprietaires').select('copropriete_id')),
    scopeByCoproId(admin.from('assemblees_generales').select('copropriete_id')),
    scopeByCoproId(admin.from('depenses').select('copropriete_id, montant')),
    scopeByCoproId(admin.from('incidents').select('copropriete_id, statut')),
  ]);
  lotsParCopro = l.data ?? [];
  coproprietairesData = cp.data ?? [];
  agParCopro = ag.data ?? [];
  depParCopro = dep.data ?? [];
  incidentsParCopro = inc.data ?? [];

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

  const getHealthDetails = (c: CoproRow): string[] => {
    const details: string[] = [];
    const openInc = incidentCount[c.id] ?? 0;
    const lots = lotsCount[c.id] ?? 0;
    const members = coproCount[c.id] ?? 0;

    if (lots === 0) details.push('0 lot');
    if (members === 0) details.push('0 copropriétaire');
    if (openInc > 0) details.push(`${openInc} incident${openInc > 1 ? 's' : ''} ouvert${openInc > 1 ? 's' : ''}`);
    if (c.plan === 'passe_du') details.push('plan impayé');
    if (c.plan === 'inactif') details.push('plan inactif');
    if (c.plan === 'resilie') details.push('plan résilié');

    return details.length > 0 ? details : ['Aucun signal'];
  };

  const displayedCopros = coprosTyped.filter((c) => {
        if (planFilter) {
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
      });

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
    if (sortBy === 'renewal') {
      const av = (a.plan === 'actif' || a.plan === 'essai' || !a.plan) && a.plan_period_end ? new Date(a.plan_period_end).getTime() : Number.POSITIVE_INFINITY;
      const bv = (b.plan === 'actif' || b.plan === 'essai' || !b.plan) && b.plan_period_end ? new Date(b.plan_period_end).getTime() : Number.POSITIVE_INFINITY;

      if (!Number.isFinite(av) && !Number.isFinite(bv)) return 0;
      if (!Number.isFinite(av)) return 1;
      if (!Number.isFinite(bv)) return -1;

      return sortOrder === 'asc' ? av - bv : bv - av;
    }
    const av = new Date(a.created_at).getTime();
    const bv = new Date(b.created_at).getTime();
    return sortOrder === 'asc' ? av - bv : bv - av;
  });

  const totalItems = !hasClientOnlyFilters ? serverTotalCount : sortedCopros.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const pagedCopros = !hasClientOnlyFilters
    ? sortedCopros
    : sortedCopros.slice(start, start + PAGE_SIZE);

  const hrefWith = (next: Partial<{ plan: string; q: string; page: string; sort: string; order: string; orphaned: string; no_lots: string; no_members: string; risk: string }>) => buildAdminListHref(
    '/admin/coproprietes',
    {
      plan: next.plan ?? planFilter ?? '',
      q: next.q ?? q ?? '',
      page: next.page ?? String(safePage),
      sort: next.sort ?? sortBy,
      order: next.order ?? sortOrder,
      orphaned: next.orphaned ?? (filterOrphaned ? '1' : '0'),
      no_lots: next.no_lots ?? (filterNoLots ? '1' : '0'),
      no_members: next.no_members ?? (filterNoMembers ? '1' : '0'),
      risk: next.risk ?? (filterRisk ? 'high' : ''),
    },
    {
      sort: 'created',
      order: 'desc',
      page: '1',
      orphaned: '0',
      no_lots: '0',
      no_members: '0',
      risk: '',
    },
  );

  const currentListHref = hrefWith({ page: String(safePage) });
  const resetOperationalHref = hrefWith({
    plan: '',
    q: '',
    page: '1',
    sort: 'created',
    order: 'desc',
    orphaned: '0',
    no_lots: '0',
    no_members: '0',
    risk: '',
  });
  const orphanedCount = displayedCopros.filter((c) => !c.syndic_id).length;
  const withoutLotsCount = displayedCopros.filter((c) => (lotsCount[c.id] ?? 0) === 0).length;
  const withoutMembersCount = displayedCopros.filter((c) => (coproCount[c.id] ?? 0) === 0).length;
  const criticalRiskCount = displayedCopros.filter((c) => getHealthScore(c) <= 59).length;
  const activeOperationalFilters = [planFilter, query, filterOrphaned ? 'orphaned' : '', filterNoLots ? 'no-lots' : '', filterNoMembers ? 'no-members' : '', filterRisk ? 'risk' : '']
    .filter(Boolean)
    .length;

  return (
    <div className="space-y-6 pb-16">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Copropriétés
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Vue opérationnelle. Modifications via les actions disponibles.
          </p>
        </div>
      </div>

      {/* ── Filters, stats, table ── */}
      <Suspense><AdminSearch placeholder="Rechercher une copropriete, ville, CP..." defaultValue={q ?? ''} /></Suspense>

          {/* ── Stats ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total copropriétés', value: nbCoproprietes, icon: Building2, color: 'bg-blue-100 text-blue-600' },
              { label: 'Abonnées actives', value: nbActifs, icon: Building2, color: 'bg-green-100 text-green-600' },
              { label: 'En essai', value: nbEssai, icon: Building2, color: 'bg-amber-100 text-amber-600' },
              { label: 'Inactives / résiliées / impayées', value: nbInactif + nbResilie + nbPasseDu, icon: Building2, color: nbPasseDu > 0 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-400' },
            ].map(({ label, value, icon: Icon, color }) => (
              <AdminStatCard key={label} label={label} value={value} color={color} icon={Icon} />
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

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Link
                href={hrefWith({ orphaned: filterOrphaned ? '0' : '1', page: '1' })}
                className={`px-2.5 py-1 rounded-full border font-medium ${filterOrphaned ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300'}`}
              >
                Sans syndic assigné ({orphanedCount})
              </Link>
              <Link
                href={hrefWith({ no_lots: filterNoLots ? '0' : '1', page: '1' })}
                className={`px-2.5 py-1 rounded-full border font-medium ${filterNoLots ? 'bg-orange-600 border-orange-600 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-orange-300'}`}
              >
                0 lot importé ({withoutLotsCount})
              </Link>
              <Link
                href={hrefWith({ no_members: filterNoMembers ? '0' : '1', page: '1' })}
                className={`px-2.5 py-1 rounded-full border font-medium ${filterNoMembers ? 'bg-teal-600 border-teal-600 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-teal-300'}`}
              >
                0 copropriétaire ({withoutMembersCount})
              </Link>
              <Link
                href={hrefWith({ risk: filterRisk ? '' : 'high', page: '1' })}
                className={`px-2.5 py-1 rounded-full border font-medium ${filterRisk ? 'bg-red-600 border-red-600 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-red-300'}`}
              >
                Santé critique ({criticalRiskCount})
              </Link>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {([
                { key: 'created:desc', label: 'Récentes' },
                { key: 'name:asc', label: 'Nom A-Z' },
                { key: 'health:asc', label: 'Santé critique' },
                { key: 'renewal:asc', label: 'Renouvellement' },
                { key: 'incidents:desc', label: 'Risques ouverts' },
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
              {totalItems} résultat{totalItems > 1 ? 's' : ''} · {hasClientOnlyFilters ? 'analyse avancée' : 'pagination optimisée'}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  {hasClientOnlyFilters ? 'Mode analyse avancée' : 'Mode pagination optimisée'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {totalItems} copropriété(s) correspondent aux filtres. {criticalRiskCount} présentent un risque élevé et {orphanedCount} sont sans syndic assigné.
                </p>
              </div>
              {activeOperationalFilters > 0 && (
                <Link href={resetOperationalHref} className="text-xs font-medium text-indigo-600 hover:text-indigo-800">
                  Réinitialiser tous les filtres
                </Link>
              )}
            </div>
          </div>

          {/* ── Table copropriétés ── */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
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
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Activité / Risques</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Santé</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Plan</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden xl:table-cell">Fin essai / Créée</th>
                  <th className="px-4 py-3 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pagedCopros.length === 0 && (
                  <tr><td colSpan={9} className="px-4 py-8 text-center text-sm text-gray-400">Aucune copropriété pour ce filtre</td></tr>
                )}
                {pagedCopros.map((c) => {
                  const profile = c.profiles as { full_name?: string; email?: string } | null;
                  const openInc = incidentCount[c.id] ?? 0;
                  const health = getHealthScore(c);
                  const healthDetails = getHealthDetails(c);
                  const healthCls = health >= 80
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : health >= 60
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-red-50 text-red-700 border-red-200';
                  const healthLabel = health >= 80 ? 'OK' : health >= 60 ? 'À surveiller' : 'Critique';
                  return (
                    <tr key={c.id} className={`hover:bg-gray-50 transition-colors ${c.plan === 'passe_du' ? 'bg-red-50/30' : ''}`}>
                      <td className="px-4 py-3">
                        <Link
                          href={appendAdminFrom(`/admin/coproprietes/${c.id}`, currentListHref)}
                          className="font-medium text-gray-800 hover:text-indigo-700 hover:underline"
                        >
                          {c.nom}
                        </Link>
                        <p className="text-xs text-gray-400">{c.ville}</p>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <p className="text-xs text-gray-700 truncate max-w-[130px]">{profile?.full_name ?? '—'}</p>
                        <p className="text-xs text-gray-400 truncate max-w-[130px]">{profile?.email ?? ''}</p>
                        {c.syndic_id ? (
                          <Link
                            href={appendAdminFrom(`/admin/utilisateurs/${c.syndic_id}`, currentListHref)}
                            className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-800"
                          >
                            Ouvrir <ExternalLink size={10} />
                          </Link>
                        ) : (
                          <span className="mt-1 inline-flex text-[11px] text-orange-600">Aucun syndic lié</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold">
                          {lotsCount[c.id] ?? 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center hidden md:table-cell">
                        <span className="text-xs text-gray-600 font-medium">{coproCount[c.id] ?? 0}</span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="space-y-0.5">
                          <p className="text-xs text-gray-700">
                            {agCount[c.id] ?? 0} AG · {formatAdminCurrency(depCount[c.id] ?? 0)} dépenses
                          </p>
                          {openInc > 0 ? (
                            <p className="text-xs font-medium text-red-600">
                              {openInc} incident{openInc > 1 ? 's' : ''} ouvert{openInc > 1 ? 's' : ''}
                            </p>
                          ) : (
                            <p className="text-xs text-gray-400">Aucun incident ouvert</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div title={healthDetails.join(' · ')}>
                          <span className={`inline-flex min-w-12 justify-center text-xs px-2 py-1 rounded-md border font-semibold ${healthCls}`}>
                            {healthLabel} · {health}
                          </span>
                          <p className="mt-1 text-[11px] text-gray-400 leading-tight max-w-[150px] mx-auto">
                            {healthDetails.slice(0, 2).join(' · ')}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3"><PlanBadge plan={c.plan} planId={c.plan_id} /></td>
                      <td className="px-4 py-3 text-xs hidden xl:table-cell">
                        {(c.plan === 'essai' || !c.plan) ? (
                          <div>
                            <p className="text-[10px] text-amber-600 font-medium uppercase tracking-wide leading-none mb-0.5">Fin essai</p>
                            <p className="text-amber-700 font-semibold">
                              {c.plan_period_end
                                ? formatAdminDate(c.plan_period_end)
                                : `~ ${formatAdminDate(trialEndEstimate(c.created_at))}`}
                            </p>
                          </div>
                        ) : c.plan === 'actif' && c.plan_period_end ? (
                          <div>
                            <p className="text-[10px] text-gray-400 uppercase tracking-wide leading-none mb-0.5">Renouvellement</p>
                            <p className="text-gray-600">{formatAdminDate(c.plan_period_end)}</p>
                          </div>
                        ) : (
                          <span className="text-gray-400">{formatAdminDate(c.created_at)}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          {typeof profile?.email === 'string' && profile.email.length > 0 && (!c.syndic_id || !adminUserIds.has(c.syndic_id)) && (
                            <AdminImpersonate email={profile.email} iconOnly />
                          )}
                          <AdminCoproActions coproId={c.id} coproNom={c.nom} isOrphaned={!c.syndic_id} adresse={c.adresse} codePostal={c.code_postal} ville={c.ville} nombreLots={c.nombre_lots} contextHref={currentListHref} />
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
    </div>
  );
}
