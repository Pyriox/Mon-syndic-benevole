// ============================================================
// Route : GET /api/cron/rappels-appels
// Cron quotidien (08h00) — notifications automatiques appels de fonds
//
//  J-30 : avis initial aux copropriétaires (appels publiés sans email envoyé
//         dont l'échéance est dans <= 30 jours)
//  J-7  : rappel pré-échéance aux copropriétaires impayés
//  J+15 : mise en demeure post-échéance aux copropriétaires impayés
//
// Le J-30 permet de publier tous les appels d'un coup après une AG
// sans spammer les copropriétaires des échéances lointaines.
//
// Appelé par Vercel Cron (vercel.json) avec header Authorization
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { Resend } from 'resend';
import { buildAppelEmail, buildAppelEmailSubject, type AppelEmailType } from '@/lib/emails/appel-de-fonds';
import { buildBrouillonRappelEmail, buildBrouillonRappelSubject } from '@/lib/emails/syndic-notifications';
import { buildTrialEndingEmail, buildTrialEndingSubject } from '@/lib/emails/subscription';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.mon-syndic-benevole.fr';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM   = `Mon Syndic Bénévole <${process.env.EMAIL_FROM ?? 'noreply@mon-syndic-benevole.fr'}>`;

function addDays(base: Date, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  // Protection par secret partagé (Vercel ajoute Authorization: Bearer <CRON_SECRET>)
  const auth = req.headers.get('authorization');
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayStr = today.toISOString().slice(0, 10);
  const dateJ30 = addDays(today, 30);  // avis : appels publiés dont l'échéance est dans <= 30 jours
  const dateJ7  = addDays(today, 7);   // appels avec échéance dans 7 jours
  const dateJ15 = addDays(today, -15); // appels avec échéance il y a 15 jours

  // ── Avis J-30 : appels publiés dont l'email n'a pas encore été envoyé ──
  // .gte('date_echeance', todayStr) empêche d'envoyer un "avis J-30" pour un
  // appel dont l'échéance est déjà dépassée (publie tardif ou cron manqué).
  const { data: avisAppels } = await supabase
    .from('appels_de_fonds')
    .select('id, titre, montant_total, date_echeance, coproprietes(nom)')
    .eq('statut', 'publie')
    .is('emailed_at', null)
    .gte('date_echeance', todayStr)
    .lte('date_echeance', dateJ30);

  // Appels à rappeler (J-7)
  const { data: j7Appels } = await supabase
    .from('appels_de_fonds')
    .select('id, titre, montant_total, date_echeance, coproprietes(nom)')
    .eq('statut', 'publie')
    .eq('date_echeance', dateJ7)
    .is('rappel_j7_at', null);

  // Appels en mise en demeure (J+15)
  const { data: j15Appels } = await supabase
    .from('appels_de_fonds')
    .select('id, titre, montant_total, date_echeance, coproprietes(nom)')
    .eq('statut', 'publie')
    .eq('date_echeance', dateJ15)
    .is('rappel_j15_at', null);

  let totalSent = 0;

  // Traitement avis J-30 (email initial différé)
  for (const appel of avisAppels ?? []) {
    const sent = await sendRappelEmails(supabase, appel as unknown as AppelRow, 'avis');
    if (sent >= 0) {
      await supabase.from('appels_de_fonds')
        .update({ emailed_at: new Date().toISOString() })
        .eq('id', appel.id);
    }
    totalSent += sent;
  }

  // Traitement J-7
  for (const appel of j7Appels ?? []) {
    const sent = await sendRappelEmails(supabase, appel as unknown as AppelRow, 'rappel');
    if (sent >= 0) {
      await supabase.from('appels_de_fonds')
        .update({ rappel_j7_at: new Date().toISOString() })
        .eq('id', appel.id);
    }
    totalSent += sent;
  }

  // Traitement J+15
  for (const appel of j15Appels ?? []) {
    const sent = await sendRappelEmails(supabase, appel as unknown as AppelRow, 'mise_en_demeure');
    if (sent >= 0) {
      await supabase.from('appels_de_fonds')
        .update({ rappel_j15_at: new Date().toISOString() })
        .eq('id', appel.id);
    }
    totalSent += sent;
  }

  // ── Rappel brouillons non publiés (> 3 jours) ──────────────────────────────
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

  const { data: brouillons } = await supabase
    .from('appels_de_fonds')
    .select('id, copropriete_id, coproprietes(nom, profiles!coproprietes_syndic_id_fkey(email, full_name))')
    .eq('statut', 'brouillon')
    .lt('created_at', threeDaysAgo)
    .is('rappel_brouillon_at', null);

  // Groupe par copropriété (un seul e-mail par copropriété, listant tous ses brouillons)
  type BrouillonRow = {
    id: string;
    copropriete_id: string;
    coproprietes: { nom: string; profiles: { email: string; full_name: string } | { email: string; full_name: string }[] | null } | null;
  };

  const brouillonGroups = new Map<string, { coproprieteNom: string; syndicEmail: string; syndicPrenom: string; ids: string[] }>();

  for (const b of (brouillons ?? []) as unknown as BrouillonRow[]) {
    const copro = b.coproprietes;
    if (!copro) continue;
    const profile = Array.isArray(copro.profiles) ? copro.profiles[0] : copro.profiles;
    if (!profile?.email) continue;

    if (!brouillonGroups.has(b.copropriete_id)) {
      brouillonGroups.set(b.copropriete_id, {
        coproprieteNom: copro.nom,
        syndicEmail: profile.email,
        syndicPrenom: (profile.full_name ?? '').split(' ')[0] || 'Syndic',
        ids: [],
      });
    }
    brouillonGroups.get(b.copropriete_id)!.ids.push(b.id);
  }

  for (const [, group] of brouillonGroups) {
    const n = group.ids.length;
    const { error } = await resend.emails.send({
      from: FROM,
      to: group.syndicEmail,
      subject: buildBrouillonRappelSubject(group.coproprieteNom, n),
      html: buildBrouillonRappelEmail({
        syndicPrenom: group.syndicPrenom,
        coproprieteNom: group.coproprieteNom,
        nombreBrouillons: n,
        appelsUrl: `${SITE_URL}/appels-de-fonds`,
      }),
    });
    if (!error) {
      await supabase
        .from('appels_de_fonds')
        .update({ rappel_brouillon_at: new Date().toISOString() })
        .in('id', group.ids);
      totalSent++;
    }
  }

  // ── Rappel J-3 fin d'essai ──────────────────────────────────────────────────
  // On envoie un email au syndic quand plan='essai' et plan_period_end = today + 3 jours.
  // Le cron quotidien garantit qu'il ne sera envoyé qu'une seule fois (la période est fixe).
  const dateJ3 = addDays(today, 3);

  const { data: trialsEndingJ3 } = await supabase
    .from('coproprietes')
    .select('id, nom, plan_id, plan_period_end, profiles!coproprietes_syndic_id_fkey(email, full_name)')
    .eq('plan', 'essai')
    .eq('plan_period_end', dateJ3);

  type TrialRow = {
    id: string;
    nom: string;
    plan_id: string | null;
    plan_period_end: string | null;
    profiles: { email: string; full_name: string | null } | { email: string; full_name: string | null }[] | null;
  };

  for (const row of (trialsEndingJ3 ?? []) as unknown as TrialRow[]) {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    if (!profile?.email) continue;

    const prenom = (profile.full_name ?? '').split(' ')[0] || null;
    const planLabel = row.plan_id === 'illimite' ? 'Illimité' : row.plan_id === 'confort' ? 'Confort' : 'Essentiel';

    const { error } = await resend.emails.send({
      from: FROM,
      to: profile.email,
      subject: buildTrialEndingSubject(row.nom),
      html: buildTrialEndingEmail({
        prenom,
        coproprieteNom: row.nom,
        planLabel,
        periodEnd: row.plan_period_end,
        dashboardUrl: `${SITE_URL}/abonnement`,
      }),
    });
    if (!error) totalSent++;
    else console.error('[cron] Erreur email trial J-3:', error);
  }

  return NextResponse.json({
    ok: true,
    date: today.toISOString().slice(0, 10),
    avis_appels:       avisAppels?.length    ?? 0,
    j7_appels:         j7Appels?.length      ?? 0,
    j15_appels:        j15Appels?.length     ?? 0,
    brouillon_groupes: brouillonGroups.size,
    trial_j3:          trialsEndingJ3?.length ?? 0,
    sent: totalSent,
  });
}

