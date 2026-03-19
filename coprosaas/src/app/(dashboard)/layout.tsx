// ============================================================
// Layout du dashboard (entourant toutes les pages protégées)
// Contient la Sidebar + Header + zone de contenu principale
// ============================================================
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import DashboardShell from '@/components/layout/DashboardShell';
import type { UserCopropriete, AppNotification } from '@/types';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  // Vérification de la session côté serveur
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Redirection si non connecté
  if (!user) {
    redirect('/login');
  }

  // Récupération du profil, copropriétés syndic et lots en parallèle
  const [
    { data: profile },
    { data: syndicCopros },
    { data: coproRows },
    { data: coproRowsByEmail },
  ] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user.id).single(),
    supabase.from('coproprietes').select('id, nom, adresse, ville').eq('syndic_id', user.id).order('nom'),
    supabase.from('coproprietaires').select('copropriete_id, coproprietes(id, nom, adresse, ville)').eq('user_id', user.id),
    // Fallback pour les copropriétaires non encore liés (user_id non renseigné)
    supabase.from('coproprietaires').select('copropriete_id, coproprietes(id, nom, adresse, ville)').eq('email', user.email ?? '').is('user_id', null),
  ]);

  const userName = profile?.full_name ?? user.email ?? '';

  // Fusionne les coproprietaires trouvés par user_id et par email (non liés)
  const linkedCoproIds = new Set((coproRows ?? []).map((r) => r.copropriete_id));
  const unlinkedRows = (coproRowsByEmail ?? []).filter((r) => !linkedCoproIds.has(r.copropriete_id));
  const allCoproRows = [...(coproRows ?? []), ...unlinkedRows];

  // Auto-liaison : si des fiches sont trouvées par email sans user_id, on les lie maintenant
  if (unlinkedRows.length > 0 && user.email) {
    try {
      const admin = createAdminClient();
      await admin
        .from('coproprietaires')
        .update({ user_id: user.id })
        .eq('email', user.email.toLowerCase())
        .is('user_id', null);
    } catch {
      // Non bloquant
    }
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
  const accountRoleFromDb: 'syndic' | 'copropriétaire' = (syndicCopros ?? []).length > 0 ? 'syndic' : 'copropriétaire';
  const userRole = selectedCopro?.role ?? accountRoleFromDb;

  // --- Notifications (uniquement pour le syndic sur la copropriété sélectionnée) ---
  const notifications: AppNotification[] = [];

  if (selectedCoproId && userRole === 'syndic') {
    const today = new Date().toISOString().split('T')[0];
    const in30days = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

    const [
      { data: impayes },
      { data: incidents },
      { data: agImminentes },
      { data: appelsRetard },
    ] = await Promise.all([
      // Copropriétaires avec solde négatif
      supabase
        .from('coproprietaires')
        .select('id, nom, prenom, solde')
        .eq('copropriete_id', selectedCoproId)
        .lt('solde', 0),

      // Incidents ouverts ou en cours
      supabase
        .from('incidents')
        .select('id, titre, statut, priorite')
        .eq('copropriete_id', selectedCoproId)
        .in('statut', ['ouvert', 'en_cours'])
        .order('priorite', { ascending: false })
        .limit(5),

      // AG dans les 30 prochains jours
      supabase
        .from('assemblees_generales')
        .select('id, titre, date_ag')
        .eq('copropriete_id', selectedCoproId)
        .in('statut', ['planifiee', 'en_cours'])
        .gte('date_ag', today)
        .lte('date_ag', in30days)
        .order('date_ag', { ascending: true })
        .limit(3),

      // Appels de fonds dont l'échéance est dépassée et pas entièrement payés
      supabase
        .from('appels_de_fonds')
        .select('id, titre, date_echeance, lignes_appels_de_fonds(paye)')
        .eq('copropriete_id', selectedCoproId)
        .lt('date_echeance', today)
        .order('date_echeance', { ascending: true })
        .limit(5),
    ]);

    // Impayés
    for (const cp of impayes ?? []) {
      const nom = [cp.prenom, cp.nom].filter(Boolean).join(' ') || 'Copropriétaire';
      notifications.push({
        id: `impaye-${cp.id}`,
        type: 'impaye',
        label: `${nom} — solde débiteur`,
        sublabel: `${cp.solde.toFixed(2)} €`,
        href: '/coproprietaires',
        severity: 'danger',
      });
    }

    // Incidents ouverts
    for (const inc of incidents ?? []) {
      notifications.push({
        id: `incident-${inc.id}`,
        type: 'incident',
        label: inc.titre,
        sublabel: inc.statut === 'ouvert' ? 'Ouvert' : 'En cours',
        href: '/incidents',
        severity: inc.priorite === 'urgente' ? 'danger' : 'warning',
      });
    }

    // AG imminentes
    for (const ag of agImminentes ?? []) {
      const d = new Date(ag.date_ag);
      notifications.push({
        id: `ag-${ag.id}`,
        type: 'ag',
        label: ag.titre,
        sublabel: d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }),
        href: '/assemblees',
        severity: 'info',
      });
    }

    // Appels de fonds en retard (au moins une ligne non payée)
    for (const appel of appelsRetard ?? []) {
      const lignes = (appel.lignes_appels_de_fonds ?? []) as { paye: boolean }[];
      const nbImpaye = lignes.filter((l) => !l.paye).length;
      if (nbImpaye > 0) {
        const d = new Date(appel.date_echeance);
        notifications.push({
          id: `appel-${appel.id}`,
          type: 'appel_fonds',
          label: appel.titre,
          sublabel: `Échu le ${d.toLocaleDateString('fr-FR')} · ${nbImpaye} impayé(s)`,
          href: '/appels-de-fonds',
          severity: 'warning',
        });
      }
    }
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
