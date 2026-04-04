// ============================================================
// Admin — Gestion des utilisateurs
// Table unifiée syndics + membres, avec rôle, copropriétés,
// journal d'activité et raccourcis support.
// ============================================================
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { ElementType } from 'react';
import Link from 'next/link';
import AdminUserActions from '../AdminUserActions';
import AdminSearch from '../AdminSearch';
import AdminPagination from '../AdminPagination';
import AdminStatCard from '../AdminStatCard';
import { Suspense } from 'react';
import { Users, UserCheck, CheckCircle2, LifeBuoy } from 'lucide-react';

import { isAdminUser } from '@/lib/admin-config';
import { formatRelativeDayLabel } from '@/lib/admin-date';
import { appendAdminFrom, buildAdminListHref } from '@/lib/admin-list-params';
import { formatAdminDate } from '@/lib/admin-format';
import { listAllAdminAuthUsers } from '@/lib/admin-auth-users';
import { RoleBadge } from '../AdminBadges';

type LinkedCopro = {
  id: string;
  nom: string;
  plan: string | null;
  plan_id: string | null;
};

function timeAgo(s: string | null | undefined): string {
  return formatRelativeDayLabel(s);
}

function getInactivityBadge(lastActivityAt: string | null | undefined, hasActiveOrTrial: boolean) {
  if (!lastActivityAt || hasActiveOrTrial) return null;

  const diffInDays = Math.floor((Date.now() - new Date(lastActivityAt).getTime()) / 86400000);

  if (diffInDays >= 60) {
    return {
      label: 'Inactif 60j+',
      className: 'text-red-700 bg-red-50 border-red-200',
    };
  }

  if (diffInDays >= 30) {
    return {
      label: 'Inactif 30j+',
      className: 'text-amber-700 bg-amber-50 border-amber-200',
    };
  }

  return null;
}

