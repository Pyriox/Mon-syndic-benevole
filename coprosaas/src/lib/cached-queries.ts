// ============================================================
// Requêtes mises en cache côté serveur (Next.js unstable_cache)
// Utilise le client service role (admin) pour ne pas dépendre des
// cookies de session — les données sont scopées par userId / coproId.
//
// TTL : 30 s pour les données de navigation et notifications.
// La fraîcheur est suffisante : un incident créé apparaîtra dans
// les 30 secondes, ce qui est acceptable pour une cloche de notifs.
//
// Tags d'invalidation :
//   layout-{userId}            → getDashboardLayoutData
//   lots-{coproId}             → getLots
//   coproprietaires-{coproId}  → getCoproprietaires
// ============================================================
import { unstable_cache, revalidateTag } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { buildDashboardExpenseSnapshot, buildDashboardUnpaidSnapshot, isDashboardUnpaidActiveStatus } from '@/lib/dashboard-data';
import type { AppNotification } from '@/types';

function assertSupabaseSuccess(
  context: string,
  result: { error?: { message?: string } | null },
) {
  if (result.error) {
    throw new Error(`[${context}] ${result.error.message ?? 'Supabase query failed'}`);
  }
}

function safeRevalidateTag(tag: string) {
  try {
    revalidateTag(tag, 'default');
  } catch {
    // Les tests unitaires exécutent parfois ces helpers hors contexte App Router.
  }
}

// ── Helpers d'invalidation (à appeler depuis les Server Actions) ──────────────
export function invalidateLayoutCache(userId: string) {
  safeRevalidateTag(`layout-${userId}`);
}
export function invalidateLotsCache(coproId: string) {
  safeRevalidateTag(`lots-${coproId}`);
}
export function invalidateCoproprietairesCache(coproId: string) {
  safeRevalidateTag(`coproprietaires-${coproId}`);
}
export function invalidateDashboardCache(coproId: string) {
  safeRevalidateTag(`dashboard-${coproId}`);
}

