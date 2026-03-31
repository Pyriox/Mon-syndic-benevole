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
import AdminImpersonate from '../AdminImpersonate';
import AdminCopyId from '../AdminCopyId';
import AdminUserLogs from '../AdminUserLogs';
import AdminSearch from '../AdminSearch';
import AdminPagination from '../AdminPagination';
import { Suspense } from 'react';
import { Users, UserCheck, CheckCircle2, LifeBuoy } from 'lucide-react';

import { isAdminUser } from '@/lib/admin-config';

function timeAgo(s: string | null | undefined): string {
  if (!s) return '—';
  const d = Math.floor((Date.now() - new Date(s).getTime()) / 86400000);
  if (d === 0) return "Aujourd'hui";
  if (d === 1) return 'Hier';
  if (d < 30) return `Il y a ${d} j`;
  if (d < 365) return `Il y a ${Math.floor(d / 30)} mois`;
  return `Il y a ${Math.floor(d / 365)} an${Math.floor(d / 365) > 1 ? 's' : ''}`;
}
function fmtDate(s: string | null | undefined) {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function RoleBadge({ role }: { role: 'admin' | 'syndic' | 'membre' }) {
  if (role === 'admin')  return <span className="inline-flex text-xs px-1.5 py-0.5 rounded font-semibold bg-blue-100 text-blue-700">Admin</span>;
  if (role === 'syndic') return <span className="inline-flex text-xs px-1.5 py-0.5 rounded font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">Syndic</span>;
  return <span className="inline-flex text-xs px-1.5 py-0.5 rounded font-semibold bg-teal-50 text-teal-700 border border-teal-200">Membre</span>;
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
    authResult,
    { data: coproprietes },
    { data: adminRows },
    { data: coproprietairesData },
    { data: supportTicketsData },
    { data: profilesData },
  ] = await Promise.all([
    admin.auth.admin.listUsers({ perPage: 1000 }),
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

  // copropriete_id → nom
  const coproprieteById: Record<string, string> = {};
  for (const c of coproprietes ?? []) {
    const typed = c as { id: string; nom: string };
    coproprieteById[typed.id] = typed.nom;
  }

  // member email → [copro names]
  const memberCoproNames: Record<string, string[]> = {};
  for (const cp of coproprietairesData ?? []) {
    const typed = cp as { email: string; copropriete_id: string };
    const email = typed.email?.toLowerCase();
    if (!email) continue;
    const nom = coproprieteById[typed.copropriete_id];
    if (nom) {
      memberCoproNames[email] ??= [];
      if (!memberCoproNames[email].includes(nom)) memberCoproNames[email].push(nom);
    }
  }

  // email → ticket count
  const ticketCount: Record<string, number> = {};
  for (const t of supportTicketsData ?? []) {
    const email = ((t as { user_email: string | null }).user_email ?? '').toLowerCase();
    if (email) ticketCount[email] = (ticketCount[email] ?? 0) + 1;
  }

  const authUsers    = authResult.data?.users ?? [];
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

  const hrefWith = (next: Partial<{ q: string; role: string; verified: string; sort: string; order: string; page: string }>) => {
    const params = new URLSearchParams();
    const valueQ = next.q ?? q ?? '';
    const valueRole = next.role ?? roleFilter;
    const valueVerified = next.verified ?? verifiedFilter;
    const valueSort = next.sort ?? sortBy;
    const valueOrder = next.order ?? sortOrder;
    const valuePage = next.page ?? String(safePage);

    if (valueQ) params.set('q', valueQ);
    if (valueRole !== 'all') params.set('role', valueRole);
    if (valueVerified !== 'all') params.set('verified', valueVerified);
    if (valueSort !== 'created') params.set('sort', valueSort);
    if (valueOrder !== 'desc') params.set('order', valueOrder);
    if (valuePage !== '1') params.set('page', valuePage);

    return `/admin/utilisateurs${params.toString() ? `?${params.toString()}` : ''}`;
  };

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
          <div key={label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-start gap-4">
            <div className={`p-3 rounded-xl ${color} shrink-0`}><Icon size={18} /></div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
              <p className="text-xs text-gray-500">{sub}</p>
            </div>
          </div>
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
        <table className="w-full min-w-[980px] text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Utilisateur</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Rôle</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Inscrit</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Connexion</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Copropriété</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Support</th>
              <th className="px-4 py-3 w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {pagedUsers.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-sm text-gray-400">
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

              // Copros du syndic
              const userCopros  = isMember ? [] : coprosTyped.filter((c) => c.syndic_id === u.id);

              // Copros du membre
              const memberCopros = isMember ? (memberCoproNames[emailKey] ?? []) : [];

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
                          href={`/admin/utilisateurs/${u.id}`}
                          className="text-sm font-medium text-gray-800 truncate leading-tight hover:text-indigo-700 hover:underline"
                        >
                          {u.email}
                        </Link>
                        {meta?.full_name && (
                          <Link
                            href={`/admin/utilisateurs/${u.id}`}
                            className="block text-xs text-gray-400 truncate leading-tight hover:text-indigo-600 hover:underline"
                          >
                            {meta.full_name}
                          </Link>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Rôle */}
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <RoleBadge role={role} />
                  </td>

                  {/* Inscrit */}
                  <td className="px-4 py-3 hidden md:table-cell">
                    <p className="text-xs font-medium text-gray-700 leading-tight">{timeAgo(u.created_at)}</p>
                    <p className="text-[11px] text-gray-400 leading-tight">{fmtDate(u.created_at)}</p>
                  </td>

                  {/* Dernière connexion */}
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {(() => {
                      const active = lastActiveById[u.id] ?? u.last_sign_in_at;
                      return (
                        <>
                          <p className="text-xs font-medium text-gray-700 leading-tight">{timeAgo(active)}</p>
                          <p className="text-[11px] text-gray-400 leading-tight">{active ? fmtDate(active) : '—'}</p>
                        </>
                      );
                    })()}
                  </td>

                  {/* Copropriété */}
                  <td className="px-4 py-3 hidden md:table-cell">
                    {(() => {
                      const count = isMember ? memberCopros.length : userCopros.length;
                      if (count === 0) return <span className="text-xs text-gray-400">—</span>;
                      return <span className="text-xs font-semibold text-gray-700">{count} copro{count > 1 ? 's' : ''}</span>;
                    })()}
                  </td>

                  {/* Email vérifié */}
                  <td className="px-4 py-3 text-center">
                    {u.email_confirmed_at
                      ? <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 rounded px-1.5 py-0.5"><span className="w-1.5 h-1.5 rounded-full bg-green-500" />OK</span>
                      : <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" />Attente</span>
                    }
                  </td>

                  {/* Support */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <AdminCopyId id={u.id} iconOnly />
                      {!isAdmin && <AdminImpersonate email={u.email ?? ''} iconOnly />}
                      <AdminUserLogs email={u.email ?? ''} signupAt={u.created_at} />
                      {tickets > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200 rounded px-1.5 py-0.5">
                          <LifeBuoy size={10} />{tickets}
                        </span>
                      )}
                    </div>
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