// ============================================================
// Layout du dashboard (entourant toutes les pages protégées)
// Contient la Sidebar + Header + zone de contenu principale
// ============================================================
import { redirect } from 'next/navigation';
import { after } from 'next/server';
import { cookies } from 'next/headers';
import { createClient, getAuthUser } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getDashboardLayoutData, getSyndicNotifications, getCoproNotifications } from '@/lib/cached-queries';
import { getAvailableDashboardRoles, normalizeDashboardViewMode, resolveDashboardRole } from '@/lib/dashboard-view-mode';
import ActivityHeartbeat from '@/components/ActivityHeartbeat';
import DashboardShell from '@/components/layout/DashboardShell';
import DashboardTracker from '@/components/DashboardTracker';
import InternalPageTracker from '@/components/InternalPageTracker';
import { Toaster } from 'sonner';
import { Suspense } from 'react';
import type { UserCopropriete, AppNotification } from '@/types';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  // Vérification de la session côté serveur
  // getAuthUser() est wrappé avec React.cache → partagé avec requireCoproAccess dans les pages
  // → 1 seul appel auth.getUser() (réseau) par request au lieu de 2
  const user = await getAuthUser();

  // Redirection si non connecté
  if (!user) {
    redirect('/login');
  }

  // Client Supabase (même instance React.cache que getAuthUser — 0 overhead)
  const supabase = await createClient();

  // Récupération du profil et des copropriétés (mise en cache 30 s côté serveur)
  const { profile, syndicCopros, coproRows, coproRowsByEmail } = await getDashboardLayoutData(
    user.id,
    user.email ?? '',
  );

  const userName = profile?.full_name ?? user.email ?? '';

  // Fusionne les coproprietaires trouvés par user_id et par email (non liés)
  const linkedCoproIds = new Set((coproRows ?? []).map((r) => r.copropriete_id));
  const unlinkedRows = (coproRowsByEmail ?? []).filter((r) => !linkedCoproIds.has(r.copropriete_id));
  const allCoproRows = [...(coproRows ?? []), ...unlinkedRows];

  // Auto-liaison : si des fiches sont trouvées par email sans user_id, on les lie après la réponse
  if (unlinkedRows.length > 0 && user.email) {
    const userId = user.id;
    const userEmail = user.email.toLowerCase();
    after(async () => {
      try {
        const admin = createAdminClient();
        await admin
          .from('coproprietaires')
          .update({ user_id: userId })
          .eq('email', userEmail)
          .is('user_id', null);
      } catch {
        // Silencieux — non critique
      }
    });
  }

  // Déduplique et fusionne les deux listes avec le rôle associé
  const syndicIds = new Set((syndicCopros ?? []).map((c) => c.id));
  const coproIds = new Set(
    allCoproRows
      .map((row) => (row.coproprietes as unknown as { id: string } | null)?.id)
      .filter((id): id is string => Boolean(id))
  );
  const userCoproprietes: UserCopropriete[] = [
    ...(syndicCopros ?? []).map((c) => ({
      id: c.id,
      nom: c.nom,
      adresse: c.adresse,
      ville: c.ville,
      role: 'syndic' as const,
    })),
    ...allCoproRows
      .filter((row) => {
        const copro = row.coproprietes as unknown as { id: string } | null;
        return copro && !syndicIds.has(copro.id);
      })
      .map((row) => {
        const copro = row.coproprietes as unknown as { id: string; nom: string; adresse: string; ville: string };
        return {
          id: copro.id,
          nom: copro.nom,
          adresse: copro.adresse,
          ville: copro.ville,
          role: 'copropriétaire' as const,
        };
      }),
  ];

  // --- Copropriété sélectionnée (cookie) ---
  const cookieStore = await cookies();
  let selectedCoproId = cookieStore.get('selected_copro_id')?.value ?? null;
  const preferredViewMode = normalizeDashboardViewMode(cookieStore.get('dashboard_view_mode')?.value ?? null);

  // Si la valeur du cookie n'est plus valide (copropriété supprimée), fallback sur la première
  if (selectedCoproId && !userCoproprietes.find((c) => c.id === selectedCoproId)) {
    selectedCoproId = null;
  }
  if (!selectedCoproId && userCoproprietes.length > 0) {
    selectedCoproId = userCoproprietes[0].id;
  }

  const selectedCopro = userCoproprietes.find((c) => c.id === selectedCoproId) ?? null;
  // Utilise le rôle de la copropriété sélectionnée, ou le rôle déterminé depuis la DB en fallback
  // Nouveau compte sans aucune copropriété → syndic par défaut
  const accountRoleFromDb: 'syndic' | 'copropriétaire' =
    (syndicCopros ?? []).length > 0 ? 'syndic' :
    allCoproRows.length > 0 ? 'copropriétaire' :
    'syndic';
  const hasSelectedSyndicAccess = selectedCoproId ? syndicIds.has(selectedCoproId) : false;
  const hasSelectedCoproAccess = selectedCoproId ? coproIds.has(selectedCoproId) : false;
  const availableViewRoles = getAvailableDashboardRoles({
    hasSyndicAccess: hasSelectedSyndicAccess,
    hasCoproAccess: hasSelectedCoproAccess,
  });
  const userRole = selectedCoproId
    ? resolveDashboardRole({
        preferredMode: preferredViewMode,
        hasSyndicAccess: hasSelectedSyndicAccess,
        hasCoproAccess: hasSelectedCoproAccess,
        defaultRole: 'syndic',
      }) ?? accountRoleFromDb
    : accountRoleFromDb;

  // --- Notifications persistantes (centre de notifications) ---
  const notifications: AppNotification[] = [];

  const { data: persistentNotifs } = await supabase
    .from('app_notifications')
    .select('id, type, severity, title, body, href, action_label, is_read, created_at, copropriete_id')
    .eq('user_id', user.id)
    .or(selectedCoproId ? `copropriete_id.is.null,copropriete_id.eq.${selectedCoproId}` : 'copropriete_id.is.null')
    .order('created_at', { ascending: false })
    .limit(30);

  for (const n of persistentNotifs ?? []) {
    notifications.push({
      id: n.id,
      type: n.type,
      severity: n.severity,
      title: n.title,
      body: n.body ?? undefined,
      href: n.href,
      actionLabel: n.action_label ?? undefined,
      isRead: n.is_read,
      createdAt: n.created_at,
      source: 'persistent',
      canMarkRead: true,
    });
  }

  // --- Alertes dynamiques (uniquement pour le syndic sur la copropriété sélectionnée) ---

  if (selectedCoproId && userRole === 'syndic') {
    notifications.push(
      ...(await getSyndicNotifications(selectedCoproId)).map((notification) => ({
        ...notification,
        source: 'dynamic' as const,
        canMarkRead: false,
      }))
    );
  }

  // --- Notifications pour les copropriétaires ---
  if (selectedCoproId && userRole === 'copropriétaire') {
    notifications.push(
      ...(await getCoproNotifications(user.id, selectedCoproId)).map((notification) => ({
        ...notification,
        source: 'dynamic' as const,
        canMarkRead: false,
      }))
    );
  }

  // --- Messages support non lus (tous les rôles) ---
  try {
    const { data: unreadMsgs } = await supabase
      .from('support_messages')
      .select('ticket_id')
      .eq('author', 'admin')
      .eq('client_read', false);

    if (unreadMsgs && unreadMsgs.length > 0) {
      const ticketIds = [...new Set(unreadMsgs.map((m) => m.ticket_id))];
      const { data: ticketsWithUnread } = await supabase
        .from('support_tickets')
        .select('id, subject')
        .in('id', ticketIds)
        .limit(3);

      for (const t of ticketsWithUnread ?? []) {
        const count = unreadMsgs.filter((m) => m.ticket_id === t.id).length;
        notifications.push({
          id: `support-${t.id}`,
          type: 'support',
          label: t.subject,
          sublabel: `${count} nouveau${count > 1 ? 'x' : ''} message${count > 1 ? 's' : ''} du support`,
          href: '/aide',
          severity: 'info',
          isRead: false,
          source: 'support',
          canMarkRead: false,
        });
      }
    }
  } catch {
    // Tables support pas encore créées ou autre erreur non bloquante
  }

  // --- Mise à jour last_active_at (non-bloquant, après réponse) ---
  after(async () => {
    try {
      const admin = createAdminClient();
      await admin
        .from('profiles')
        .upsert({ id: user.id, last_active_at: new Date().toISOString() }, { onConflict: 'id' });
    } catch {
      // Non critique
    }
  });

  return (
    <DashboardShell
      coproprietes={userCoproprietes}
      selectedCoproId={selectedCoproId}
      userRole={userRole}
      availableViewRoles={availableViewRoles}
      title={selectedCopro?.nom ?? 'Mon Syndic Bénévole'}
      userName={userName}
      notifications={notifications}
    >
      <ActivityHeartbeat />
      <Toaster richColors position="top-right" />
      <Suspense>
        <InternalPageTracker role={userRole} />
      </Suspense>
      <Suspense>
        <DashboardTracker userRole={userRole} />
      </Suspense>
      {children}
    </DashboardShell>
  );
}
