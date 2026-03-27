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
import DashboardShell from '@/components/layout/DashboardShell';
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
  const userRole = selectedCopro?.role ?? accountRoleFromDb;

  // --- Notifications (uniquement pour le syndic sur la copropriété sélectionnée) ---
  const notifications: AppNotification[] = [];

  if (selectedCoproId && userRole === 'syndic') {
    notifications.push(...await getSyndicNotifications(selectedCoproId));
  }

  // --- Notifications pour les copropriétaires ---
  if (selectedCoproId && userRole === 'copropriétaire') {
    notifications.push(...await getCoproNotifications(user.id, selectedCoproId));
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
        });
      }
    }
  } catch {
    // Tables support pas encore créées ou autre erreur non bloquante
  }

  return (
    <DashboardShell
      coproprietes={userCoproprietes}
      selectedCoproId={selectedCoproId}
      userRole={userRole}
      title={selectedCopro?.nom ?? 'Mon Syndic Bénévole'}
      userName={userName}
      notifications={notifications}
    >
      {children}
    </DashboardShell>
  );
}
