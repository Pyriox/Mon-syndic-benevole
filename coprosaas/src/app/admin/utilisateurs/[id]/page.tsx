import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AlertTriangle, ArrowLeft, Building2, CheckCircle2, Clock, LifeBuoy, Mail, MapPin, Phone, ShieldAlert, User2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAdminUser } from '@/lib/admin-config';
import { appendAdminFrom, buildAdminPath, resolveAdminBackHref } from '@/lib/admin-list-params';
import { formatAdminDateTime } from '@/lib/admin-format';
import AdminImpersonate from '../../AdminImpersonate';
import AdminCopyId from '../../AdminCopyId';
import AdminUserEventTimeline from '../../AdminUserEventTimeline';
import AdminUserConfirmActions from '../../AdminUserConfirmActions';
import AdminLinkCoproprietaireUser from '../../AdminLinkCoproprietaireUser';
import AdminUserSuspendAction from '../../AdminUserSuspendAction';
import { PlanBadge, RoleBadge } from '../../AdminBadges';

const EVENT_CATEGORY_MAP = {
  billing: ['trial_started', 'subscription_created', 'subscription_cancelled', 'payment_succeeded', 'payment_failed'],
  account: ['account_confirmed', 'user_registered', 'password_reset_requested', 'login_success', 'login_failed', 'email_confirmation_resent'],
  admin: ['admin_user_deleted', 'admin_resend_confirmation', 'admin_force_confirm', 'admin_invitation_cancelled', 'admin_role_revoked', 'admin_role_granted', 'admin_user_updated', 'admin_invitation_deleted', 'admin_syndic_reassigned', 'admin_copro_updated', 'admin_impersonation_link_created', 'admin_coproprietaire_updated'],
} as const;

const USER_LEVEL_EVENT_TYPES: string[] = [
  ...EVENT_CATEGORY_MAP.billing,
  ...EVENT_CATEGORY_MAP.account,
  ...EVENT_CATEGORY_MAP.admin,
];

