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
import {
  buildBrouillonRappelEmail,
  buildBrouillonRappelSubject,
  buildBrouillonEcheanceEmail,
  buildBrouillonEcheanceSubject,
  buildSyndicOnboardingReminderEmail,
  buildSyndicOnboardingReminderSubject,
  type SyndicOnboardingReminderKind,
  type BrouillonEcheanceType,
} from '@/lib/emails/syndic-notifications';
import { buildTrialEndingEmail, buildTrialEndingSubject } from '@/lib/emails/subscription';
import { trackEmailDelivery } from '@/lib/email-delivery';
import { resolveOnboardingKinds } from '@/lib/onboarding-reminders';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.mon-syndic-benevole.fr';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM   = `Mon Syndic Bénévole <${process.env.EMAIL_FROM ?? 'noreply@mon-syndic-benevole.fr'}>`;

async function trackCronEmail(params: {
  providerMessageId?: string | null;
  errorMessage?: string | null;
  templateKey: string;
  recipientEmail: string;
  subject: string;
  coproprieteId?: string | null;
  payload?: Record<string, unknown>;
  legalEventType?: string | null;
  legalReference?: string | null;
}): Promise<void> {
  await trackEmailDelivery({
    providerMessageId: params.providerMessageId ?? null,
    templateKey: params.templateKey,
    status: params.errorMessage ? 'failed' : 'sent',
    recipientEmail: params.recipientEmail,
    coproprieteId: params.coproprieteId ?? null,
    subject: params.subject,
    legalEventType: params.legalEventType ?? null,
    legalReference: params.legalReference ?? null,
    payload: params.payload ?? { trigger: 'cron' },
    lastError: params.errorMessage ?? null,
  });
}

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

  const onboardingOnly = req.nextUrl.searchParams.get('onboarding_only') === '1';
  const onboardingForce = req.nextUrl.searchParams.get('onboarding_force') === '1';
  const onboardingTestEmail = normalizeEmail(req.nextUrl.searchParams.get('onboarding_test_email'));
  const onboardingKindParam = req.nextUrl.searchParams.get('onboarding_kind') as SyndicOnboardingReminderKind | 'all' | null;
  const onboardingKinds = resolveOnboardingKinds({
    requestedKind: onboardingKindParam,
    force: onboardingForce,
    hasTargetEmails: Boolean(onboardingTestEmail),
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayStr = today.toISOString().slice(0, 10);
  const dateJ30 = addDays(today, 30);  // avis : appels publiés dont l'échéance est dans <= 30 jours
  const dateJ14 = addDays(today, 14);  // brouillons non publiés : rappel syndic J-14
  const dateJ7  = addDays(today, 7);   // appels avec échéance dans 7 jours
  const dateJ15 = addDays(today, -15); // appels avec échéance il y a 15 jours
  const dateM2  = addDays(today, -2);  // onboarding syndic : J+2 après confirmation de compte
  const dateM7  = addDays(today, -7);  // onboarding syndic : J+7 après confirmation de compte

  // ── Avis J-30 : appels publiés dont l'email n'a pas encore été envoyé ──
  // .gte('date_echeance', todayStr) empêche d'envoyer un "avis J-30" pour un
  // appel dont l'échéance est déjà dépassée (publie tardif ou cron manqué).
  const { data: avisAppels } = await supabase
    .from('appels_de_fonds')
    .select('id, copropriete_id, titre, montant_total, date_echeance, coproprietes(nom)')
    .eq('statut', 'publie')
    .is('emailed_at', null)
    .gte('date_echeance', todayStr)
    .lte('date_echeance', dateJ30);

  // Appels à rappeler (J-7)
  const { data: j7Appels } = await supabase
    .from('appels_de_fonds')
    .select('id, copropriete_id, titre, montant_total, date_echeance, coproprietes(nom)')
    .eq('statut', 'publie')
    .eq('date_echeance', dateJ7)
    .is('rappel_j7_at', null);

  // Appels en mise en demeure (J+15)
  const { data: j15Appels } = await supabase
    .from('appels_de_fonds')
    .select('id, copropriete_id, titre, montant_total, date_echeance, coproprietes(nom)')
    .eq('statut', 'publie')
    .eq('date_echeance', dateJ15)
    .is('rappel_j15_at', null);

  let totalSent = 0;

  if (!onboardingOnly) {
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
  }

  // ── Rappel brouillons non publiés (> 3 jours) ──────────────────────────────
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

  const { data: brouillons } = await supabase
    .from('appels_de_fonds')
    .select('id, copropriete_id, coproprietes(nom, profiles!coproprietes_syndic_id_fkey(email, full_name))')
    .eq('statut', 'brouillon')
    .lt('created_at', threeDaysAgo)
    .is('rappel_brouillon_at', null);

  const { data: brouillonsJ14 } = await supabase
    .from('appels_de_fonds')
    .select('id, copropriete_id, coproprietes(nom, profiles!coproprietes_syndic_id_fkey(email, full_name))')
    .eq('statut', 'brouillon')
    .eq('date_echeance', dateJ14)
    .is('rappel_brouillon_j14_at', null);

  const { data: brouillonsJ7 } = await supabase
    .from('appels_de_fonds')
    .select('id, copropriete_id, coproprietes(nom, profiles!coproprietes_syndic_id_fkey(email, full_name))')
    .eq('statut', 'brouillon')
    .eq('date_echeance', dateJ7)
    .is('rappel_brouillon_j7_at', null);

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: brouillonsJ1Urgent } = await supabase
    .from('appels_de_fonds')
    .select('id, copropriete_id, coproprietes(nom, profiles!coproprietes_syndic_id_fkey(email, full_name))')
    .eq('statut', 'brouillon')
    .lt('created_at', oneDayAgo)
    .gte('date_echeance', todayStr)
    .lt('date_echeance', dateJ7)
    .is('rappel_brouillon_j1_urgent_at', null);

  // Groupe par copropriété (un seul e-mail par copropriété, listant tous ses brouillons)
  type BrouillonRow = {
    id: string;
    copropriete_id: string;
    coproprietes: { nom: string; profiles: { email: string; full_name: string } | { email: string; full_name: string }[] | null } | null;
  };

  function groupBrouillons(rows: BrouillonRow[]) {
    const groups = new Map<string, { coproprieteNom: string; syndicEmail: string; syndicPrenom: string; ids: string[] }>();
    for (const b of rows) {
      const copro = b.coproprietes;
      if (!copro) continue;
      const profile = Array.isArray(copro.profiles) ? copro.profiles[0] : copro.profiles;
      if (!profile?.email) continue;

      if (!groups.has(b.copropriete_id)) {
        groups.set(b.copropriete_id, {
          coproprieteNom: copro.nom,
          syndicEmail: profile.email,
          syndicPrenom: (profile.full_name ?? '').split(' ')[0] || 'Syndic',
          ids: [],
        });
      }
      groups.get(b.copropriete_id)!.ids.push(b.id);
    }
    return groups;
  }

  const brouillonGroups = groupBrouillons((brouillons ?? []) as unknown as BrouillonRow[]);
  const brouillonJ14Groups = groupBrouillons((brouillonsJ14 ?? []) as unknown as BrouillonRow[]);
  const brouillonJ7Groups = groupBrouillons((brouillonsJ7 ?? []) as unknown as BrouillonRow[]);
  const brouillonJ1UrgentGroups = groupBrouillons((brouillonsJ1Urgent ?? []) as unknown as BrouillonRow[]);

  if (!onboardingOnly) {
    for (const [coproprieteId, group] of brouillonGroups) {
      const n = group.ids.length;
      const subject = buildBrouillonRappelSubject(group.coproprieteNom, n);
      const result = await resend.emails.send({
        from: FROM,
        to: group.syndicEmail,
        subject,
        html: buildBrouillonRappelEmail({
          syndicPrenom: group.syndicPrenom,
          coproprieteNom: group.coproprieteNom,
          nombreBrouillons: n,
          appelsUrl: `${SITE_URL}/appels-de-fonds`,
        }),
      });
      await trackCronEmail({
        providerMessageId: result.data?.id,
        errorMessage: result.error?.message,
        templateKey: 'appel_brouillon_rappel',
        recipientEmail: group.syndicEmail,
        subject,
        coproprieteId,
        legalEventType: 'appel_brouillon_rappel',
        legalReference: group.ids.join(','),
        payload: { trigger: 'cron', reminderType: 'brouillon', appelIds: group.ids },
      });
      if (!result.error) {
        await supabase
          .from('appels_de_fonds')
          .update({ rappel_brouillon_at: new Date().toISOString() })
          .in('id', group.ids);
        totalSent++;
      }
    }
  }

  const sendBrouillonEcheanceReminders = async (
    groups: Map<string, { coproprieteNom: string; syndicEmail: string; syndicPrenom: string; ids: string[] }>,
    type: BrouillonEcheanceType,
    updateColumn: 'rappel_brouillon_j14_at' | 'rappel_brouillon_j7_at' | 'rappel_brouillon_j1_urgent_at',
  ) => {
    for (const [coproprieteId, group] of groups) {
      const n = group.ids.length;
      const subject = buildBrouillonEcheanceSubject(group.coproprieteNom, n, type);
      const result = await resend.emails.send({
        from: FROM,
        to: group.syndicEmail,
        subject,
        html: buildBrouillonEcheanceEmail({
          type,
          syndicPrenom: group.syndicPrenom,
          coproprieteNom: group.coproprieteNom,
          nombreBrouillons: n,
          appelsUrl: `${SITE_URL}/appels-de-fonds`,
        }),
      });
      await trackCronEmail({
        providerMessageId: result.data?.id,
        errorMessage: result.error?.message,
        templateKey: `appel_brouillon_echeance_${type}`,
        recipientEmail: group.syndicEmail,
        subject,
        coproprieteId,
        legalEventType: 'appel_brouillon_echeance',
        legalReference: group.ids.join(','),
        payload: { trigger: 'cron', reminderType: type, appelIds: group.ids },
      });
      if (!result.error) {
        await supabase
          .from('appels_de_fonds')
          .update({ [updateColumn]: new Date().toISOString() } as Record<string, unknown>)
          .in('id', group.ids);
        totalSent++;
      }
    }
  };

  if (!onboardingOnly) {
    await sendBrouillonEcheanceReminders(brouillonJ14Groups, 'j14', 'rappel_brouillon_j14_at');
    await sendBrouillonEcheanceReminders(brouillonJ7Groups, 'j7', 'rappel_brouillon_j7_at');
    await sendBrouillonEcheanceReminders(brouillonJ1UrgentGroups, 'j1_urgent', 'rappel_brouillon_j1_urgent_at');
  }

  // ── Relances onboarding syndic J+2 / J+7 ──────────────────────────────────
  // Cible : syndics confirmés qui n'ont aucune copropriété OU < 2 copropriétaires.
  // Idempotence : on loggue un event dédié pour ne jamais renvoyer la même relance.
  const onboardingTargetEmails = onboardingTestEmail ? [onboardingTestEmail] : undefined;
  let onboardingJ2Sent = 0;
  let onboardingJ7Sent = 0;

  if (onboardingKinds.includes('j2')) {
    onboardingJ2Sent = await sendSyndicOnboardingReminders(
      supabase,
      dateM2,
      'j2',
      {
        force: onboardingForce,
        targetEmails: onboardingTargetEmails,
      },
    );
    totalSent += onboardingJ2Sent;
  }

  if (onboardingKinds.includes('j7')) {
    onboardingJ7Sent = await sendSyndicOnboardingReminders(
      supabase,
      dateM7,
      'j7',
      {
        force: onboardingForce,
        targetEmails: onboardingTargetEmails,
      },
    );
    totalSent += onboardingJ7Sent;
  }

  // ── Rappel J-3 fin d'essai ──────────────────────────────────────────────────
  // On envoie un email au syndic quand plan='essai' et plan_period_end = today + 3 jours.
  // Le cron quotidien garantit qu'il ne sera envoyé qu'une seule fois (la période est fixe).
  const dateJ3 = addDays(today, 3);

  const { data: trialsEndingJ3 } = onboardingOnly
    ? { data: [] }
    : await supabase
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
    const subject = buildTrialEndingSubject(row.nom);

    const result = await resend.emails.send({
      from: FROM,
      to: profile.email,
      subject,
      html: buildTrialEndingEmail({
        prenom,
        coproprieteNom: row.nom,
        planLabel,
        periodEnd: row.plan_period_end,
        dashboardUrl: `${SITE_URL}/abonnement`,
      }),
    });
    await trackCronEmail({
      providerMessageId: result.data?.id,
      errorMessage: result.error?.message,
      templateKey: 'subscription_trial_ending_j3',
      recipientEmail: profile.email,
      subject,
      coproprieteId: row.id,
      legalEventType: 'subscription_trial_ending',
      legalReference: row.id,
      payload: { trigger: 'cron', reminderType: 'trial_j3', planId: row.plan_id },
    });
    if (!result.error) totalSent++;
    else console.error('[cron] Erreur email trial J-3:', result.error);
  }

  return NextResponse.json({
    ok: true,
    onboarding_only: onboardingOnly,
    onboarding_force: onboardingForce,
    onboarding_test_email: onboardingTestEmail,
    onboarding_kinds: onboardingKinds,
    date: today.toISOString().slice(0, 10),
    avis_appels:       avisAppels?.length    ?? 0,
    j7_appels:         j7Appels?.length      ?? 0,
    j15_appels:        j15Appels?.length     ?? 0,
    brouillon_groupes: brouillonGroups.size,
    brouillon_j14_groupes: brouillonJ14Groups.size,
    brouillon_j7_groupes: brouillonJ7Groups.size,
    brouillon_j1_urgent_groupes: brouillonJ1UrgentGroups.size,
    onboarding_j2: onboardingJ2Sent,
    onboarding_j7: onboardingJ7Sent,
    trial_j3:          trialsEndingJ3?.length ?? 0,
    sent: totalSent,
  });
}

