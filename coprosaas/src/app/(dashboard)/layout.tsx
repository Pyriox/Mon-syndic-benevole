// ============================================================
// Layout du dashboard (entourant toutes les pages protégées)
// Contient la Sidebar + Header + zone de contenu principale
// ============================================================
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
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

  // Récupération du profil utilisateur
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single();

  const userName = profile?.full_name ?? user.email ?? '';

  // --- Copropriétés en tant que SYNDIC ---
  const { data: syndicCopros } = await supabase
    .from('coproprietes')
    .select('id, nom, adresse, ville')
    .eq('syndic_id', user.id)
    .order('nom');

  // --- Copropriétés en tant que COPROPRIÉTAIRE ---
  const { data: coproRows } = await supabase
    .from('coproprietaires')
    .select('copropriete_id, coproprietes(id, nom, adresse, ville)')
    .eq('user_id', user.id);

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
    ...(coproRows ?? [])
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
  const userRole = selectedCopro?.role ?? 'syndic';

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
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar fixe à gauche */}
      <Sidebar
        coproprietes={userCoproprietes}
        selectedCoproId={selectedCoproId}
        userRole={userRole}
      />

      {/* Zone principale : header + contenu */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header title={selectedCopro?.nom ?? 'CoproSaaS'} userName={userName} notifications={notifications} />

        {/* Contenu de la page */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