export default async function AdminUtilisateurProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ logPage?: string; from?: string; logCategory?: string; logLevel?: string }>;
}) {
  const { id } = await params;
  const { logPage, from, logCategory, logLevel } = await searchParams;
  const backHref = resolveAdminBackHref(from, '/admin/utilisateurs');

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
    admin.from('profiles').select('last_active_at, full_name, suspended_at').eq('id', id).maybeSingle(),
    admin.from('coproprietes').select('id, nom, plan, plan_id, created_at').eq('syndic_id', id).order('created_at', { ascending: false }),
  ]);

  const authUser = authUserRes.data.user;
  if (!authUser) {
    return (
      <div className="space-y-4 pb-16">
        <Link href={backHref} className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700">
          <ArrowLeft size={13} /> {from ? 'Retour au contexte précédent' : 'Retour aux utilisateurs'}
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
      .select('id, nom, prenom, raison_sociale, email, telephone, adresse, complement_adresse, code_postal, ville, solde, copropriete_id, user_id, coproprietes(id, nom)')
      .eq('user_id', id),
    email
      ? admin
          .from('coproprietaires')
          .select('id, nom, prenom, raison_sociale, email, telephone, adresse, complement_adresse, code_postal, ville, solde, copropriete_id, user_id, coproprietes(id, nom)')
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
    admin
      .from('user_events')
      .select('id, event_type, label, created_at, severity, metadata')
      .eq('user_id', id)
      .in('event_type', USER_LEVEL_EVENT_TYPES)
      .order('created_at', { ascending: false })
      .limit(100),
  ]);

  const syndicCopros = (syndicCoprosRes.data ?? []) as { id: string; nom: string; plan: string | null; plan_id: string | null; created_at: string }[];

  const memberRowsRaw = [
    ...((memberByIdRes.data ?? []) as Array<{ id: string; nom: string; prenom: string; raison_sociale: string | null; email: string; telephone: string | null; adresse: string | null; complement_adresse: string | null; code_postal: string | null; ville: string | null; solde: number; copropriete_id: string; user_id: string | null; coproprietes: { id?: string; nom: string } | { id?: string; nom: string }[] | null }>),
    ...((memberByEmailRes.data ?? []) as Array<{ id: string; nom: string; prenom: string; raison_sociale: string | null; email: string; telephone: string | null; adresse: string | null; complement_adresse: string | null; code_postal: string | null; ville: string | null; solde: number; copropriete_id: string; user_id: string | null; coproprietes: { id?: string; nom: string } | { id?: string; nom: string }[] | null }>),
  ];

  const seen = new Set<string>();
  const memberRows = memberRowsRaw.filter((row) => {
    if (seen.has(row.id)) return false;
    seen.add(row.id);
    return true;
  });

  const lastVisit = (profileRes.data as { last_active_at: string | null } | null)?.last_active_at ?? null;
  const lastActive = lastVisit ?? authUser.last_sign_in_at;
  const fullName = ((authUser.user_metadata as Record<string, string> | null)?.full_name
    ?? (profileRes.data as { full_name: string | null } | null)?.full_name
    ?? null);
  const isSuspended = !!((profileRes.data as { suspended_at?: string | null } | null)?.suspended_at);

  const allEvents = (eventsRes.data ?? []) as Array<{
    id: string;
    event_type: string;
    label: string;
    created_at: string;
    severity?: 'info' | 'warning' | 'error';
    metadata?: Record<string, unknown> | null;
  }>;
  const currentLogCategory = logCategory === 'billing' || logCategory === 'account' || logCategory === 'admin'
    ? logCategory
    : 'all';
  const currentLogLevel = logLevel === 'warning' || logLevel === 'error'
    ? logLevel
    : 'all';
  const filteredEvents = allEvents.filter((event) => {
    if (currentLogLevel !== 'all' && (event.severity ?? 'info') !== currentLogLevel) return false;
    if (currentLogCategory !== 'all') {
      const categoryEvents = EVENT_CATEGORY_MAP[currentLogCategory] as readonly string[];
      if (!categoryEvents.includes(event.event_type)) return false;
    }
    return true;
  });

  const EVENT_PAGE_SIZE = 10;
  const totalEventPages = Math.max(1, Math.ceil(filteredEvents.length / EVENT_PAGE_SIZE));
  const currentLogPage = Math.min(Math.max(1, Number(logPage) || 1), totalEventPages);
  const pagedEvents = filteredEvents.slice((currentLogPage - 1) * EVENT_PAGE_SIZE, currentLogPage * EVENT_PAGE_SIZE);

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
  const linkedCoproCount = isMember ? memberRows.length : syndicCopros.length;
  const supportCount = (ticketsRes.data ?? []).length;
  const accountSignals = [
    isSuspended ? 'Compte suspendu par un administrateur' : null,
    !authUser.email_confirmed_at ? 'E-mail non confirmé' : null,
    !lastActive ? 'Aucune activité récente remontée' : null,
    linkedCoproCount === 0 ? 'Aucune copropriété liée' : null,
    supportCount > 0 ? `${supportCount} ticket${supportCount > 1 ? 's' : ''} support en suivi` : null,
  ].filter((value): value is string => Boolean(value));
  const currentPageHref = buildAdminPath(`/admin/utilisateurs/${id}`, {
    from,
    logCategory: currentLogCategory !== 'all' ? currentLogCategory : undefined,
    logLevel: currentLogLevel !== 'all' ? currentLogLevel : undefined,
    logPage: currentLogPage > 1 ? String(currentLogPage) : undefined,
  });
  const countEventsForCategory = (category: keyof typeof EVENT_CATEGORY_MAP | 'all') => (
    category === 'all'
      ? allEvents.length
      : allEvents.filter((event) => (EVENT_CATEGORY_MAP[category] as readonly string[]).includes(event.event_type)).length
  );
  const countEventsForLevel = (level: 'all' | 'warning' | 'error') => (
    level === 'all'
      ? allEvents.length
      : allEvents.filter((event) => (event.severity ?? 'info') === level).length
  );

  return (
    <div className="space-y-6 pb-16">
      <div>
        <Link href={backHref} className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 mb-3 transition-colors">
          <ArrowLeft size={13} />
          {from ? 'Retour au contexte précédent' : 'Retour aux utilisateurs'}
        </Link>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <User2 size={18} className="text-gray-500" />
                {fullName || authUser.email || 'Utilisateur'}
              </h1>
              <p className="text-sm text-gray-500 mt-1">{authUser.email ?? '—'}</p>
              <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
                <span className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 font-medium text-indigo-700">
                  {linkedCoproCount} copropriété{linkedCoproCount > 1 ? 's' : ''} liée{linkedCoproCount > 1 ? 's' : ''}
                </span>
                <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 font-medium text-gray-700">
                  {supportCount} ticket{supportCount > 1 ? 's' : ''} support
                </span>
                <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 font-medium text-blue-700">
                  {allEvents.length} événements récents
                </span>
                {countEventsForLevel('warning') > 0 && (
                  <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 font-medium text-amber-700">
                    {countEventsForLevel('warning')} warning{countEventsForLevel('warning') > 1 ? 's' : ''}
                  </span>
                )}
                {countEventsForLevel('error') > 0 && (
                  <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2 py-0.5 font-medium text-red-700">
                    {countEventsForLevel('error')} erreur{countEventsForLevel('error') > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <RoleBadge role={role} />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-3 mt-4 text-xs">
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
              <p className="text-gray-500">Inscription</p>
              <p className="font-semibold text-gray-800 mt-0.5">{formatAdminDateTime(authUser.created_at)}</p>
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
                <p><span className="text-gray-500">Dernière visite :</span> {lastActive ? formatAdminDateTime(lastActive) : '—'}{lastVisit === null && lastActive ? <span className="ml-1.5 text-xs text-gray-400">(dernière connexion)</span> : null}</p>
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

          <div className="mt-4 grid lg:grid-cols-[1.1fr_0.9fr] gap-3 text-xs">
            <div className={`rounded-lg border px-3 py-3 ${accountSignals.length > 0 ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50'}`}>
              <p className={`mb-2 flex items-center gap-1.5 text-sm font-semibold ${accountSignals.length > 0 ? 'text-amber-800' : 'text-emerald-800'}`}>
                {accountSignals.length > 0 ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
                Signaux à surveiller
              </p>
              {accountSignals.length === 0 ? (
                <p className="text-emerald-700">Aucun signal bloquant détecté sur ce compte.</p>
              ) : (
                <ul className="space-y-1 text-amber-800">
                  {accountSignals.map((signal) => (
                    <li key={signal}>• {signal}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-3">
              <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-red-800">
                <ShieldAlert size={14} /> Actions sensibles
              </p>
              <div className="flex flex-wrap gap-2">
                <AdminCopyId id={id} />
                {!isAdmin && <AdminImpersonate email={authUser.email ?? ''} />}
                {!authUser.email_confirmed_at && (
                  <AdminUserConfirmActions userId={id} userEmail={authUser.email ?? ''} />
                )}
                {!isAdmin && (
                  <AdminUserSuspendAction userId={id} userEmail={authUser.email ?? ''} isSuspended={isSuspended} />
                )}
                {supportCount > 0 && (
                  <Link href={`/admin/support?q=${encodeURIComponent(authUser.email ?? '')}`} className="inline-flex items-center rounded-lg border border-red-200 bg-white px-2.5 py-1.5 font-medium text-red-700 hover:border-red-300">
                    Voir le support
                  </Link>
                )}
              </div>
              <p className="mt-2 text-red-700/80">
                Réserver ces actions aux vérifications manuelles ou à l’assistance directe d’un utilisateur.
              </p>
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
                  <Link href={appendAdminFrom(`/admin/coproprietes/${c.id}`, currentPageHref)} className="text-sm font-medium text-gray-800 hover:text-indigo-700 hover:underline truncate">
                    {c.nom}
                  </Link>
                  <p className="text-xs text-gray-400">Créée le {formatAdminDateTime(c.created_at)}</p>
                </div>
                <PlanBadge plan={c.plan} planId={c.plan_id} />
              </div>
            ))}

            {isMember && memberRows.length === 0 && (
              <p className="px-4 py-6 text-sm text-gray-400">Aucune fiche copropriétaire liée.</p>
            )}
            {isMember && memberRows.map((m) => {
              const copro = Array.isArray(m.coproprietes) ? m.coproprietes[0] : m.coproprietes;
              const displayName = m.raison_sociale || [m.prenom, m.nom].filter(Boolean).join(' ') || '—';
              const needsLink = !m.user_id || m.user_id !== id;
              return (
                <div key={m.id} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={appendAdminFrom(`/admin/coproprietes/${copro?.id ?? m.copropriete_id}`, currentPageHref)}
                      className="text-sm font-medium text-gray-800 hover:text-indigo-700 hover:underline truncate"
                    >
                      {copro?.nom ?? 'Copropriété inconnue'}
                    </Link>
                    <p className="text-xs text-gray-400 truncate">{[m.prenom, m.nom].filter(Boolean).join(' ')} · {m.email}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {needsLink && (
                      <AdminLinkCoproprietaireUser
                        coproprietaireId={m.id}
                        userId={id}
                        displayName={displayName}
                        coproNom={copro?.nom ?? 'Copropriété inconnue'}
                      />
                    )}
                    <span className="text-xs font-semibold text-gray-700">{(m.solde ?? 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
                  </div>
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
                      <p className="text-xs text-gray-400">Maj {formatAdminDateTime(ticket.updated_at)}</p>
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
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-gray-500" />
              <p className="text-sm font-semibold text-gray-800">Journal utilisateur (100 derniers événements)</p>
            </div>
            <p className="text-xs text-gray-400">{filteredEvents.length} résultat{filteredEvents.length > 1 ? 's' : ''} · 10 par page</p>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-1.5 text-xs">
              {([
                { key: 'all', label: 'Tout' },
                { key: 'account', label: 'Compte' },
                { key: 'billing', label: 'Facturation' },
                { key: 'admin', label: 'Admin' },
              ] as const).map((item) => (
                <Link
                  key={item.key}
                  href={buildAdminPath(`/admin/utilisateurs/${id}`, {
                    from,
                    logCategory: item.key !== 'all' ? item.key : undefined,
                    logLevel: currentLogLevel !== 'all' ? currentLogLevel : undefined,
                    logPage: undefined,
                  })}
                  className={`rounded-full border px-2.5 py-1 font-medium ${currentLogCategory === item.key ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-indigo-300'}`}
                >
                  {item.label} · {countEventsForCategory(item.key)}
                </Link>
              ))}
            </div>

            <div className="flex flex-wrap gap-1.5 text-xs">
              {([
                { key: 'all', label: 'Tous niveaux' },
                { key: 'warning', label: 'Warnings' },
                { key: 'error', label: 'Erreurs' },
              ] as const).map((item) => (
                <Link
                  key={item.key}
                  href={buildAdminPath(`/admin/utilisateurs/${id}`, {
                    from,
                    logCategory: currentLogCategory !== 'all' ? currentLogCategory : undefined,
                    logLevel: item.key !== 'all' ? item.key : undefined,
                    logPage: undefined,
                  })}
                  className={`rounded-full border px-2.5 py-1 font-medium ${currentLogLevel === item.key ? 'border-gray-800 bg-gray-800 text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400'}`}
                >
                  {item.label} · {countEventsForLevel(item.key)}
                </Link>
              ))}
            </div>
          </div>
        </div>
        <AdminUserEventTimeline
          events={pagedEvents}
          currentPage={currentLogPage}
          totalPages={totalEventPages}
          totalItems={filteredEvents.length}
          basePath={`/admin/utilisateurs/${id}`}
          pageSize={EVENT_PAGE_SIZE}
          queryParams={{
            from,
            logCategory: currentLogCategory !== 'all' ? currentLogCategory : undefined,
            logLevel: currentLogLevel !== 'all' ? currentLogLevel : undefined,
          }}
          emptyMessage={allEvents.length === 0 ? 'Aucun événement.' : 'Aucun événement pour ces filtres.'}
        />
      </section>

      <div className="text-xs text-gray-400 flex items-center gap-1.5">
        <Mail size={12} />
        Email de référence: {authUser.email ?? '—'}
      </div>
    </div>
  );
}