export default async function AdminUtilisateursPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    role?: string;
    verified?: string;
    sort?: string;
    order?: string;
    page?: string;
  }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await isAdminUser(user.id, supabase))) redirect('/dashboard');

  const { q, role, verified, sort, order, page } = await searchParams;
  const query = q?.trim().toLowerCase() ?? '';
  const roleFilter = role === 'admin' || role === 'syndic' || role === 'membre' ? role : 'all';
  const verifiedFilter = verified === 'yes' || verified === 'no' ? verified : 'all';
  const sortBy = sort === 'last_active' || sort === 'tickets' ? sort : 'created';
  const sortOrder = order === 'asc' ? 'asc' : 'desc';
  const currentPage = Math.max(1, Number(page) || 1);
  const PAGE_SIZE = 25;

  const admin = createAdminClient();
  const startOf30Days = new Date(Date.now() - 30 * 86400000).toISOString();
  const startOf7Days  = new Date(Date.now() - 7  * 86400000).toISOString();

  const [
    authUsers,
    { data: coproprietes },
    { data: adminRows },
    { data: coproprietairesData },
    { data: supportTicketsData },
    { data: profilesData },
  ] = await Promise.all([
    listAllAdminAuthUsers(admin),
    admin.from('coproprietes').select('id, nom, syndic_id, plan, plan_id'),
    admin.from('admin_users').select('user_id'),
    admin.from('coproprietaires').select('email, copropriete_id'),
    admin.from('support_tickets').select('user_email'),
    admin.from('profiles').select('id, last_active_at'),
  ]);

  const adminUserIds = new Set((adminRows ?? []).map((r) => r.user_id as string));

  // userId → last_active_at
  const lastActiveById: Record<string, string | null> = {};
  for (const p of profilesData ?? []) {
    const typed = p as { id: string; last_active_at: string | null };
    lastActiveById[typed.id] = typed.last_active_at;
  }

  // copropriete_id → détails copro
  const coproprieteById: Record<string, LinkedCopro> = {};
  for (const c of coproprietes ?? []) {
    const typed = c as { id: string; nom: string; plan: string | null; plan_id: string | null };
    coproprieteById[typed.id] = {
      id: typed.id,
      nom: typed.nom,
      plan: typed.plan ?? null,
      plan_id: typed.plan_id ?? null,
    };
  }

  // member email → copropriétés liées
  const memberCoproLinks: Record<string, LinkedCopro[]> = {};
  for (const cp of coproprietairesData ?? []) {
    const typed = cp as { email: string; copropriete_id: string };
    const email = typed.email?.toLowerCase();
    if (!email) continue;

    const copro = coproprieteById[typed.copropriete_id];
    if (!copro) continue;

    memberCoproLinks[email] ??= [];
    if (!memberCoproLinks[email].some((item) => item.id === copro.id)) {
      memberCoproLinks[email].push(copro);
    }
  }

  // email → ticket count
  const ticketCount: Record<string, number> = {};
  for (const t of supportTicketsData ?? []) {
    const email = ((t as { user_email: string | null }).user_email ?? '').toLowerCase();
    if (email) ticketCount[email] = (ticketCount[email] ?? 0) + 1;
  }

  const nbUsers      = authUsers.length;
  const nbUnconfirmed = authUsers.filter((u) => !u.email_confirmed_at).length;
  const confirmedPct  = nbUsers > 0 ? Math.round(((nbUsers - nbUnconfirmed) / nbUsers) * 100) : 0;
  const newUsers30   = authUsers.filter((u) => u.created_at >= startOf30Days).length;
  const newUsers7    = authUsers.filter((u) => u.created_at >= startOf7Days).length;

  const syndicCount = authUsers.filter(
    (u) => (u.user_metadata as Record<string, string> | null)?.role !== 'copropriétaire',
  ).length;
  const memberCount = nbUsers - syndicCount;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const coprosTyped = (coproprietes ?? []) as any[];

  const filtered = authUsers.filter((u) => {
    const meta = u.user_metadata as Record<string, string> | null;
    const emailStr = u.email?.toLowerCase() ?? '';
    const fullName = (meta?.full_name ?? '').toLowerCase();

    if (query && !emailStr.includes(query) && !fullName.includes(query)) return false;

    const isMember = meta?.role === 'copropriétaire';
    const isAdmin = adminUserIds.has(u.id);
    const effectiveRole = isAdmin ? 'admin' : isMember ? 'membre' : 'syndic';
    if (roleFilter !== 'all' && effectiveRole !== roleFilter) return false;

    if (verifiedFilter === 'yes' && !u.email_confirmed_at) return false;
    if (verifiedFilter === 'no' && !!u.email_confirmed_at) return false;

    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'last_active') {
      const va = new Date(lastActiveById[a.id] ?? a.last_sign_in_at ?? 0).getTime();
      const vb = new Date(lastActiveById[b.id] ?? b.last_sign_in_at ?? 0).getTime();
      return sortOrder === 'asc' ? va - vb : vb - va;
    }

    if (sortBy === 'tickets') {
      const ta = ticketCount[(a.email ?? '').toLowerCase()] ?? 0;
      const tb = ticketCount[(b.email ?? '').toLowerCase()] ?? 0;
      return sortOrder === 'asc' ? ta - tb : tb - ta;
    }

    const ca = new Date(a.created_at).getTime();
    const cb = new Date(b.created_at).getTime();
    return sortOrder === 'asc' ? ca - cb : cb - ca;
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const pagedUsers = sorted.slice(start, start + PAGE_SIZE);

  const hrefWith = (next: Partial<{ q: string; role: string; verified: string; sort: string; order: string; page: string }>) => buildAdminListHref(
    '/admin/utilisateurs',
    {
      q: next.q ?? q ?? '',
      role: next.role ?? roleFilter,
      verified: next.verified ?? verifiedFilter,
      sort: next.sort ?? sortBy,
      order: next.order ?? sortOrder,
      page: next.page ?? String(safePage),
    },
    {
      role: 'all',
      verified: 'all',
      sort: 'created',
      order: 'desc',
      page: '1',
    },
  );

  const currentListHref = hrefWith({ page: String(safePage) });

  const kpis: Array<{ label: string; value: string | number; sub: string; color: string; Icon: ElementType }> = [
    { label: 'Total',    value: nbUsers,     sub: `+${newUsers30} ce mois`,   color: 'bg-blue-100 text-blue-600',    Icon: Users },
    { label: 'Syndics',  value: syndicCount, sub: `${authUsers.filter((u) => (u.user_metadata as Record<string,string>|null)?.role !== 'copropriétaire' && !!u.email_confirmed_at).length} vérifiés`, color: 'bg-indigo-100 text-indigo-600', Icon: UserCheck },
    { label: 'Membres',  value: memberCount, sub: `${authUsers.filter((u) => (u.user_metadata as Record<string,string>|null)?.role === 'copropriétaire' && !!u.email_confirmed_at).length} vérifiés`, color: 'bg-teal-100 text-teal-600', Icon: Users },
    { label: 'Vérifiés', value: `${confirmedPct} %`, sub: `${nbUnconfirmed} en attente`, color: 'bg-green-100 text-green-600', Icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-8 pb-16">

      {/* ── En-tête + recherche ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Utilisateurs</h1>
          <p className="text-sm text-gray-500 mt-1">
            {nbUsers} comptes · {syndicCount} syndics · {memberCount} membres · +{newUsers7} cette semaine
          </p>
        </div>
        <Suspense><AdminSearch placeholder="Rechercher par email ou nom…" defaultValue={q ?? ''} /></Suspense>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          {([
            { key: 'all', label: 'Tous rôles' },
            { key: 'admin', label: 'Admins' },
            { key: 'syndic', label: 'Syndics' },
            { key: 'membre', label: 'Membres' },
          ] as const).map((item) => (
            <Link
              key={item.key}
              href={hrefWith({ role: item.key, page: '1' })}
              className={`px-2.5 py-1 rounded-full border font-medium ${roleFilter === item.key ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'}`}
            >
              {item.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {([
            { key: 'all', label: 'Tous emails' },
            { key: 'yes', label: 'Vérifiés' },
            { key: 'no', label: 'Non vérifiés' },
          ] as const).map((item) => (
            <Link
              key={item.key}
              href={hrefWith({ verified: item.key, page: '1' })}
              className={`px-2.5 py-1 rounded-full border font-medium ${verifiedFilter === item.key ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300'}`}
            >
              {item.label}
            </Link>
          ))}

          {([
            { key: 'created:desc', label: 'Inscription recente' },
            { key: 'last_active:desc', label: 'Activite recente' },
            { key: 'tickets:desc', label: 'Tickets support' },
          ] as const).map((item) => {
            const [nextSort, nextOrder] = item.key.split(':');
            const active = sortBy === nextSort && sortOrder === nextOrder;
            return (
              <Link
                key={item.key}
                href={hrefWith({ sort: nextSort, order: nextOrder, page: '1' })}
                className={`px-2.5 py-1 rounded-full border font-medium ${active ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map(({ label, value, sub, color, Icon }) => (
          <AdminStatCard key={label} label={label} value={value} sub={sub} color={color} icon={Icon} />
        ))}
      </div>

      {/* ── Table unifiée ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
          <p className="text-sm font-semibold text-gray-700">
            {query || roleFilter !== 'all' || verifiedFilter !== 'all'
              ? `${sorted.length} / ${nbUsers} utilisateurs`
              : `${nbUsers} utilisateurs`}
          </p>
        </div>
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Utilisateur</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Rôle</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Statut / alertes</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Dernière activité</th>
              <th className="px-4 py-3 w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {pagedUsers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-400">
                  Aucun résultat pour « {q} »
                </td>
              </tr>
            )}
            {pagedUsers.map((u) => {
              const meta     = u.user_metadata as Record<string, string> | null;
              const emailKey = u.email?.toLowerCase() ?? '';
              const isMember = meta?.role === 'copropriétaire';
              const isAdmin  = adminUserIds.has(u.id);
              const role: 'admin' | 'syndic' | 'membre' = isAdmin ? 'admin' : isMember ? 'membre' : 'syndic';

              const userCopros = isMember
                ? []
                : (coprosTyped
                    .filter((c) => c.syndic_id === u.id)
                    .map((c) => ({ id: c.id, nom: c.nom, plan: c.plan ?? null, plan_id: c.plan_id ?? null })) as LinkedCopro[]);

              const linkedCopros = isMember ? (memberCoproLinks[emailKey] ?? []) : userCopros;
              const hasActiveSubscription = linkedCopros.some((copro) => copro.plan === 'actif');
              const hasTrialInProgress = linkedCopros.some((copro) => !copro.plan || copro.plan === 'essai');
              const activityRef = lastActiveById[u.id] ?? u.last_sign_in_at ?? u.created_at;
              const inactivityBadge = role === 'admin'
                ? null
                : getInactivityBadge(activityRef, hasActiveSubscription || hasTrialInProgress);

              const avatarCls = role === 'admin'  ? 'bg-blue-100 text-blue-700'
                              : role === 'syndic' ? 'bg-indigo-100 text-indigo-700'
                              : 'bg-teal-100 text-teal-700';

              const tickets = ticketCount[emailKey] ?? 0;

              return (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">

                  {/* Utilisateur */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${avatarCls}`}>
                        <span className="text-xs font-bold">{(u.email ?? '?')[0].toUpperCase()}</span>
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={appendAdminFrom(`/admin/utilisateurs/${u.id}`, currentListHref)}
                          className="text-sm font-medium text-gray-800 truncate leading-tight hover:text-indigo-700 hover:underline"
                        >
                          {u.email}
                        </Link>
                        {meta?.full_name && (
                          <Link
                            href={appendAdminFrom(`/admin/utilisateurs/${u.id}`, currentListHref)}
                            className="block text-xs text-gray-400 truncate leading-tight hover:text-indigo-600 hover:underline"
                          >
                            {meta.full_name}
                          </Link>
                        )}
                        <div className="mt-1 flex flex-wrap gap-1">
                          {linkedCopros.length === 0 ? (
                            <span className="inline-flex text-[11px] px-1.5 py-0.5 rounded border border-gray-200 bg-gray-50 text-gray-400">
                              Aucune copropriété liée
                            </span>
                          ) : (
                            <>
                              {linkedCopros.slice(0, 2).map((copro) => (
                                <Link
                                  key={copro.id}
                                  href={appendAdminFrom(`/admin/coproprietes/${copro.id}`, currentListHref)}
                                  className="inline-flex text-[11px] px-1.5 py-0.5 rounded border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                                >
                                  {copro.nom}
                                </Link>
                              ))}
                              {linkedCopros.length > 2 && (
                                <span className="inline-flex text-[11px] px-1.5 py-0.5 rounded border border-gray-200 bg-gray-50 text-gray-500">
                                  +{linkedCopros.length - 2}
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Rôle */}
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <RoleBadge role={role} />
                  </td>

                  {/* Statut / alertes */}
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {u.email_confirmed_at ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 rounded px-1.5 py-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                          Vérifié
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          Email en attente
                        </span>
                      )}

                      {hasActiveSubscription && (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5">
                          Abonnement actif
                        </span>
                      )}

                      {!hasActiveSubscription && hasTrialInProgress && (
                        <span className="inline-flex items-center gap-1 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded px-1.5 py-0.5">
                          Essai en cours
                        </span>
                      )}

                      {role !== 'admin' && linkedCopros.length === 0 && (
                        <span className="inline-flex items-center gap-1 text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded px-1.5 py-0.5">
                          Sans copro
                        </span>
                      )}

                      {tickets > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200 rounded px-1.5 py-0.5">
                          <LifeBuoy size={10} />
                          {tickets} ticket{tickets > 1 ? 's' : ''}
                        </span>
                      )}

                      {inactivityBadge && (
                        <span className={`inline-flex items-center gap-1 text-xs border rounded px-1.5 py-0.5 ${inactivityBadge.className}`}>
                          {inactivityBadge.label}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Dernière activité */}
                  <td className="px-4 py-3 hidden md:table-cell">
                    <p className="text-xs font-medium text-gray-700 leading-tight">{timeAgo(activityRef)}</p>
                    <p className="text-[11px] text-gray-400 leading-tight">{formatAdminDate(activityRef)}</p>
                    <p className="text-[11px] text-gray-300 leading-tight">Inscrit le {formatAdminDate(u.created_at)}</p>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <AdminUserActions
                      userId={u.id}
                      userEmail={u.email ?? ''}
                      fullName={meta?.full_name ?? ''}
                      isConfirmed={!!u.email_confirmed_at}
                      isSelf={u.id === user.id}
                      isAdmin={isAdmin}
                    />
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
        totalItems={sorted.length}
        pageSize={PAGE_SIZE}
        prevHref={hrefWith({ page: String(Math.max(1, safePage - 1)) })}
        nextHref={hrefWith({ page: String(Math.min(totalPages, safePage + 1)) })}
      />

    </div>
  );
}