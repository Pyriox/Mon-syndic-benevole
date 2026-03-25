// ============================================================
// Admin — Gestion des utilisateurs
// Actions disponibles : voir profil (impersonate), renvoyer confirmation,
// forcer vérification, supprimer compte.
// PAS de modification de plan (synchronisation Stripe requise).
// PAS de "désactiver" (pas d'API dédiée, seul "supprimer" existe).
// ============================================================
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AdminUserActions from '../AdminUserActions';
import AdminImpersonate from '../AdminImpersonate';
import AdminCopyId from '../AdminCopyId';
import { Users, UserCheck, CheckCircle2 } from 'lucide-react';

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
  if (plan === 'essai')    return <span className="inline-flex text-xs px-2 py-0.5 rounded-md font-medium bg-amber-50 text-amber-700 border border-amber-200">Essai</span>;
  if (plan === 'inactif')  return <span className="inline-flex text-xs px-2 py-0.5 rounded-md font-medium bg-gray-100 text-gray-500 border border-gray-200">Inactif</span>;
  // null = aucun moyen de paiement enregistré
  return <span className="inline-flex text-xs px-2 py-0.5 rounded-md font-medium bg-gray-100 text-gray-600 border border-gray-200">Aucun</span>;
}

export default async function AdminUtilisateursPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await isAdminUser(user.id, supabase))) redirect('/dashboard');

  const admin = createAdminClient();
  const startOf30Days = new Date(Date.now() - 30 * 86400000).toISOString();
  const startOf7Days  = new Date(Date.now() - 7  * 86400000).toISOString();

  const [
    authResult,
    { data: coproprietes },
    { data: adminRows },
  ] = await Promise.all([
    admin.auth.admin.listUsers({ perPage: 1000 }),
    admin.from('coproprietes').select('id, syndic_id, plan, plan_id'),
    admin.from('admin_users').select('user_id'),
  ]);

  const adminUserIds = new Set((adminRows ?? []).map((r) => r.user_id as string));

  const authUsers = authResult.data?.users ?? [];
  const nbUsers = authUsers.length;
  const nbUnconfirmed = authUsers.filter((u) => !u.email_confirmed_at).length;
  const confirmedPct = nbUsers > 0 ? Math.round(((nbUsers - nbUnconfirmed) / nbUsers) * 100) : 0;
  const newUsers30 = authUsers.filter((u) => u.created_at >= startOf30Days).length;

  const allUsers = [...authUsers].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const syndicUsers = allUsers.filter((u) => (u.user_metadata as Record<string, string> | null)?.role !== 'copropriétaire');
  const memberUsers = allUsers.filter((u) => (u.user_metadata as Record<string, string> | null)?.role === 'copropriétaire');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const coprosTyped = (coproprietes ?? []) as any[];

  return (
    <div className="space-y-8 pb-16">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Utilisateurs</h1>
        <p className="text-sm text-gray-500 mt-1">Syndics bénévoles et membres copropriétaires inscrits.</p>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total utilisateurs',  value: nbUsers,           sub: `+${newUsers30} ce mois`,       color: 'bg-blue-100 text-blue-600',    icon: Users },
          { label: 'Syndics',             value: syndicUsers.length, sub: `${syndicUsers.filter(u => !!u.email_confirmed_at).length} vérifiés`, color: 'bg-indigo-100 text-indigo-600', icon: UserCheck },
          { label: 'Membres',             value: memberUsers.length, sub: `${memberUsers.filter(u => !!u.email_confirmed_at).length} vérifiés`, color: 'bg-teal-100 text-teal-600',     icon: Users },
          { label: 'Emails vérifiés',     value: `${confirmedPct} %`, sub: `${nbUnconfirmed} en attente`,  color: 'bg-green-100 text-green-600',   icon: CheckCircle2 },
        ].map(({ label, value, sub, color, icon: Icon }) => (
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

      {/* ── Syndics ── */}
      <section>
        <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
          <div>
            <p className="text-sm font-semibold text-gray-900">Syndics bénévoles</p>
            <p className="text-xs text-gray-500">{syndicUsers.length} comptes</p>
          </div>
          <div className="flex gap-2 text-xs">
            <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md font-medium border border-blue-200">{syndicUsers.filter(u => !!u.email_confirmed_at).length} vérifiés</span>
            <span className="bg-amber-50 text-amber-700 px-2 py-1 rounded-md font-medium border border-amber-200">{syndicUsers.filter(u => !u.email_confirmed_at).length} en attente</span>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email / ID</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Inscription</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Dernière connexion</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Copros / Plan</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Statut</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Support</th>
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {syndicUsers.map((u) => {
                const meta = u.user_metadata as Record<string, string> | null;
                const userCopros = coprosTyped.filter((c) => c.syndic_id === u.id);
                const hasActive  = userCopros.some((c) => c.plan === 'actif');
                const hasEssai   = userCopros.some((c) => c.plan === 'essai');
                const hasImpayes = userCopros.some((c) => c.plan === 'passe_du');
                const bestPlanId = userCopros.find((c) => c.plan === 'actif')?.plan_id ?? null;
                // plan représentatif : actif > essai > passe_du > inactif > null
                const displayPlan: string | null = hasActive ? 'actif' : hasEssai ? 'essai' : hasImpayes ? 'passe_du'
                  : (userCopros[0]?.plan ?? null);
                return (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-indigo-600">{(u.email ?? '?')[0].toUpperCase()}</span>
                        </div>
                        <div className="min-w-0">
                          <p className={`text-sm font-medium truncate ${adminUserIds.has(u.id) ? 'text-blue-700' : 'text-gray-800'}`}>
                            {u.email}
                            {adminUserIds.has(u.id) && <span className="ml-1.5 text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">Admin</span>}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <AdminCopyId id={u.id} />
                            {meta?.full_name && <span className="text-xs text-gray-400">{meta.full_name}</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 hidden md:table-cell">{timeAgo(u.created_at)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 hidden lg:table-cell">{timeAgo(u.last_sign_in_at)}</td>
                    <td className="px-4 py-3 text-center hidden md:table-cell">
                      {userCopros.length > 0 ? (
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-sm font-bold text-gray-800">{userCopros.length}</span>
                          <PlanBadge plan={displayPlan} planId={bestPlanId} />
                        </div>
                      ) : <span className="text-xs text-gray-500">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {u.email_confirmed_at
                        ? <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 rounded-md px-2 py-0.5"><span className="w-1.5 h-1.5 rounded-full bg-green-500" />Vérifié</span>
                        : <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2 py-0.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" />En attente</span>
                      }
                    </td>
                    <td className="px-4 py-3">
                      {!adminUserIds.has(u.id) && <AdminImpersonate email={u.email ?? ''} />}
                    </td>
                    <td className="px-4 py-3">
                      <AdminUserActions userId={u.id} userEmail={u.email ?? ''} isConfirmed={!!u.email_confirmed_at} isSelf={adminUserIds.has(u.id)} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Membres ── */}
      <section>
        <div className="mb-3">
          <p className="text-sm font-semibold text-gray-900">Membres copropriétaires</p>
            <p className="text-xs text-gray-500">{memberUsers.length} comptes · accès invité (lecture seule)</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Inscription</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Dernière connexion</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Statut</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Support</th>
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {memberUsers.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">Aucun membre inscrit</td></tr>
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
                          <p className="text-sm font-medium text-gray-800 truncate">{u.email}</p>
                          <p className="text-xs text-gray-500">{meta?.full_name ?? '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 hidden md:table-cell">{timeAgo(u.created_at)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 hidden lg:table-cell">{timeAgo(u.last_sign_in_at)}</td>
                    <td className="px-4 py-3">
                      {u.email_confirmed_at
                        ? <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 rounded-md px-2 py-0.5"><span className="w-1.5 h-1.5 rounded-full bg-green-500" />Vérifié</span>
                        : <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2 py-0.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" />En attente</span>
                      }
                    </td>
                    <td className="px-4 py-3"><AdminImpersonate email={u.email ?? ''} /></td>
                    <td className="px-4 py-3"><AdminUserActions userId={u.id} userEmail={u.email ?? ''} isConfirmed={!!u.email_confirmed_at} isSelf={false} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
