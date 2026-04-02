import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, Building2, Clock, LifeBuoy, Mail, MapPin, Phone, User2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAdminUser } from '@/lib/admin-config';
import AdminImpersonate from '../../AdminImpersonate';
import AdminCopyId from '../../AdminCopyId';
import AdminUserLogs from '../../AdminUserLogs';

function fmtDate(s: string | null | undefined): string {
  if (!s) return '—';
  return new Date(s).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Paris',
  });
}

function RoleBadge({ role }: { role: 'admin' | 'syndic' | 'membre' }) {
  if (role === 'admin') {
    return <span className="inline-flex text-xs px-2 py-0.5 rounded font-semibold bg-blue-100 text-blue-700">Admin</span>;
  }
  if (role === 'syndic') {
    return <span className="inline-flex text-xs px-2 py-0.5 rounded font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">Syndic</span>;
  }
  return <span className="inline-flex text-xs px-2 py-0.5 rounded font-semibold bg-teal-50 text-teal-700 border border-teal-200">Membre</span>;
}

function PlanBadge({ plan, planId }: { plan: string | null; planId: string | null }) {
  if (plan === 'actif') {
    const cfg: Record<string, { label: string; cls: string }> = {
      essentiel: { label: 'Essentiel', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
      confort: { label: 'Confort', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
      illimite: { label: 'Illimité', cls: 'bg-purple-50 text-purple-700 border-purple-200' },
    };
    const c = cfg[planId ?? ''] ?? { label: 'Actif', cls: 'bg-green-50 text-green-700 border-green-200' };
    return <span className={`inline-flex text-xs px-2 py-0.5 rounded-md font-medium border ${c.cls}`}>{c.label}</span>;
  }
  if (plan === 'passe_du') return <span className="inline-flex text-xs px-2 py-0.5 rounded-md font-medium bg-red-50 text-red-600 border border-red-200">Impayé</span>;
  if (plan === 'resilie') return <span className="inline-flex text-xs px-2 py-0.5 rounded-md font-medium bg-orange-50 text-orange-600 border border-orange-200">Résilié</span>;
  if (plan === 'essai') return <span className="inline-flex text-xs px-2 py-0.5 rounded-md font-medium bg-amber-50 text-amber-700 border border-amber-200">Essai</span>;
  if (plan === 'inactif') return <span className="inline-flex text-xs px-2 py-0.5 rounded-md font-medium bg-gray-100 text-gray-500 border border-gray-200">Inactif</span>;
  return <span className="inline-flex text-xs px-2 py-0.5 rounded-md font-medium bg-gray-100 text-gray-500 border border-gray-200">—</span>;
}

export default async function AdminUtilisateurProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await isAdminUser(user.id, supabase))) redirect('/dashboard');

  const admin = createAdminClient();

  const [
    authUserRes,
    adminRoleRes,
    profileRes,
    syndicCoprosRes,
  ] = await Promise.all([
    admin.auth.admin.getUserById(id),
    admin.from('admin_users').select('user_id').eq('user_id', id).maybeSingle(),
    admin.from('profiles').select('last_active_at, full_name').eq('id', id).maybeSingle(),
    admin.from('coproprietes').select('id, nom, plan, plan_id, created_at').eq('syndic_id', id).order('created_at', { ascending: false }),
  ]);

  const authUser = authUserRes.data.user;
  if (!authUser) {
    return (
      <div className="space-y-4 pb-16">
        <Link href="/admin/utilisateurs" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700">
          <ArrowLeft size={13} /> Retour aux utilisateurs
        </Link>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 text-sm text-gray-500">Utilisateur introuvable.</div>
      </div>
    );
  }

  const email = authUser.email?.toLowerCase() ?? '';
  const isMember = (authUser.user_metadata as Record<string, string> | null)?.role === 'copropriétaire';
  const isAdmin = !!adminRoleRes.data;
  const role: 'admin' | 'syndic' | 'membre' = isAdmin ? 'admin' : isMember ? 'membre' : 'syndic';

  const [
    memberByIdRes,
    memberByEmailRes,
    ticketsRes,
    eventsRes,
  ] = await Promise.all([
    admin
      .from('coproprietaires')
      .select('id, nom, prenom, raison_sociale, email, telephone, adresse, complement_adresse, code_postal, ville, solde, copropriete_id, coproprietes(nom)')
      .eq('user_id', id),
    email
      ? admin
          .from('coproprietaires')
          .select('id, nom, prenom, raison_sociale, email, telephone, adresse, complement_adresse, code_postal, ville, solde, copropriete_id, coproprietes(nom)')
          .eq('email', email)
      : Promise.resolve({ data: [], error: null }),
    email
      ? admin
          .from('support_tickets')
          .select('id, subject, status, updated_at')
          .eq('user_email', email)
          .order('updated_at', { ascending: false })
          .limit(10)
      : Promise.resolve({ data: [], error: null }),
    email
      ? admin
          .from('user_events')
          .select('id, event_type, label, created_at, severity')
          .eq('user_email', email)
          .order('created_at', { ascending: false })
          .limit(20)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const syndicCopros = (syndicCoprosRes.data ?? []) as { id: string; nom: string; plan: string | null; plan_id: string | null; created_at: string }[];

  const memberRowsRaw = [
    ...((memberByIdRes.data ?? []) as Array<{ id: string; nom: string; prenom: string; raison_sociale: string | null; email: string; telephone: string | null; adresse: string | null; complement_adresse: string | null; code_postal: string | null; ville: string | null; solde: number; copropriete_id: string; coproprietes: { nom: string } | { nom: string }[] | null }>),
    ...((memberByEmailRes.data ?? []) as Array<{ id: string; nom: string; prenom: string; raison_sociale: string | null; email: string; telephone: string | null; adresse: string | null; complement_adresse: string | null; code_postal: string | null; ville: string | null; solde: number; copropriete_id: string; coproprietes: { nom: string } | { nom: string }[] | null }>),
  ];

  const seen = new Set<string>();
  const memberRows = memberRowsRaw.filter((row) => {
    if (seen.has(row.id)) return false;
    seen.add(row.id);
    return true;
  });

  const lastActive = (profileRes.data as { last_active_at: string | null } | null)?.last_active_at ?? authUser.last_sign_in_at;
  const fullName = ((authUser.user_metadata as Record<string, string> | null)?.full_name
    ?? (profileRes.data as { full_name: string | null } | null)?.full_name
    ?? null);

  const authMeta = (authUser.user_metadata ?? {}) as Record<string, unknown>;
  const authPhone = (typeof authUser.phone === 'string' && authUser.phone.trim())
    ? authUser.phone.trim()
    : (typeof authMeta.phone === 'string' && authMeta.phone.trim())
      ? authMeta.phone.trim()
      : (typeof authMeta.telephone === 'string' && authMeta.telephone.trim())
        ? authMeta.telephone.trim()
        : null;

  const phones = Array.from(new Set<string>([
    ...(authPhone ? [authPhone] : []),
    ...memberRows.map((m) => m.telephone?.trim()).filter((v): v is string => !!v),
  ]));

  const addresses = Array.from(new Set<string>(memberRows
    .map((m) => [m.adresse, m.complement_adresse, m.code_postal, m.ville].filter(Boolean).join(', ').trim())
    .filter((v) => v.length > 0)));

  return (
    <div className="space-y-6 pb-16">
      <div>
        <Link href="/admin/utilisateurs" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 mb-3 transition-colors">
          <ArrowLeft size={13} />
          Retour aux utilisateurs
        </Link>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <User2 size={18} className="text-gray-500" />
                {fullName || authUser.email || 'Utilisateur'}
              </h1>
              <p className="text-sm text-gray-500 mt-1">{authUser.email ?? '—'}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <RoleBadge role={role} />
              <AdminCopyId id={id} />
              {!isAdmin && <AdminImpersonate email={authUser.email ?? ''} />}
              {authUser.email && <AdminUserLogs email={authUser.email} />}
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3 mt-4 text-xs">
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
              <p className="text-gray-500">Inscription</p>
              <p className="font-semibold text-gray-800 mt-0.5">{fmtDate(authUser.created_at)}</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
              <p className="text-gray-500">Dernière activité</p>
              <p className="font-semibold text-gray-800 mt-0.5">{fmtDate(lastActive)}</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
              <p className="text-gray-500">Email confirmé</p>
              <p className="font-semibold text-gray-800 mt-0.5">{authUser.email_confirmed_at ? 'Oui' : 'Non'}</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
              <p className="text-gray-500">Tickets support</p>
              <p className="font-semibold text-gray-800 mt-0.5">{(ticketsRes.data ?? []).length}</p>
            </div>
          </div>

          <div className="mt-4 grid lg:grid-cols-2 gap-3 text-xs">
            <div className="bg-white border border-gray-200 rounded-lg px-3 py-2">
              <p className="text-gray-500 mb-1">Données du compte</p>
              <div className="space-y-1.5 text-gray-700">
                <p><span className="text-gray-500">ID :</span> {authUser.id}</p>
                <p><span className="text-gray-500">Email :</span> {authUser.email ?? '—'}</p>
                <p><span className="text-gray-500">Téléphone :</span> {phones[0] ?? '—'}</p>
                <p><span className="text-gray-500">Dernière connexion :</span> {fmtDate(authUser.last_sign_in_at)}</p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg px-3 py-2">
              <p className="text-gray-500 mb-1">Coordonnées connues (fiches liées)</p>
              <div className="space-y-1.5 text-gray-700">
                <p className="flex items-center gap-1.5"><Phone size={12} className="text-gray-400" /> {phones.join(' · ') || '—'}</p>
                {addresses.length === 0 ? (
                  <p className="flex items-center gap-1.5"><MapPin size={12} className="text-gray-400" /> —</p>
                ) : (
                  addresses.map((addr) => (
                    <p key={addr} className="flex items-start gap-1.5"><MapPin size={12} className="text-gray-400 mt-[2px] shrink-0" /><span>{addr}</span></p>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
            <Building2 size={14} className="text-gray-500" />
            <p className="text-sm font-semibold text-gray-800">Copropriétés liées</p>
          </div>

          <div className="divide-y divide-gray-100">
            {!isMember && syndicCopros.length === 0 && (
              <p className="px-4 py-6 text-sm text-gray-400">Aucune copropriété gérée.</p>
            )}
            {!isMember && syndicCopros.map((c) => (
              <div key={c.id} className="px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <Link href={`/admin/coproprietes/${c.id}`} className="text-sm font-medium text-gray-800 hover:text-indigo-700 hover:underline truncate">
                    {c.nom}
                  </Link>
                  <p className="text-xs text-gray-400">Créée le {fmtDate(c.created_at)}</p>
                </div>
                <PlanBadge plan={c.plan} planId={c.plan_id} />
              </div>
            ))}

            {isMember && memberRows.length === 0 && (
              <p className="px-4 py-6 text-sm text-gray-400">Aucune fiche copropriétaire liée.</p>
            )}
            {isMember && memberRows.map((m) => {
              const copro = Array.isArray(m.coproprietes) ? m.coproprietes[0] : m.coproprietes;
              return (
                <div key={m.id} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{copro?.nom ?? 'Copropriété inconnue'}</p>
                    <p className="text-xs text-gray-400 truncate">{[m.prenom, m.nom].filter(Boolean).join(' ')} · {m.email}</p>
                  </div>
                  <span className="text-xs font-semibold text-gray-700">{(m.solde ?? 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
            <LifeBuoy size={14} className="text-gray-500" />
            <p className="text-sm font-semibold text-gray-800">Support (10 derniers)</p>
          </div>
          {(ticketsRes.data ?? []).length === 0 ? (
            <p className="px-4 py-6 text-sm text-gray-400">Aucun ticket.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {(ticketsRes.data ?? []).map((t) => {
                const ticket = t as { id: string; subject: string; status: string; updated_at: string };
                return (
                  <Link key={ticket.id} href={`/admin/support?ticket=${ticket.id}`} className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-gray-50">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{ticket.subject}</p>
                      <p className="text-xs text-gray-400">Maj {fmtDate(ticket.updated_at)}</p>
                    </div>
                    <span className="text-xs text-gray-600 capitalize">{ticket.status.replace('_', ' ')}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
          <Clock size={14} className="text-gray-500" />
          <p className="text-sm font-semibold text-gray-800">Journal utilisateur (20 derniers événements)</p>
        </div>
        {(eventsRes.data ?? []).length === 0 ? (
          <p className="px-4 py-6 text-sm text-gray-400">Aucun événement.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {(eventsRes.data ?? []).map((e) => {
              const event = e as { id: string; event_type: string; label: string; created_at: string; severity?: string };
              const sevCls = event.severity === 'error'
                ? 'text-red-700 bg-red-50 border-red-200'
                : event.severity === 'warning'
                  ? 'text-amber-700 bg-amber-50 border-amber-200'
                  : 'text-gray-600 bg-gray-50 border-gray-200';
              return (
                <div key={event.id} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{event.label || event.event_type}</p>
                    <p className="text-xs text-gray-400">{event.event_type}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className={`inline-flex text-[11px] px-2 py-0.5 rounded-md border ${sevCls}`}>{event.severity ?? 'info'}</span>
                    <p className="text-[11px] text-gray-400 mt-1">{fmtDate(event.created_at)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className="text-xs text-gray-400 flex items-center gap-1.5">
        <Mail size={12} />
        Email de référence: {authUser.email ?? '—'}
      </div>
    </div>
  );
}