// ---- Types locaux ----
interface AppelRow {
  id: string;
  copropriete_id: string;
  titre: string;
  date_echeance: string;
  coproprietes: { nom: string } | null;
}

type OnboardingSyndicProfile = {
  id: string;
  email: string;
  full_name: string | null;
};

type OnboardingCopro = {
  id: string;
  syndic_id: string;
};

function dateRangeUtc(dateIso: string): { start: string; end: string } {
  const start = `${dateIso}T00:00:00.000Z`;
  const d = new Date(`${dateIso}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  const end = d.toISOString();
  return { start, end };
}

async function getConfirmedEmailsForDate(
  supabase: ReturnType<typeof createServerClient>,
  dateIso: string,
): Promise<string[]> {
  const { start, end } = dateRangeUtc(dateIso);
  const { data } = await supabase
    .from('user_events')
    .select('user_email')
    .eq('event_type', 'account_confirmed')
    .gte('created_at', start)
    .lt('created_at', end);

  const rows = (data ?? []) as Array<{ user_email: string | null }>;
  return [...new Set(rows.map((row) => String(row.user_email ?? '').trim().toLowerCase()).filter((email): email is string => email.length > 0))];
}

async function getAlreadyRemindedEmails(
  supabase: ReturnType<typeof createServerClient>,
  eventType: string,
  emails: string[],
): Promise<Set<string>> {
  if (!emails.length) return new Set();
  const { data } = await supabase
    .from('user_events')
    .select('user_email')
    .eq('event_type', eventType)
    .in('user_email', emails);

  const rows = (data ?? []) as Array<{ user_email: string | null }>;
  return new Set(rows.map((row) => String(row.user_email ?? '').trim().toLowerCase()).filter((email): email is string => email.length > 0));
}

async function sendSyndicOnboardingReminders(
  supabase: ReturnType<typeof createServerClient>,
  targetDateIso: string,
  kind: SyndicOnboardingReminderKind,
  options?: {
    force?: boolean;
    targetEmails?: string[];
  },
): Promise<number> {
  const force = options?.force === true;
  const targetEmails = (options?.targetEmails ?? [])
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email.length > 0);
  const confirmedEmails = targetEmails.length > 0
    ? targetEmails
    : await getConfirmedEmailsForDate(supabase, targetDateIso);
  if (!confirmedEmails.length) return 0;

  const eventType = kind === 'j2'
    ? 'onboarding_copro_reminder_j2_sent'
    : 'onboarding_copro_reminder_j7_sent';

  const alreadyReminded = force
    ? new Set<string>()
    : await getAlreadyRemindedEmails(supabase, eventType, confirmedEmails);
  const candidateEmails = force
    ? confirmedEmails
    : confirmedEmails.filter((email) => !alreadyReminded.has(email));
  if (!candidateEmails.length) return 0;

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .eq('role', 'syndic')
    .in('email', candidateEmails);

  const syndicProfiles = (profiles ?? []) as OnboardingSyndicProfile[];
  if (!syndicProfiles.length) return 0;

  const syndicIds = syndicProfiles.map((p) => p.id);
  const { data: copros } = await supabase
    .from('coproprietes')
    .select('id, syndic_id')
    .in('syndic_id', syndicIds);

  const coproRows = (copros ?? []) as OnboardingCopro[];
  const coproIds = coproRows.map((c) => c.id);

  const coproBySyndicId = new Map<string, string[]>();
  for (const copro of coproRows) {
    if (!coproBySyndicId.has(copro.syndic_id)) coproBySyndicId.set(copro.syndic_id, []);
    coproBySyndicId.get(copro.syndic_id)!.push(copro.id);
  }

  let coproprietairesRows: Array<{ copropriete_id: string }> = [];
  if (coproIds.length) {
    const { data: cpData } = await supabase
      .from('coproprietaires')
      .select('copropriete_id')
      .in('copropriete_id', coproIds);
    coproprietairesRows = (cpData ?? []) as Array<{ copropriete_id: string }>;
  }

  const coproCountById = new Map<string, number>();
  for (const cp of coproprietairesRows) {
    coproCountById.set(cp.copropriete_id, (coproCountById.get(cp.copropriete_id) ?? 0) + 1);
  }

  let sent = 0;
  for (const profile of syndicProfiles) {
    const email = profile.email.trim().toLowerCase();
    const syndicCoproIds = coproBySyndicId.get(profile.id) ?? [];
    const coproCount = syndicCoproIds.length;
    const coproprietairesCount = syndicCoproIds.reduce((acc, coproId) => acc + (coproCountById.get(coproId) ?? 0), 0);

    if (!force && !(coproCount === 0 || coproprietairesCount < 2)) continue;

    const prenom = (profile.full_name ?? '').split(' ')[0] || 'Syndic';
    const actionUrl = coproCount === 0 ? `${SITE_URL}/coproprietes` : `${SITE_URL}/coproprietaires`;
    const subject = buildSyndicOnboardingReminderSubject({ kind, coproCount });
    const html = buildSyndicOnboardingReminderEmail({
      syndicPrenom: prenom,
      kind,
      coproCount,
      coproprietairesCount,
      actionUrl,
    });

    const result = await resend.emails.send({
      from: FROM,
      to: email,
      subject,
      html,
    });

    await trackCronEmail({
      providerMessageId: result.data?.id,
      errorMessage: result.error?.message,
      templateKey: `syndic_onboarding_${kind}`,
      recipientEmail: email,
      subject,
      payload: {
        trigger: 'cron',
        kind,
        coproCount,
        coproprietairesCount,
        force,
      },
    });

    if (result.error) {
      console.error(`[cron] Erreur relance onboarding ${kind}:`, result.error);
      continue;
    }

    await supabase.from('user_events').insert({
      user_email: email,
      event_type: force ? `${eventType}_test` : eventType,
      label: force
        ? `Relance onboarding copro test envoyee (${kind.toUpperCase()})`
        : `Relance onboarding copro envoyee (${kind.toUpperCase()})`,
    });

    sent++;
  }

  return sent;
}

function normalizeEmail(value: string | null): string | null {
  const email = String(value ?? '').trim().toLowerCase();
  return email.length > 0 ? email : null;
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

    const subject = buildAppelEmailSubject({ type, coproprieteNom, dateEcheance: appel.date_echeance });

    const result = await resend.emails.send({
      from: FROM,
      to: email,
      subject,
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

    if (result.error) {
      await trackEmailDelivery({
        templateKey: type === 'avis' ? 'appel_avis' : type === 'rappel' ? 'appel_rappel' : 'appel_mise_en_demeure',
        status: 'failed',
        recipientEmail: email,
        recipientUserId: cop.user_id,
        coproprieteId: appel.copropriete_id,
        appelDeFondsId: appel.id,
        subject,
        legalEventType: type === 'avis' ? 'appel_de_fonds_avis' : type === 'rappel' ? 'appel_de_fonds_rappel' : 'appel_de_fonds_mise_en_demeure',
        legalReference: appel.id,
        payload: { trigger: 'cron', type },
        lastError: result.error.message,
      });
      return;
    }

    await trackEmailDelivery({
      providerMessageId: result.data?.id,
      templateKey: type === 'avis' ? 'appel_avis' : type === 'rappel' ? 'appel_rappel' : 'appel_mise_en_demeure',
      status: 'sent',
      recipientEmail: email,
      recipientUserId: cop.user_id,
      coproprieteId: appel.copropriete_id,
      appelDeFondsId: appel.id,
      subject,
      legalEventType: type === 'avis' ? 'appel_de_fonds_avis' : type === 'rappel' ? 'appel_de_fonds_rappel' : 'appel_de_fonds_mise_en_demeure',
      legalReference: appel.id,
      payload: { trigger: 'cron', type },
    });
    sent++;
  }));

  return sent;
}