// ---- Types locaux ----
interface AppelRow {
  id: string;
  titre: string;
  date_echeance: string;
  coproprietes: { nom: string } | null;
}

type CopRow = { nom: string; prenom: string; email: string; user_id: string | null };
type LigneRow = {
  montant_du: number;
  regularisation_ajustement: number | null;
  coproprietaires: CopRow | CopRow[] | null;
};

// ---- Envoi des notifications pour un appel donné ----
async function sendRappelEmails(
  supabase: ReturnType<typeof createServerClient>,
  appel: AppelRow,
  type: AppelEmailType
): Promise<number> {
  // Pour l'avis initial (J-30), on cible toutes les lignes.
  // Pour les rappels (J-7) et mises en demeure (J+15), uniquement les impayées.
  const query = supabase
    .from('lignes_appels_de_fonds')
    .select('montant_du, regularisation_ajustement, coproprietaires(nom, prenom, email, user_id)')
    .eq('appel_de_fonds_id', appel.id);

  const { data: lignes } = type === 'avis'
    ? await query
    : await query.eq('paye', false);

  if (!lignes?.length) return 0;

  const coproprieteNom = appel.coproprietes?.nom ?? '';

  // Collecte des copropriétaires à notifier
  const rows = (lignes as LigneRow[]).map((l) => {
    const c = Array.isArray(l.coproprietaires) ? l.coproprietaires[0] : l.coproprietaires;
    return {
      cop: c as CopRow | null,
      montant_du: l.montant_du,
      regularisation_ajustement: l.regularisation_ajustement ?? 0,
    };
  }).filter((r): r is { cop: CopRow; montant_du: number; regularisation_ajustement: number } => r.cop !== null);

  // Résolution des emails manquants en parallèle (batch, pas de N+1)
  const userIdsToResolve: string[] = [...new Set<string>(
    rows.filter((r) => !r.cop.email && r.cop.user_id).map((r) => r.cop.user_id as string)
  )];

  const emailByUserId = new Map<string, string>();
  if (userIdsToResolve.length > 0) {
    const results = await Promise.all(
      userIdsToResolve.map((uid) => supabase.auth.admin.getUserById(uid))
    );
    userIdsToResolve.forEach((uid, i) => {
      const email = results[i].data?.user?.email ?? '';
      if (email) emailByUserId.set(uid, email);
    });
  }

  // Envoi des emails
  let sent = 0;
  await Promise.all(rows.map(async ({ cop, montant_du, regularisation_ajustement }) => {
    const email = cop.email || (cop.user_id ? emailByUserId.get(cop.user_id) ?? '' : '');
    if (!email) return;

    const { error } = await resend.emails.send({
      from: FROM,
      to: email,
      subject: buildAppelEmailSubject({ type, coproprieteNom, dateEcheance: appel.date_echeance }),
      html: buildAppelEmail({
        type,
        prenom:         cop.prenom,
        nom:            cop.nom,
        coproprieteNom,
        titre:          appel.titre,
        montantDu:      montant_du,
        regularisationAjustement: regularisation_ajustement,
        dateEcheance:   appel.date_echeance,
      }),
    });
    if (!error) sent++;
  }));

  return sent;
}
