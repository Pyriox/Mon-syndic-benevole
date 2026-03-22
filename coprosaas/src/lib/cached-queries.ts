// ============================================================
// Requêtes mises en cache côté serveur (Next.js unstable_cache)
// Utilise le client service role (admin) pour ne pas dépendre des
// cookies de session — les données sont scopées par userId / coproId.
//
// TTL : 30 s pour les données de navigation et notifications.
// La fraîcheur est suffisante : un incident créé apparaîtra dans
// les 30 secondes, ce qui est acceptable pour une cloche de notifs.
// ============================================================
import { unstable_cache } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import type { AppNotification } from '@/types';

// ── Profil + copropriétés (layout global) ────────────────────────────────────
// Cache : 30 secondes par utilisateur
export const getDashboardLayoutData = unstable_cache(
  async (userId: string, userEmail: string) => {
    const admin = createAdminClient();
    const [
      { data: profile },
      { data: syndicCopros },
      { data: coproRows },
      { data: coproRowsByEmail },
    ] = await Promise.all([
      admin.from('profiles').select('full_name').eq('id', userId).single(),
      admin
        .from('coproprietes')
        .select('id, nom, adresse, ville')
        .eq('syndic_id', userId)
        .order('nom'),
      admin
        .from('coproprietaires')
        .select('copropriete_id, coproprietes(id, nom, adresse, ville)')
        .eq('user_id', userId),
      // Fallback pour les copropriétaires non encore liés (user_id non renseigné)
      admin
        .from('coproprietaires')
        .select('copropriete_id, coproprietes(id, nom, adresse, ville)')
        .eq('email', userEmail)
        .is('user_id', null),
    ]);
    return { profile, syndicCopros, coproRows, coproRowsByEmail };
  },
  ['dashboard-layout-data'],
  { revalidate: 30 },
);

// ── Notifications syndic ──────────────────────────────────────────────────────
// Cache : 30 secondes par copropriété
export const getSyndicNotifications = unstable_cache(
  async (coproId: string): Promise<AppNotification[]> => {
    const admin = createAdminClient();
    const today = new Date().toISOString().split('T')[0];
    const in30days = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
    const notifications: AppNotification[] = [];

    const [
      { data: impayes },
      { data: incidents },
      { data: agImminentes },
      { data: appelsRetard },
    ] = await Promise.all([
      admin
        .from('coproprietaires')
        .select('id, nom, prenom, solde')
        .eq('copropriete_id', coproId)
        .lt('solde', 0)
        .order('solde', { ascending: true })
        .limit(5),
      admin
        .from('incidents')
        .select('id, titre, statut, priorite')
        .eq('copropriete_id', coproId)
        .in('statut', ['ouvert', 'en_cours'])
        .order('priorite', { ascending: false })
        .limit(5),
      admin
        .from('assemblees_generales')
        .select('id, titre, date_ag')
        .eq('copropriete_id', coproId)
        .in('statut', ['planifiee', 'en_cours'])
        .gte('date_ag', today)
        .lte('date_ag', in30days)
        .order('date_ag', { ascending: true })
        .limit(3),
      admin
        .from('appels_de_fonds')
        .select('id, titre, date_echeance, lignes_appels_de_fonds(paye)')
        .eq('copropriete_id', coproId)
        .lt('date_echeance', today)
        .order('date_echeance', { ascending: true })
        .limit(5),
    ]);

    for (const cp of impayes ?? []) {
      const nom = [cp.prenom, cp.nom].filter(Boolean).join(' ') || 'Copropriétaire';
      notifications.push({
        id: `impaye-${cp.id}`,
        type: 'impaye',
        label: `${nom} — solde débiteur`,
        sublabel: `${(cp.solde as number).toFixed(2)} €`,
        href: '/coproprietaires',
        severity: 'danger',
      });
    }

    for (const inc of incidents ?? []) {
      notifications.push({
        id: `incident-${inc.id}`,
        type: 'incident',
        label: inc.titre,
        sublabel: inc.statut === 'ouvert' ? 'Ouvert' : 'En cours',
        href: '/incidents',
        severity: (inc.priorite as string) === 'urgente' ? 'danger' : 'warning',
      });
    }

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

    return notifications;
  },
  ['syndic-notifications'],
  { revalidate: 30 },
);

// ── Notifications copropriétaire ──────────────────────────────────────────────
// Cache : 30 secondes par utilisateur + copropriété
export const getCoproNotifications = unstable_cache(
  async (userId: string, coproId: string): Promise<AppNotification[]> => {
    const admin = createAdminClient();
    const today = new Date().toISOString().split('T')[0];
    const in30days = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
    const notifications: AppNotification[] = [];

    const { data: maCopro } = await admin
      .from('coproprietaires')
      .select('id, solde')
      .eq('copropriete_id', coproId)
      .eq('user_id', userId)
      .maybeSingle();

    if (!maCopro) return notifications;

    const [
      { data: lignesImpayes },
      { data: agImminentes },
      { data: incidents },
    ] = await Promise.all([
      admin
        .from('lignes_appels_de_fonds')
        .select('id, montant_du, appels_de_fonds!inner(id, titre, date_echeance)')
        .eq('coproprietaire_id', maCopro.id)
        .eq('paye', false),
      admin
        .from('assemblees_generales')
        .select('id, titre, date_ag')
        .eq('copropriete_id', coproId)
        .in('statut', ['planifiee', 'en_cours'])
        .gte('date_ag', today)
        .lte('date_ag', in30days)
        .order('date_ag', { ascending: true })
        .limit(3),
      admin
        .from('incidents')
        .select('id, titre, statut, priorite')
        .eq('copropriete_id', coproId)
        .in('statut', ['ouvert', 'en_cours'])
        .order('priorite', { ascending: false })
        .limit(3),
    ]);

    if ((maCopro.solde as number) < 0) {
      notifications.push({
        id: `solde-${maCopro.id}`,
        type: 'impaye',
        label: 'Votre solde est débiteur',
        sublabel: `${(maCopro.solde as number).toFixed(2)} €`,
        href: '/dashboard',
        severity: 'danger',
      });
    }

    for (const ligne of lignesImpayes ?? []) {
      const appel = ligne.appels_de_fonds as unknown as { id: string; titre: string; date_echeance: string };
      if (appel.date_echeance >= today) continue;
      const d = new Date(appel.date_echeance);
      notifications.push({
        id: `appel-${appel.id}`,
        type: 'appel_fonds',
        label: appel.titre,
        sublabel: `Échu le ${d.toLocaleDateString('fr-FR')} — ${(ligne.montant_du as number).toFixed(2)} €`,
        href: '/appels-de-fonds',
        severity: 'warning',
      });
    }

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

    for (const inc of incidents ?? []) {
      notifications.push({
        id: `incident-${inc.id}`,
        type: 'incident',
        label: inc.titre,
        sublabel: inc.statut === 'ouvert' ? 'Ouvert' : 'En cours',
        href: '/incidents',
        severity: 'warning',
      });
    }

    return notifications;
  },
  ['copropriétaire-notifications'],
  { revalidate: 30 },
);