// ── Profil + copropriétés (layout global) ────────────────────────────────────
// Cache : 30 s par utilisateur — invalider via invalidateLayoutCache(userId)
export function getDashboardLayoutData(userId: string, userEmail: string) {
  return unstable_cache(
    async () => {
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
    ['layout-data', userId],
    { tags: [`layout-${userId}`], revalidate: 30 },
  )();
}

// ── Lots d'une copropriété ────────────────────────────────────────────────────
// Cache : 60 s — invalider via invalidateLotsCache(coproId)
export function getLots(coproId: string) {
  return unstable_cache(
    async () => {
      const admin = createAdminClient();
      const { data } = await admin
        .from('lots')
        .select('id, numero, type, tantiemes, coproprietaire_id, batiment, groupes_repartition, tantiemes_groupes')
        .eq('copropriete_id', coproId)
        .order('position', { ascending: true, nullsFirst: false });
      return data ?? [];
    },
    ['lots', coproId],
    { tags: [`lots-${coproId}`], revalidate: 60 },
  )();
}

// ── Copropriétaires d'une copropriété ─────────────────────────────────────────
// Cache : 30 s — invalider via invalidateCoproprietairesCache(coproId)
export function getCoproprietaires(coproId: string) {
  return unstable_cache(
    async () => {
      const admin = createAdminClient();
      const { data } = await admin
        .from('coproprietaires')
        .select('id, nom, prenom, raison_sociale, user_id, email')
        .eq('copropriete_id', coproId)
        .order('nom');
      return data ?? [];
    },
    ['coproprietaires', coproId],
    { tags: [`coproprietaires-${coproId}`], revalidate: 30 },
  )();
}

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
        .select('id, titre, statut, date_echeance, lignes_appels_de_fonds(paye)')
        .eq('copropriete_id', coproId)
        .in('statut', ['publie', 'confirme'])
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
      if (!isDashboardUnpaidActiveStatus((appel as { statut?: string | null }).statut)) continue;
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

// ── Dashboard syndic : snapshot agrégé pour streaming + cache court ──────────
export function getSyndicDashboardSnapshot(coproId: string) {
  return unstable_cache(
    async () => {
      if (!coproId || coproId === 'none') {
      return {
        currentYear: new Date().getFullYear(),
        prevYear: new Date().getFullYear() - 1,
        nbLots: 0,
        nbCoproprietaires: 0,
        hasProvisions: false,
        totalProvisions: 0,
        totalFondsTravaux: 0,
        totalDepensesAvecFT: 0,
        ecartPrevisionnel: 0,
        tendanceDepenses: 'nouveau' as const,
        pctTendance: 0,
        totalMontantImpaye: 0,
        nbImpayes: 0,
        nbLignesImpayees: 0,
        nbIncidentsOuverts: 0,
        depenses: [] as Array<{ id: string; titre: string; montant: number; date_depense: string; categorie: string }>,
        repartitionBudget: [] as Array<{ cat: string; total: number; pct: number }>,
        totalBudget: 0,
        assemblees: [] as Array<{ id: string; titre: string; date_ag: string; statut: string }>,
        nbImpayes60j: 0,
        montantImpayes60j: 0,
        incidentsAnciens: [] as Array<{ id: string; titre: string; statut: string; priorite: string; date_declaration: string }>,
        agUrgente: false,
        prochaineAG: null as { id: string; titre: string; date_ag: string; statut: string } | null,
        joursAvantAG: null as number | null,
        agEnCours: null as { id: string; titre: string; date_ag: string } | null,
        agTermineeSansPV: null as { id: string; titre: string; date_ag: string } | null,
      };
    }

    const admin = createAdminClient();
    const now = new Date();
    const nowTs = now.getTime();
    const todayStr = now.toISOString().split('T')[0];
    const sixtyDaysAgoStr = new Date(nowTs - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const currentYear = now.getFullYear();
    const prevYear = currentYear - 1;

    const [
      lotsResult,
      coproprietairesResult,
      depensesResult,
      depensesAllResult,
      depensesAnPasseResult,
      incidentsResult,
      assembleesResult,
      appelsEchusResult,
      appelsProvisionsResult,
      agEnCoursResult,
      agTermineeSansPVResult,
    ] = await Promise.all([
      admin.from('lots').select('id', { count: 'exact', head: true }).eq('copropriete_id', coproId),
      admin.from('coproprietaires').select('id', { count: 'exact', head: true }).eq('copropriete_id', coproId),
      admin
        .from('depenses')
        .select('id, titre, montant, date_depense, categorie')
        .eq('copropriete_id', coproId)
        .gte('date_depense', `${currentYear}-01-01`)
        .lt('date_depense', `${currentYear + 1}-01-01`)
        .order('date_depense', { ascending: false })
        .limit(5),
      admin
        .from('depenses')
        .select('categorie, montant')
        .eq('copropriete_id', coproId)
        .gte('date_depense', `${currentYear}-01-01`)
        .lt('date_depense', `${currentYear + 1}-01-01`),
      admin
        .from('depenses')
        .select('montant')
        .eq('copropriete_id', coproId)
        .gte('date_depense', `${prevYear}-01-01`)
        .lt('date_depense', `${prevYear + 1}-01-01`),
      admin
        .from('incidents')
        .select('id, titre, statut, priorite, date_declaration')
        .eq('copropriete_id', coproId)
        .neq('statut', 'resolu')
        .order('date_declaration', { ascending: false })
        .limit(5),
      admin
        .from('assemblees_generales')
        .select('id, titre, date_ag, statut')
        .eq('copropriete_id', coproId)
        .gte('date_ag', now.toISOString())
        .neq('statut', 'terminee')
        .neq('statut', 'annulee')
        .order('date_ag', { ascending: true })
        .limit(3),
      admin
        .from('appels_de_fonds')
        .select('id, statut, date_echeance, lignes_appels_de_fonds(id, coproprietaire_id, montant_du, paye)')
        .eq('copropriete_id', coproId)
        .in('statut', ['publie', 'confirme'])
        .lt('date_echeance', todayStr),
      admin
        .from('appels_de_fonds')
        .select('montant_total, type_appel, montant_fonds_travaux')
        .eq('copropriete_id', coproId)
        .gte('date_echeance', `${currentYear}-01-01`)
        .lt('date_echeance', `${currentYear + 1}-01-01`),
      admin
        .from('assemblees_generales')
        .select('id, titre, date_ag, statut')
        .eq('copropriete_id', coproId)
        .eq('statut', 'en_cours')
        .order('date_ag', { ascending: false })
        .limit(1),
      admin
        .from('assemblees_generales')
        .select('id, titre, date_ag')
        .eq('copropriete_id', coproId)
        .eq('statut', 'terminee')
        .is('pv_envoye_le', null)
        .gte('date_ag', new Date(nowTs - 60 * 24 * 60 * 60 * 1000).toISOString())
        .order('date_ag', { ascending: false })
        .limit(1),
    ]);

      assertSupabaseSuccess('dashboard lots', lotsResult);
      assertSupabaseSuccess('dashboard coproprietaires', coproprietairesResult);
      assertSupabaseSuccess('dashboard depenses recentes', depensesResult);
      assertSupabaseSuccess('dashboard depenses aggregation', depensesAllResult);
      assertSupabaseSuccess('dashboard depenses N-1', depensesAnPasseResult);
      assertSupabaseSuccess('dashboard incidents', incidentsResult);
      assertSupabaseSuccess('dashboard assemblees', assembleesResult);
      assertSupabaseSuccess('dashboard appels echus', appelsEchusResult);
      assertSupabaseSuccess('dashboard appels provisions', appelsProvisionsResult);
      assertSupabaseSuccess('dashboard ag en cours', agEnCoursResult);
      assertSupabaseSuccess('dashboard ag terminee sans pv', agTermineeSansPVResult);

      const nbLots = lotsResult.count;
      const nbCoproprietaires = coproprietairesResult.count;
      const depenses = depensesResult.data;
      const depensesAll = depensesAllResult.data;
      const depensesAnPasse = depensesAnPasseResult.data;
      const incidents = incidentsResult.data;
      const assemblees = assembleesResult.data;
      const appelsEchus = appelsEchusResult.data;
      const appelsProvisions = appelsProvisionsResult.data;
      const agEnCoursData = agEnCoursResult.data?.[0] ?? null;
      const agTermineeSansPVData = agTermineeSansPVResult.data?.[0] ?? null;

    const totalDepensesAnPasse = depensesAnPasse?.reduce((sum, depense) => sum + depense.montant, 0) ?? 0;

    const provisionsBP = (appelsProvisions ?? []).filter(
      (appel) => appel.type_appel === 'budget_previsionnel' || appel.type_appel === 'revision_budget' || appel.type_appel == null,
    );
    const provisionsRows = (appelsProvisions ?? []).filter(
      (appel) => appel.type_appel === 'budget_previsionnel' || appel.type_appel === 'revision_budget' || appel.type_appel === 'fonds_travaux' || appel.type_appel == null,
    );

    const hasProvisions = provisionsRows.length > 0;
    const totalProvisions = provisionsRows.reduce((sum, appel) => sum + (appel.montant_total ?? 0), 0);
    const totalFondsTravaux = provisionsRows.reduce((sum, appel) => {
      if (appel.type_appel === 'fonds_travaux') return sum + (appel.montant_total ?? 0);
      return sum + ((appel as { montant_fonds_travaux?: number }).montant_fonds_travaux ?? 0);
    }, 0);
    const totalFondsTravauxBP = provisionsBP.reduce(
      (sum, appel) => sum + ((appel as { montant_fonds_travaux?: number }).montant_fonds_travaux ?? 0),
      0,
    );
    const expenseSnapshot = buildDashboardExpenseSnapshot({
      depensesRecentes: (depenses ?? []).map((depense) => ({
        id: depense.id,
        titre: depense.titre,
        montant: depense.montant,
        date_depense: depense.date_depense,
        categorie: depense.categorie ?? 'autre',
      })),
      depensesAll: (depensesAll ?? []).map((depense) => ({
        montant: depense.montant,
        categorie: depense.categorie ?? 'autre',
      })),
      totalFondsTravaux,
    });
    const totalDepenses = expenseSnapshot.totalDepenses;
    const totalProvisionsBP = provisionsBP.reduce((sum, appel) => sum + (appel.montant_total ?? 0), 0);
    const totalProvisionsBPHorsFT = totalProvisionsBP - totalFondsTravauxBP;
    const ecartPrevisionnel = totalProvisionsBPHorsFT - totalDepenses;
    const totalDepensesAvecFT = totalDepenses + totalFondsTravaux;

    let tendanceDepenses: 'hausse' | 'baisse' | 'stable' | 'nouveau' = 'nouveau';
    let pctTendance = 0;
    if (totalDepensesAnPasse > 0) {
      pctTendance = Math.round(((totalDepenses - totalDepensesAnPasse) / totalDepensesAnPasse) * 100);
      if (Math.abs(pctTendance) <= 2) tendanceDepenses = 'stable';
      else if (pctTendance > 0) tendanceDepenses = 'hausse';
      else tendanceDepenses = 'baisse';
    }

    const lignesImpayeesEchues = (appelsEchus ?? []).flatMap((appel) =>
      ((appel.lignes_appels_de_fonds ?? []) as Array<{ id: string; coproprietaire_id: string | null; montant_du: number; paye: boolean }>).map((ligne) => ({
        id: ligne.id,
        coproprietaire_id: ligne.coproprietaire_id ?? null,
        montant_du: ligne.montant_du,
        paye: ligne.paye,
        date_echeance: appel.date_echeance ?? null,
        appel_statut: (appel as { statut?: string | null }).statut ?? null,
      })),
    );

    const { totalMontantImpaye, nbImpayes, nbLignesImpayees } = buildDashboardUnpaidSnapshot({
      lignes: lignesImpayeesEchues,
      today: todayStr,
    });
    const nbIncidentsOuverts = incidents?.length ?? 0;

    const lignesImpayes60j = lignesImpayeesEchues.filter((ligne) => {
      if (ligne.paye) return false;
      if ((ligne.montant_du ?? 0) <= 0) return false;
      if (!ligne.date_echeance) return false;
      return ligne.date_echeance < sixtyDaysAgoStr;
    });
    const nbImpayes60j = lignesImpayes60j.length;
    const montantImpayes60j = lignesImpayes60j.reduce((sum, ligne) => sum + ligne.montant_du, 0);

    const sevenDaysAgo = new Date(nowTs - 7 * 24 * 60 * 60 * 1000);
    const incidentsAnciens = (incidents ?? []).filter(
      (incident) => incident.statut === 'ouvert' && new Date(incident.date_declaration) < sevenDaysAgo,
    );

    const prochaineAG = assemblees?.[0] ?? null;
    const joursAvantAG = prochaineAG
      ? Math.ceil((new Date(prochaineAG.date_ag).getTime() - nowTs) / (1000 * 60 * 60 * 24))
      : null;
    const agUrgente = joursAvantAG !== null && joursAvantAG <= 30;

    return {
      currentYear,
      prevYear,
      nbLots: nbLots ?? 0,
      nbCoproprietaires: nbCoproprietaires ?? 0,
      hasProvisions,
      totalProvisions,
      totalFondsTravaux,
      totalDepensesAvecFT,
      ecartPrevisionnel,
      tendanceDepenses,
      pctTendance,
      totalMontantImpaye,
      nbImpayes,
      nbLignesImpayees,
      nbIncidentsOuverts,
      depenses: expenseSnapshot.depenses,
      repartitionBudget: expenseSnapshot.repartitionBudget,
      totalBudget: expenseSnapshot.totalBudget,
      assemblees: (assemblees ?? []).map((ag) => ({
        id: ag.id,
        titre: ag.titre,
        date_ag: ag.date_ag,
        statut: ag.statut,
      })),
      nbImpayes60j,
      montantImpayes60j,
      incidentsAnciens: (incidentsAnciens ?? []).map((incident) => ({
        id: incident.id,
        titre: incident.titre,
        statut: incident.statut,
        priorite: incident.priorite,
        date_declaration: incident.date_declaration,
      })),
      agUrgente,
      prochaineAG: prochaineAG
        ? {
            id: prochaineAG.id,
            titre: prochaineAG.titre,
            date_ag: prochaineAG.date_ag,
            statut: prochaineAG.statut,
          }
        : null,
      joursAvantAG,
      agEnCours: agEnCoursData
        ? { id: agEnCoursData.id, titre: agEnCoursData.titre, date_ag: agEnCoursData.date_ag }
        : null,
      agTermineeSansPV: agTermineeSansPVData
        ? { id: agTermineeSansPVData.id, titre: agTermineeSansPVData.titre, date_ag: agTermineeSansPVData.date_ag }
        : null,
    };
    },
    ['dashboard-syndic-snapshot-v2', coproId],
    { revalidate: 30, tags: [`dashboard-${coproId}`] },
  )();
}

// ── Dashboard copropriétaire : snapshot personnel mis en cache ───────────────
export function getCoproprietaireDashboardSnapshot(userId: string, coproId: string) {
  return unstable_cache(
    async () => {
      if (!userId || !coproId || coproId === 'none') {
      return {
        fiche: null as null | { id: string; nom: string | null; prenom: string | null; raison_sociale: string | null; solde: number },
        assembleesUpcoming: [] as Array<{ id: string; titre: string; date_ag: string; statut: string }>,
        chargesImpayees: [] as Array<{ id: string; montant_du: number; appel: { id: string; titre: string; date_echeance: string | null } | null }>,
        prochaineAG: null as { id: string; titre: string; date_ag: string; statut: string } | null,
        joursAvantAG: null as number | null,
        solde: 0,
        displayFirstName: null as string | null,
        balanceEvents: [] as Array<{ id: string; event_date: string; source_type: string; account_type: 'principal' | 'fonds_travaux' | 'regularisation' | 'mixte'; label: string; reason: string | null; amount: number; balance_after: number; created_at: string }>,
      };
    }

    const admin = createAdminClient();
    const nowTs = Date.now();

    const [
      ficheResult,
      assembleesUpcomingResult,
    ] = await Promise.all([
      admin
        .from('coproprietaires')
        .select('id, nom, prenom, raison_sociale, solde')
        .eq('copropriete_id', coproId)
        .eq('user_id', userId)
        .maybeSingle(),
      admin
        .from('assemblees_generales')
        .select('id, titre, date_ag, statut')
        .eq('copropriete_id', coproId)
        .gte('date_ag', new Date().toISOString().split('T')[0])
        .neq('statut', 'terminee')
        .neq('statut', 'annulee')
        .order('date_ag', { ascending: true })
        .limit(3),
    ]);

    assertSupabaseSuccess('dashboard copro fiche', ficheResult);
    assertSupabaseSuccess('dashboard copro assemblees', assembleesUpcomingResult);

    const fiche = ficheResult.data;
    const assembleesUpcoming = assembleesUpcomingResult.data;

    const chargesImpayeesResult = fiche
      ? await admin
          .from('lignes_appels_de_fonds')
          .select('id, montant_du, appels_de_fonds!inner(id, titre, date_echeance)')
          .eq('coproprietaire_id', fiche.id)
          .eq('paye', false)
          .limit(5)
      : { data: null, error: null };

    assertSupabaseSuccess('dashboard copro charges impayees', chargesImpayeesResult);
    const chargesImpayees = chargesImpayeesResult.data;

    const balanceEventsResult = fiche
      ? await admin
          .from('coproprietaire_balance_events')
          .select('id, event_date, source_type, account_type, label, reason, amount, balance_after, created_at')
          .eq('coproprietaire_id', fiche.id)
          .order('event_date', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(12)
      : { data: null, error: null };

    assertSupabaseSuccess('dashboard copro balance events', balanceEventsResult);
    const balanceEvents = balanceEventsResult.data;

    const prochaineAG = assembleesUpcoming?.[0] ?? null;
    const joursAvantAG = prochaineAG
      ? Math.ceil((new Date(prochaineAG.date_ag).getTime() - nowTs) / (1000 * 60 * 60 * 24))
      : null;
    const solde = fiche?.solde ?? 0;
    const displayFirstName = (fiche?.raison_sociale ? fiche.raison_sociale : (fiche?.prenom ?? fiche?.nom ?? ''))
      .split(' ')[0] || null;

    return {
      fiche: fiche
        ? {
            id: fiche.id,
            nom: fiche.nom,
            prenom: fiche.prenom,
            raison_sociale: fiche.raison_sociale,
            solde: fiche.solde ?? 0,
          }
        : null,
      assembleesUpcoming: (assembleesUpcoming ?? []).map((ag) => ({
        id: ag.id,
        titre: ag.titre,
        date_ag: ag.date_ag,
        statut: ag.statut,
      })),
      chargesImpayees: (chargesImpayees ?? []).map((ligne) => {
        const appel = ligne.appels_de_fonds as unknown as { id: string; titre: string; date_echeance: string | null };
        return {
          id: ligne.id,
          montant_du: ligne.montant_du,
          appel: appel
            ? {
                id: appel.id,
                titre: appel.titre,
                date_echeance: appel.date_echeance,
              }
            : null,
        };
      }),
      prochaineAG: prochaineAG
        ? {
            id: prochaineAG.id,
            titre: prochaineAG.titre,
            date_ag: prochaineAG.date_ag,
            statut: prochaineAG.statut,
          }
        : null,
      joursAvantAG,
      solde,
      displayFirstName,
      balanceEvents: (balanceEvents ?? []).map((event) => ({
        id: event.id,
        event_date: event.event_date,
        source_type: event.source_type,
        account_type: event.account_type,
        label: event.label,
        reason: event.reason,
        amount: event.amount,
        balance_after: event.balance_after,
        created_at: event.created_at,
      })),
    };
    },
    ['dashboard-coproprietaire-snapshot', userId, coproId],
    { revalidate: 30, tags: [`dashboard-${coproId}`, `dashboard-user-${coproId}-${userId}`] },
  )();
}
