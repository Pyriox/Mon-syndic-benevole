// ============================================================
// Route : GET /api/cron/rappels-appels
// Cron quotidien (08h00) — notifications automatiques appels de fonds
//
//  J-30 : avis initial aux copropriétaires (appels publiés sans email envoyé
//         dont l'échéance est dans <= 30 jours)
//  J-7  : rappel pré-échéance aux copropriétaires impayés
//  J+7  : première relance post-échéance aux copropriétaires impayés
//  J+30 : relance formelle post-échéance aux copropriétaires toujours impayés
//  J0   : récapitulatif des impayés au syndic pour vérification des paiements reçus
//
// Le J-30 permet de publier tous les appels d'un coup après une AG
// sans spammer les copropriétaires des échéances lointaines.
//
// Appelé par Vercel Cron (vercel.json) avec header Authorization
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Resend } from 'resend';
import { buildAppelEmail, buildAppelEmailSubject, type AppelEmailType } from '@/lib/emails/appel-de-fonds';
import {
  buildBrouillonRappelEmail,
  buildBrouillonRappelSubject,
  buildBrouillonEcheanceEmail,
  buildBrouillonEcheanceSubject,
  buildSyndicOnboardingJ2Email,
  buildSyndicOnboardingJ2Subject,
  buildSyndicOnboardingJ7Email,
  buildSyndicOnboardingJ7Subject,
  buildSyndicOnboardingJ14Email,
  buildSyndicOnboardingJ14Subject,
  buildSyndicImpayesRecapEmail,
  buildSyndicImpayesRecapSubject,
  buildSyndicReactivationEmail,
  buildSyndicReactivationSubject,
  buildSyndicOnboardingJ30Email,
  buildSyndicOnboardingJ30Subject,
  type SyndicOnboardingReminderKind,
  type BrouillonEcheanceType,
} from '@/lib/emails/syndic-notifications';
import { buildChurnReactivationEmail, buildChurnReactivationSubject, buildCheckoutAbandonEmail, buildCheckoutAbandonSubject, buildCheckoutAbandonJ3Email, buildCheckoutAbandonJ3Subject, buildCancelRenewalJ30Email, buildCancelRenewalJ30Subject, buildCancelRenewalJ7Email, buildCancelRenewalJ7Subject, buildCancelRenewalJ3Email, buildCancelRenewalJ3Subject, buildCancelRenewalJ1Email, buildCancelRenewalJ1Subject, buildCancelExpiredJ1Email, buildCancelExpiredJ1Subject, buildTrialSurveyJ1Email, buildTrialSurveyJ1Subject } from '@/lib/emails/subscription';
import { trackEmailDelivery } from '@/lib/email-delivery';
import { pushAdminAlert } from '@/lib/notification-center';
import { resolveOnboardingConfirmationWindow, resolveOnboardingKinds } from '@/lib/onboarding-reminders';
import { getCronAuthState } from '@/lib/cron-auth';
import { buildUnsubscribeUrl } from '@/lib/unsubscribe-token';

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
  const cronAuth = getCronAuthState(req);
  if (!cronAuth.ok) {
    return NextResponse.json({
      message: 'Unauthorized',
      ...cronAuth.debug,
    }, { status: 401 });
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

  const supabase = createAdminClient();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayStr = today.toISOString().slice(0, 10);
  const dateJ30 = addDays(today, 30);  // avis : appels publiés dont l'échéance est dans <= 30 jours
  const dateJ14 = addDays(today, 14);  // brouillons non publiés : rappel syndic J-14
  const dateJ7  = addDays(today, 7);   // appels avec échéance dans 7 jours
  const dateOverdueJ7  = addDays(today, -7);  // appels échus depuis 7 jours, encore impayés
  const dateOverdueJ30 = addDays(today, -30); // appels avec échéance il y a 30 jours
  const dateJ90 = addDays(today, -90); // borne inférieure anti-backlog pour J+30
  const onboardingJ2Window = resolveOnboardingConfirmationWindow({ kind: 'j2', referenceDate: today });
  const onboardingJ7Window = resolveOnboardingConfirmationWindow({ kind: 'j7', referenceDate: today });
  const onboardingJ14Window = resolveOnboardingConfirmationWindow({ kind: 'j14', referenceDate: today });
  const onboardingJ30Window = resolveOnboardingConfirmationWindow({ kind: 'j30', referenceDate: today });

  // ── Avis J-30 : appels publiés dont l'email n'a pas encore été envoyé ──
  // .gte('date_echeance', todayStr) empêche d'envoyer un "avis J-30" pour un
  // appel dont l'échéance est déjà dépassée (publie tardif ou cron manqué).
  const { data: avisAppels } = await supabase
    .from('appels_de_fonds')
    .select('id, copropriete_id, titre, montant_total, date_echeance, coproprietes(nom)')
    .eq('statut', 'publie')
    .is('emailed_at', null)
    .gte('date_echeance', todayStr)
    .lte('date_echeance', dateJ30)
    .limit(100);

  // Appels à rappeler (J-7)
  const { data: j7Appels } = await supabase
    .from('appels_de_fonds')
    .select('id, copropriete_id, titre, montant_total, date_echeance, emailed_at, coproprietes(nom)')
    .eq('statut', 'publie')
    .not('emailed_at', 'is', null)
    .gte('date_echeance', todayStr)
    .lte('date_echeance', dateJ7)
    .is('rappel_j7_at', null)
    .limit(100);

  // Appels à relancer 7 jours après l'échéance (J+7), avec rattrapage si un cron a été manqué.
  const { data: j1Appels } = await supabase
    .from('appels_de_fonds')
    .select('id, copropriete_id, titre, montant_total, date_echeance, emailed_at, coproprietes(nom)')
    .eq('statut', 'publie')
    .not('emailed_at', 'is', null)
    .lte('date_echeance', dateOverdueJ7)
    .gt('date_echeance', dateOverdueJ30)
    .is('rappel_j1_at', null)
    .limit(100);

  // Appels en relance formelle (J+30), avec rattrapage si le cron ne s'est pas exécuté le jour exact.
  const { data: j15Appels } = await supabase
    .from('appels_de_fonds')
    .select('id, copropriete_id, titre, montant_total, date_echeance, emailed_at, coproprietes(nom)')
    .eq('statut', 'publie')
    .not('emailed_at', 'is', null)
    .lte('date_echeance', dateOverdueJ30)
    .gte('date_echeance', dateJ90)
    .is('rappel_j15_at', null)
    .limit(100);

  // Appels publiés après leur échéance (publication tardive ou cron manqué au moment de la publication).
  // emailed_at IS NULL = l'avis initial n'a jamais été envoyé. On envoie directement la relance
  // appropriée selon l'ancienneté du retard et on marque emailed_at en même temps.
  const { data: latePublishAppels } = await supabase
    .from('appels_de_fonds')
    .select('id, copropriete_id, titre, montant_total, date_echeance, emailed_at, coproprietes(nom)')
    .eq('statut', 'publie')
    .is('emailed_at', null)
    .lt('date_echeance', todayStr)
    .gte('date_echeance', dateJ90)
    .is('rappel_j1_at', null)
    .limit(100);

  // Récapitulatif syndic à l'échéance (J0)
  const { data: j0SyndicAppels } = await supabase
    .from('appels_de_fonds')
    .select('id, copropriete_id, titre, date_echeance, coproprietes(nom, profiles!coproprietes_syndic_id_fkey(id, email, full_name, prenom))')
    .eq('statut', 'publie')
    .eq('date_echeance', todayStr)
    .is('rappel_syndic_j0_at', null)
    .limit(100);

  let totalSent = 0;
  let retries = 0;

  if (!onboardingOnly) {
    // Traitement avis J-30 (email initial différé)
    for (const appel of avisAppels ?? []) {
      const sent = await sendRappelEmails(supabase, appel as unknown as AppelRow, 'avis');
      if (sent > 0) {
        await supabase.from('appels_de_fonds')
          .update({ emailed_at: new Date().toISOString() })
          .eq('id', appel.id);
      }
      totalSent += sent;
    }

    // Traitement J-7
    for (const appel of j7Appels ?? []) {
      const sent = await sendRappelEmails(supabase, appel as unknown as AppelRow, 'rappel');
      if (sent > 0) {
        await supabase.from('appels_de_fonds')
          .update({ rappel_j7_at: new Date().toISOString() })
          .eq('id', appel.id);
      }
      totalSent += sent;
    }

    // Traitement J+1
    for (const appel of j1Appels ?? []) {
      const sent = await sendRappelEmails(supabase, appel as unknown as AppelRow, 'rappel_j1');
      if (sent > 0) {
        await supabase.from('appels_de_fonds')
          .update({ rappel_j1_at: new Date().toISOString() })
          .eq('id', appel.id);
      }
      totalSent += sent;
    }

    // Traitement J+15
    for (const appel of j15Appels ?? []) {
      const sent = await sendRappelEmails(supabase, appel as unknown as AppelRow, 'mise_en_demeure');
      if (sent > 0) {
        await supabase.from('appels_de_fonds')
          .update({ rappel_j15_at: new Date().toISOString() })
          .eq('id', appel.id);
      }
      totalSent += sent;
    }

    // Traitement appels publiés tardivement (emailed_at jamais défini, échéance déjà passée)
    // Si > 30 jours de retard → mise en demeure directe ; sinon → rappel J+7
    for (const appel of latePublishAppels ?? []) {
      const isVeryLate = appel.date_echeance <= dateOverdueJ30;
      const type: AppelEmailType = isVeryLate ? 'mise_en_demeure' : 'rappel_j1';
      const sent = await sendRappelEmails(supabase, appel as unknown as AppelRow, type);
      if (sent > 0) {
        const now = new Date().toISOString();
        const fields: Record<string, string> = { emailed_at: now, rappel_j1_at: now };
        if (isVeryLate) fields.rappel_j15_at = now;
        await supabase.from('appels_de_fonds').update(fields).eq('id', appel.id);
      }
      totalSent += sent;
    }

    // Récapitulatif syndic J0
    for (const appel of j0SyndicAppels ?? []) {
      const sent = await sendSyndicImpayesRecap(supabase, appel as unknown as AppelWithSyndicRow);
      if (sent > 0) {
        await supabase.from('appels_de_fonds')
          .update({ rappel_syndic_j0_at: new Date().toISOString() })
          .eq('id', appel.id);
      }
      totalSent += sent;
    }
  }

  const { data: retryRows } = onboardingOnly
    ? { data: [] }
    : await supabase
        .from('email_deliveries')
        .select('id, recipient_email, recipient_user_id, copropriete_id, appel_de_fonds_id, template_key, retry_count, next_retry_at')
        .in('status', ['failed', 'bounced'])
        .not('next_retry_at', 'is', null)
        .lte('next_retry_at', new Date().toISOString())
        .lt('retry_count', 3)
        .in('template_key', ['appel_avis', 'appel_rappel', 'appel_rappel_j1', 'appel_mise_en_demeure'])
        .limit(200);

  if ((retryRows?.length ?? 0) >= 200) {
    console.warn('[cron/rappels-appels] Limite de retries atteinte (200) — file partiellement traitée, certains retries reportés au prochain run');
  }

  // Batch-load appels et lignes pour les retries (évite N+1)
  const validRetryRows = (retryRows ?? []).filter((r) => r.appel_de_fonds_id && r.copropriete_id);
  const retryAppelIds = [...new Set(validRetryRows.map((r) => r.appel_de_fonds_id as string))];
  const { data: batchRetryAppels } = retryAppelIds.length > 0
    ? await supabase
        .from('appels_de_fonds')
        .select('id, copropriete_id, titre, date_echeance, coproprietes(nom)')
        .in('id', retryAppelIds)
    : { data: [] };
  const retryAppelMap = new Map<string, AppelRow>();
  for (const a of (batchRetryAppels ?? []) as unknown as AppelRow[]) retryAppelMap.set(a.id, a);

  const { data: batchRetryLignes } = retryAppelIds.length > 0
    ? await supabase
        .from('lignes_appels_de_fonds')
        .select('appel_de_fonds_id, montant_du, regularisation_ajustement, coproprietaires(nom, prenom, email, user_id)')
        .in('appel_de_fonds_id', retryAppelIds)
    : { data: [] };
  type LigneWithAppelId = LigneRow & { appel_de_fonds_id: string };
  const retryLignesMap = new Map<string, LigneWithAppelId[]>();
  for (const ligne of (batchRetryLignes ?? []) as unknown as LigneWithAppelId[]) {
    const list = retryLignesMap.get(ligne.appel_de_fonds_id) ?? [];
    list.push(ligne);
    retryLignesMap.set(ligne.appel_de_fonds_id, list);
  }

  for (const row of validRetryRows) {
    const type: AppelEmailType = row.template_key === 'appel_avis'
      ? 'avis'
      : row.template_key === 'appel_rappel_j1'
        ? 'rappel_j1'
        : row.template_key === 'appel_mise_en_demeure'
          ? 'mise_en_demeure'
          : 'rappel';

    const appel = retryAppelMap.get(row.appel_de_fonds_id as string);
    if (!appel) continue;

    const lignes = retryLignesMap.get(appel.id) ?? [];

    const recipient = (lignes as LigneRow[])
      .map((ligne) => {
        const cop = Array.isArray(ligne.coproprietaires) ? ligne.coproprietaires[0] : ligne.coproprietaires;
        return cop
          ? {
              cop,
              montant_du: ligne.montant_du,
              regularisation_ajustement: ligne.regularisation_ajustement ?? 0,
            }
          : null;
      })
      .filter((value): value is { cop: CopRow; montant_du: number; regularisation_ajustement: number } => Boolean(value))
      .find((value) => normalizeEmail(value.cop.email) === normalizeEmail(row.recipient_email));

    if (!recipient) continue;

    const subject = buildAppelEmailSubject({
      type,
      coproprieteNom: appel.coproprietes?.nom ?? '',
      dateEcheance: appel.date_echeance,
    });

    const result = await resend.emails.send({
      from: FROM,
      to: row.recipient_email,
      subject,
      html: buildAppelEmail({
        type,
        prenom: recipient.cop.prenom,
        nom: recipient.cop.nom,
        coproprieteNom: appel.coproprietes?.nom ?? '',
        titre: appel.titre,
        montantDu: recipient.montant_du,
        regularisationAjustement: recipient.regularisation_ajustement,
        dateEcheance: appel.date_echeance,
      }),
    });

    if (result.error) {
      const count = (row.retry_count ?? 0) + 1;
      const exhausted = count >= 3;
      await supabase
        .from('email_deliveries')
        .update({
          retry_count: count,
          retry_last_attempt_at: new Date().toISOString(),
          next_retry_at: exhausted ? null : new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
          last_error: result.error.message,
        })
        .eq('id', row.id);
      if (exhausted) {
        await pushAdminAlert({
          title: 'Retries email epuises',
          body: `${row.recipient_email} (${row.template_key})`,
          href: '/admin/emails',
          severity: 'danger',
          metadata: { deliveryId: row.id, templateKey: row.template_key },
        });
      }
      continue;
    }

    await supabase
      .from('email_deliveries')
      .update({
        provider_message_id: result.data?.id ?? null,
        status: 'sent',
        sent_at: new Date().toISOString(),
        retry_count: (row.retry_count ?? 0) + 1,
        retry_last_attempt_at: new Date().toISOString(),
        next_retry_at: null,
        failed_at: null,
        bounced_at: null,
        last_error: null,
      })
      .eq('id', row.id);

    retries++;
  }

  // ── Rappel brouillons non publiés (> 3 jours) ──────────────────────────────
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

  const { data: brouillons } = await supabase
    .from('appels_de_fonds')
    .select('id, copropriete_id, coproprietes(nom, profiles!coproprietes_syndic_id_fkey(email, full_name, prenom))')
    .eq('statut', 'brouillon')
    .lt('created_at', threeDaysAgo)
    .gt('date_echeance', dateJ14) // exclusif avec brouillonsJ14 (≤ J+14) et brouillonsJ7 (≤ J+7)
    .is('rappel_brouillon_at', null);

  const { data: brouillonsJ14 } = await supabase
    .from('appels_de_fonds')
    .select('id, copropriete_id, coproprietes(nom, profiles!coproprietes_syndic_id_fkey(email, full_name, prenom))')
    .eq('statut', 'brouillon')
    .gt('date_echeance', dateJ7)
    .lte('date_echeance', dateJ14)
    .is('rappel_brouillon_j14_at', null);

  const { data: brouillonsJ7 } = await supabase
    .from('appels_de_fonds')
    .select('id, copropriete_id, coproprietes(nom, profiles!coproprietes_syndic_id_fkey(email, full_name, prenom))')
    .eq('statut', 'brouillon')
    .gte('date_echeance', todayStr)
    .lte('date_echeance', dateJ7)
    .is('rappel_brouillon_j7_at', null);

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: brouillonsJ1Urgent } = await supabase
    .from('appels_de_fonds')
    .select('id, copropriete_id, coproprietes(nom, profiles!coproprietes_syndic_id_fkey(email, full_name, prenom))')
    .eq('statut', 'brouillon')
    .lt('created_at', oneDayAgo)
    .gte('date_echeance', todayStr)
    .lt('date_echeance', dateJ7)
    .is('rappel_brouillon_j7_at', null)
    .is('rappel_brouillon_j1_urgent_at', null);

  // Groupe par copropriété (un seul e-mail par copropriété, listant tous ses brouillons)
  type BrouillonRow = {
    id: string;
    copropriete_id: string;
    coproprietes: { nom: string; profiles: { email: string; full_name: string; prenom: string | null } | { email: string; full_name: string; prenom: string | null }[] | null } | null;
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
          syndicPrenom: getPrenom(profile),
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
  let onboardingJ14Sent = 0;
  let onboardingJ30Sent = 0;

  if (onboardingKinds.includes('j2')) {
    onboardingJ2Sent = await sendSyndicOnboardingReminders(
      supabase,
      onboardingJ2Window,
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
      onboardingJ7Window,
      'j7',
      {
        force: onboardingForce,
        targetEmails: onboardingTargetEmails,
      },
    );
    totalSent += onboardingJ7Sent;
  }

  if (onboardingKinds.includes('j14')) {
    onboardingJ14Sent = await sendSyndicOnboardingReminders(
      supabase,
      onboardingJ14Window,
      'j14',
      {
        force: onboardingForce,
        targetEmails: onboardingTargetEmails,
      },
    );
    totalSent += onboardingJ14Sent;
  }

  if (onboardingKinds.includes('j30')) {
    onboardingJ30Sent = await sendSyndicOnboardingReminders(
      supabase,
      onboardingJ30Window,
      'j30',
      {
        force: onboardingForce,
        targetEmails: onboardingTargetEmails,
      },
    );
    totalSent += onboardingJ30Sent;
  }

  // ── Relance checkout abandonné J+1 ──────────────────────────────────────────
  // Cible : utilisateurs qui ont démarré un checkout (begin_checkout) il y a 1-2 jours
  // sans finaliser (copropriété toujours sans abonnement actif ou essai).
  // Idempotence : event_type checkout_abandon_j1_reminder_sent.
  let checkoutAbandonSent = 0;
  if (!onboardingOnly) {
    const abandonWindowEnd = addDays(today, -1);
    const abandonWindowStart = addDays(today, -2); // +1j de rattrapage

    const { data: abandonCheckouts } = await supabase
      .from('user_events')
      .select('user_email, user_id, copropriete_id')
      .eq('event_type', 'begin_checkout')
      .gte('created_at', `${abandonWindowStart}T00:00:00.000Z`)
      .lt('created_at', `${abandonWindowEnd}T23:59:59.999Z`)
      .not('user_email', 'is', null)
      .not('copropriete_id', 'is', null);

    if (abandonCheckouts?.length) {
      // Dédupliquer par user_email + copropriete_id (garder une entrée par paire)
      const seenAbandon = new Map<string, { userEmail: string; userId: string | null; coproprieteId: string }>();
      for (const ev of (abandonCheckouts as Array<{ user_email: string; user_id: string | null; copropriete_id: string }>)) {
        const key = `${ev.user_email}:${ev.copropriete_id}`;
        seenAbandon.set(key, { userEmail: ev.user_email, userId: ev.user_id, coproprieteId: ev.copropriete_id });
      }
      const abandonCandidates = [...seenAbandon.values()];
      const abandonEmails = [...new Set(abandonCandidates.map((c) => c.userEmail))];

      // Exclure ceux qui ont déjà reçu la relance
      const { data: alreadyAbandonReminded } = await supabase
        .from('user_events')
        .select('user_email')
        .eq('event_type', 'checkout_abandon_j1_reminder_sent')
        .in('user_email', abandonEmails);
      const alreadyAbandonSet = new Set(
        (alreadyAbandonReminded ?? []).map((r: { user_email: string }) => r.user_email?.toLowerCase()).filter(Boolean),
      );

      // Charger les copropriétés en filtrant celles qui n'ont pas d'abonnement actif
      const coproIdsToCheck = [...new Set(abandonCandidates.map((c) => c.coproprieteId))];
      const { data: batchAbandonCopros } = await supabase
        .from('coproprietes')
        .select('id, nom, plan, profiles!coproprietes_syndic_id_fkey(id, email, full_name, prenom, unsubscribe_marketing)')
        .in('id', coproIdsToCheck)
        .not('plan', 'in', '("actif","essai")');
      type AbandonCopro = { id: string; nom: string; plan: string | null; profiles: { id: string; email: string; full_name: string | null; prenom: string | null; unsubscribe_marketing: boolean } | { id: string; email: string; full_name: string | null; prenom: string | null; unsubscribe_marketing: boolean }[] | null };
      const abandonCoproMap = new Map<string, AbandonCopro>();
      for (const c of (batchAbandonCopros ?? []) as unknown as AbandonCopro[]) abandonCoproMap.set(c.id, c);

      for (const candidate of abandonCandidates) {
        const email = candidate.userEmail.trim().toLowerCase();
        if (alreadyAbandonSet.has(email)) continue;

        const copro = abandonCoproMap.get(candidate.coproprieteId);
        if (!copro) continue; // copropriété a un abonnement actif ou essai — ne pas relancer

        const coproProfile = Array.isArray(copro.profiles) ? copro.profiles[0] : copro.profiles;
        if (!coproProfile?.email) continue;
        if (coproProfile.unsubscribe_marketing) continue;

        const prenom = coproProfile.prenom?.trim() || (coproProfile.full_name ?? '').split(' ')[0] || null;
        const subject = buildCheckoutAbandonSubject();
        const abandonUserId = candidate.userId ?? coproProfile.id;

        const result = await resend.emails.send({
          from: FROM,
          to: email,
          subject,
          html: buildCheckoutAbandonEmail({
            prenom,
            coproprieteNom: copro.nom,
            abonnementUrl: `${SITE_URL}/abonnement`,
            unsubscribeUrl: buildUnsubscribeUrl(abandonUserId, SITE_URL),
          }),
        });

        await trackCronEmail({
          providerMessageId: result.data?.id,
          errorMessage: result.error?.message,
          templateKey: 'subscription_checkout_abandon_j1',
          recipientEmail: email,
          subject,
          coproprieteId: copro.id,
          legalEventType: 'subscription_checkout_abandon',
          legalReference: copro.id,
          payload: { trigger: 'cron', reminderType: 'checkout_abandon_j1' },
        });

        if (!result.error) {
          await supabase.from('user_events').insert({
            user_email: email,
            user_id: candidate.userId,
            event_type: 'checkout_abandon_j1_reminder_sent',
            label: `Relance checkout abandonné envoyée (J+1) — ${copro.nom}`,
            copropriete_id: copro.id,
          });
          totalSent++;
          checkoutAbandonSent++;
        } else console.error('[cron] Erreur email checkout abandon J+1:', result.error);
      }
    }
  }

  // ── Relance checkout abandonné J+3 ─────────────────────────────────────────
  // Dernier rappel pour les utilisateurs qui n’ont toujours pas finalisé après 3 jours.
  // Idempotence : event_type checkout_abandon_j3_reminder_sent.
  let checkoutAbandonJ3Sent = 0;
  if (!onboardingOnly) {
    const abandonJ3WindowEnd = addDays(today, -3);
    const abandonJ3WindowStart = addDays(today, -4); // +1j de rattrapage

    const { data: abandonJ3Checkouts } = await supabase
      .from('user_events')
      .select('user_email, user_id, copropriete_id')
      .eq('event_type', 'begin_checkout')
      .gte('created_at', `${abandonJ3WindowStart}T00:00:00.000Z`)
      .lt('created_at', `${abandonJ3WindowEnd}T23:59:59.999Z`)
      .not('user_email', 'is', null)
      .not('copropriete_id', 'is', null);

    if (abandonJ3Checkouts?.length) {
      const seenAbandonJ3 = new Map<string, { userEmail: string; userId: string | null; coproprieteId: string }>();
      for (const ev of (abandonJ3Checkouts as Array<{ user_email: string; user_id: string | null; copropriete_id: string }>)) {
        const key = `${ev.user_email}:${ev.copropriete_id}`;
        seenAbandonJ3.set(key, { userEmail: ev.user_email, userId: ev.user_id, coproprieteId: ev.copropriete_id });
      }
      const abandonJ3Candidates = [...seenAbandonJ3.values()];
      const abandonJ3Emails = [...new Set(abandonJ3Candidates.map((c) => c.userEmail))];

      const { data: alreadyAbandonJ3Reminded } = await supabase
        .from('user_events')
        .select('user_email')
        .eq('event_type', 'checkout_abandon_j3_reminder_sent')
        .in('user_email', abandonJ3Emails);
      const alreadyAbandonJ3Set = new Set(
        (alreadyAbandonJ3Reminded ?? []).map((r: { user_email: string }) => r.user_email?.toLowerCase()).filter(Boolean),
      );

      const coproJ3IdsToCheck = [...new Set(abandonJ3Candidates.map((c) => c.coproprieteId))];
      const { data: batchAbandonJ3Copros } = await supabase
        .from('coproprietes')
        .select('id, nom, plan, profiles!coproprietes_syndic_id_fkey(id, email, full_name, prenom, unsubscribe_marketing)')
        .in('id', coproJ3IdsToCheck)
        .not('plan', 'in', '("actif","essai")');
      type AbandonJ3Copro = { id: string; nom: string; plan: string | null; profiles: { id: string; email: string; full_name: string | null; prenom: string | null; unsubscribe_marketing: boolean } | { id: string; email: string; full_name: string | null; prenom: string | null; unsubscribe_marketing: boolean }[] | null };
      const abandonJ3CoproMap = new Map<string, AbandonJ3Copro>();
      for (const c of (batchAbandonJ3Copros ?? []) as unknown as AbandonJ3Copro[]) abandonJ3CoproMap.set(c.id, c);

      for (const candidate of abandonJ3Candidates) {
        const email = candidate.userEmail.trim().toLowerCase();
        if (alreadyAbandonJ3Set.has(email)) continue;

        const copro = abandonJ3CoproMap.get(candidate.coproprieteId);
        if (!copro) continue;

        const coproProfile = Array.isArray(copro.profiles) ? copro.profiles[0] : copro.profiles;
        if (!coproProfile?.email) continue;
        if (coproProfile.unsubscribe_marketing) continue;

        const prenom = coproProfile.prenom?.trim() || (coproProfile.full_name ?? '').split(' ')[0] || null;
        const subject = buildCheckoutAbandonJ3Subject();
        const abandonJ3UserId = candidate.userId ?? coproProfile.id;

        const result = await resend.emails.send({
          from: FROM,
          to: email,
          subject,
          html: buildCheckoutAbandonJ3Email({
            prenom,
            coproprieteNom: copro.nom,
            abonnementUrl: `${SITE_URL}/abonnement`,
            unsubscribeUrl: buildUnsubscribeUrl(abandonJ3UserId, SITE_URL),
          }),
        });

        await trackCronEmail({
          providerMessageId: result.data?.id,
          errorMessage: result.error?.message,
          templateKey: 'subscription_checkout_abandon_j3',
          recipientEmail: email,
          subject,
          coproprieteId: copro.id,
          legalEventType: 'subscription_checkout_abandon',
          legalReference: copro.id,
          payload: { trigger: 'cron', reminderType: 'checkout_abandon_j3' },
        });

        if (!result.error) {
          await supabase.from('user_events').insert({
            user_email: email,
            user_id: candidate.userId,
            event_type: 'checkout_abandon_j3_reminder_sent',
            label: `Relance checkout abandonné envoyée (J+3) — ${copro.nom}`,
            copropriete_id: copro.id,
          });
          totalSent++;
          checkoutAbandonJ3Sent++;
        } else console.error('[cron] Erreur email checkout abandon J+3:', result.error);
      }
    }
  }

  // ── Relances pré-expiration abonnement annuel (cancel_at_period_end) ─────────
  // Cible : plan='actif', plan_cancel_at_period_end=true, plan_period_end dans N jours.
  // Séquence : J-30 → J-7 → J-3 → J-1 (pré-expiration) + J+1 (filet oubli post-expiration).
  // Idempotence : user_events par copropriete_id + event_type.
  // STOP automatique : si plan_cancel_at_period_end repasse à false, la copropriété
  // disparaît des requêtes et la séquence s'arrête naturellement.
  let cancelRenewalSent = 0;
  if (!onboardingOnly) {
    const sixMonthsAgoStr = addDays(today, -180);

    // J-30, J-7, J-3, J-1 — pré-expiration
    type CancelRenewalStep = {
      kind: 'j30' | 'j7' | 'j3' | 'j1';
      daysUntil: number;
      eventType: string;
    };
    const cancelSteps: CancelRenewalStep[] = [
      { kind: 'j30', daysUntil: 30, eventType: 'cancel_renewal_j30_sent' },
      { kind: 'j7',  daysUntil: 7,  eventType: 'cancel_renewal_j7_sent'  },
      { kind: 'j3',  daysUntil: 3,  eventType: 'cancel_renewal_j3_sent'  },
      { kind: 'j1',  daysUntil: 1,  eventType: 'cancel_renewal_j1_sent'  },
    ];

    for (const step of cancelSteps) {
      const windowEnd   = addDays(today, step.daysUntil);
      const windowStart = addDays(today, step.daysUntil - 1);

      const { data: cancelCopros } = await supabase
        .from('coproprietes')
        .select('id, nom, plan_id, plan_period_end, created_at, profiles!coproprietes_syndic_id_fkey(id, email, full_name, prenom, unsubscribe_marketing)')
        .eq('plan', 'actif')
        .eq('plan_cancel_at_period_end', true)
        .gte('plan_period_end', windowStart)
        .lte('plan_period_end', windowEnd);

      if (!cancelCopros?.length) continue;

      const cancelCoproIds = (cancelCopros as Array<{ id: string }>).map((c) => c.id);

      const { data: alreadySentRows } = await supabase
        .from('user_events')
        .select('copropriete_id')
        .eq('event_type', step.eventType)
        .in('copropriete_id', cancelCoproIds);
      const alreadySentSet = new Set(
        (alreadySentRows ?? []).map((r: { copropriete_id: string | null }) => r.copropriete_id).filter(Boolean),
      );

      type CancelCopro = { id: string; nom: string; plan_id: string | null; plan_period_end: string | null; created_at: string; profiles: { id: string; email: string; full_name: string | null; prenom: string | null; unsubscribe_marketing: boolean } | { id: string; email: string; full_name: string | null; prenom: string | null; unsubscribe_marketing: boolean }[] | null };
      for (const copro of cancelCopros as unknown as CancelCopro[]) {
        if (alreadySentSet.has(copro.id)) continue;

        const profile = Array.isArray(copro.profiles) ? copro.profiles[0] : copro.profiles;
        if (!profile?.email) continue;
        if (profile.unsubscribe_marketing) continue;

        const prenom = profile.prenom?.trim() || (profile.full_name ?? '').split(' ')[0] || null;
        const planLabel = copro.plan_id === 'illimite' ? 'Illimité' : copro.plan_id === 'confort' ? 'Confort' : 'Essentiel';
        const isLongTimeUser = copro.created_at < sixMonthsAgoStr;
        if (step.kind === 'j30' && !isLongTimeUser) continue;
        const cancelUnsubUrl = buildUnsubscribeUrl(profile.id, SITE_URL);
        const baseParams = {
          prenom,
          coproprieteNom: copro.nom,
          planLabel,
          periodEnd: copro.plan_period_end,
          dashboardUrl: `${SITE_URL}`,
          isLongTimeUser,
          unsubscribeUrl: cancelUnsubUrl,
        };

        let subject: string;
        let html: string;
        if (step.kind === 'j30') {
          subject = buildCancelRenewalJ30Subject(copro.nom);
          html = buildCancelRenewalJ30Email(baseParams);
        } else if (step.kind === 'j7') {
          subject = buildCancelRenewalJ7Subject(copro.nom);
          html = buildCancelRenewalJ7Email(baseParams);
        } else if (step.kind === 'j3') {
          subject = buildCancelRenewalJ3Subject(copro.nom);
          html = buildCancelRenewalJ3Email(baseParams);
        } else {
          subject = buildCancelRenewalJ1Subject(copro.nom);
          html = buildCancelRenewalJ1Email(baseParams);
        }

        const result = await resend.emails.send({ from: FROM, to: profile.email, subject, html });
        await trackCronEmail({
          providerMessageId: result.data?.id,
          errorMessage: result.error?.message,
          templateKey: `subscription_cancel_renewal_${step.kind}`,
          recipientEmail: profile.email,
          subject,
          coproprieteId: copro.id,
          legalEventType: 'subscription_cancel_renewal',
          legalReference: copro.id,
          payload: { trigger: 'cron', reminderType: `cancel_${step.kind}`, planId: copro.plan_id, isLongTimeUser },
        });
        if (!result.error) {
          await supabase.from('user_events').insert({
            user_email: profile.email,
            event_type: step.eventType,
            label: `Relance cancel_at_period_end ${step.kind.toUpperCase()} envoyée — ${copro.nom}`,
            copropriete_id: copro.id,
          });
          totalSent++;
          cancelRenewalSent++;
        } else console.error(`[cron] Erreur email cancel_renewal ${step.kind}:`, result.error);
      }
    }

    // J+1 post-expiration — filet "oubli", avant les churn J+7/J+14/J+30
    // Cible : plan='resilie', plan_period_end hier (±1j).
    const expiredJ1End   = addDays(today, -1);
    const expiredJ1Start = addDays(today, -2);

    const { data: expiredJ1Copros } = await supabase
      .from('coproprietes')
      .select('id, nom, plan_id, plan_period_end, profiles!coproprietes_syndic_id_fkey(id, email, full_name, prenom, unsubscribe_marketing)')
      .eq('plan', 'resilie')
      .gte('plan_period_end', expiredJ1Start)
      .lte('plan_period_end', expiredJ1End);

    if (expiredJ1Copros?.length) {
      const expiredCoproIds = (expiredJ1Copros as Array<{ id: string }>).map((c) => c.id);
      const { data: j1AlreadySent } = await supabase
        .from('user_events')
        .select('copropriete_id')
        .eq('event_type', 'cancel_expired_j1_sent')
        .in('copropriete_id', expiredCoproIds);
      const j1AlreadySet = new Set(
        (j1AlreadySent ?? []).map((r: { copropriete_id: string | null }) => r.copropriete_id).filter(Boolean),
      );

      // Skip si cancel_renewal_j1 reçu dans les 48h (résiliation délibérée, déjà relanceée)
      const { data: recentCancelJ1 } = await supabase
        .from('user_events')
        .select('copropriete_id')
        .eq('event_type', 'cancel_renewal_j1_sent')
        .in('copropriete_id', expiredCoproIds)
        .gte('created_at', new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString());
      const recentCancelJ1Set = new Set(
        (recentCancelJ1 ?? []).map((r: { copropriete_id: string | null }) => r.copropriete_id).filter(Boolean),
      );

      type ExpiredCopro = { id: string; nom: string; plan_id: string | null; plan_period_end: string | null; profiles: { id: string; email: string; full_name: string | null; prenom: string | null; unsubscribe_marketing: boolean } | { id: string; email: string; full_name: string | null; prenom: string | null; unsubscribe_marketing: boolean }[] | null };
      for (const copro of expiredJ1Copros as unknown as ExpiredCopro[]) {
        if (j1AlreadySet.has(copro.id)) continue;
        if (recentCancelJ1Set.has(copro.id)) continue;

        const profile = Array.isArray(copro.profiles) ? copro.profiles[0] : copro.profiles;
        if (!profile?.email) continue;
        if (profile.unsubscribe_marketing) continue;

        const prenom = profile.prenom?.trim() || (profile.full_name ?? '').split(' ')[0] || null;
        const planLabel = copro.plan_id === 'illimité' ? 'Illimité' : copro.plan_id === 'confort' ? 'Confort' : 'Essentiel';
        const subject = buildCancelExpiredJ1Subject(copro.nom);
        const html = buildCancelExpiredJ1Email({
          prenom,
          coproprieteNom: copro.nom,
          planLabel,
          periodEnd: copro.plan_period_end,
          dashboardUrl: `${SITE_URL}`,
          unsubscribeUrl: buildUnsubscribeUrl(profile.id, SITE_URL),
        });

        const result = await resend.emails.send({ from: FROM, to: profile.email, subject, html });
        await trackCronEmail({
          providerMessageId: result.data?.id,
          errorMessage: result.error?.message,
          templateKey: 'subscription_cancel_expired_j1',
          recipientEmail: profile.email,
          subject,
          coproprieteId: copro.id,
          legalEventType: 'subscription_cancel_renewal',
          legalReference: copro.id,
          payload: { trigger: 'cron', reminderType: 'cancel_expired_j1', planId: copro.plan_id },
        });
        if (!result.error) {
          await supabase.from('user_events').insert({
            user_email: profile.email,
            event_type: 'cancel_expired_j1_sent',
            label: `Relance expiration J+1 envoyée — ${copro.nom}`,
            copropriete_id: copro.id,
          });
          totalSent++;
          cancelRenewalSent++;
        } else console.error('[cron] Erreur email cancel_expired_j1:', result.error);
      }
    }
  }

  // ── Réactivation post-churn J+7 / J+30 ─────────────────────────────────────
  // Cible : syndics dont l'abonnement a été résilié il y a ~7j ou ~30j,
  // qui n'ont pas recréé un abonnement (plan toujours 'resilie').
  // Idempotence : event_type churn_reactivation_j7_sent / churn_reactivation_j30_sent.
  let churnReactivationSent = 0;
  if (!onboardingOnly) {
    for (const [reminderKind, daysAgo, eventType] of [
      ['j7',  7,  'churn_reactivation_j7_sent'] as const,
      ['j14', 14, 'churn_reactivation_j14_sent'] as const,
    ]) {
      const windowEnd = addDays(today, -daysAgo);
      const windowStart = addDays(today, -(daysAgo + 1));

      // Récupère les événements de résiliation dans la fenêtre ±1j
      const { data: churnEvents } = await supabase
        .from('user_events')
        .select('user_email, copropriete_id')
        .in('event_type', ['subscription_cancelled', 'trial_cancelled'])
        .gte('created_at', `${windowStart}T00:00:00.000Z`)
        .lt('created_at', `${windowEnd}T23:59:59.999Z`);

      if (!churnEvents?.length) continue;

      const churnEmails = [...new Set((churnEvents as Array<{ user_email: string | null; copropriete_id: string | null }>)
        .map((e) => e.user_email?.trim().toLowerCase())
        .filter((e): e is string => Boolean(e)))];

      // Filtre ceux qui ont déjà reçu cette relance
      const { data: alreadySentRows } = await supabase
        .from('user_events')
        .select('user_email')
        .eq('event_type', eventType)
        .in('user_email', churnEmails);
      const alreadySentSet = new Set(
        (alreadySentRows ?? []).map((r: { user_email: string | null }) => r.user_email?.trim().toLowerCase()).filter(Boolean),
      );

      const candidateEmails = churnEmails.filter((e) => !alreadySentSet.has(e));
      if (!candidateEmails.length) continue;

      // Batch-load toutes les copropriétés résiliées pour les candidats (évite N+1)
      const candidateCoproIds = (churnEvents as Array<{ user_email: string | null; copropriete_id: string | null }>)
        .filter((e) => candidateEmails.includes(e.user_email?.trim().toLowerCase() ?? ''))
        .map((e) => e.copropriete_id)
        .filter((id): id is string => Boolean(id));
      const { data: batchChurnCopros } = candidateCoproIds.length > 0
        ? await supabase
            .from('coproprietes')
            .select('id, nom, plan, plan_id, profiles!coproprietes_syndic_id_fkey(id, email, full_name, prenom, unsubscribe_marketing)')
            .in('id', candidateCoproIds)
            .eq('plan', 'resilie')
        : { data: [] };
      type BatchChurnCopro = { id: string; nom: string; plan: string | null; plan_id: string | null; profiles: { id: string; email: string; full_name: string | null; prenom: string | null; unsubscribe_marketing: boolean } | { id: string; email: string; full_name: string | null; prenom: string | null; unsubscribe_marketing: boolean }[] | null };
      const churnCoproMap = new Map<string, BatchChurnCopro>();
      for (const c of (batchChurnCopros ?? []) as unknown as BatchChurnCopro[]) churnCoproMap.set(c.id, c);

      // Récupère les profils + copropriété encore résiliée
      for (const churnEmail of candidateEmails) {
        const churnEvent = (churnEvents as Array<{ user_email: string | null; copropriete_id: string | null }>)
          .find((e) => e.user_email?.trim().toLowerCase() === churnEmail);
        if (!churnEvent?.copropriete_id) continue;

        const copro = churnCoproMap.get(churnEvent.copropriete_id);

        if (!copro) continue; // s'est réabonné entre temps

        const coproProfile = Array.isArray(copro.profiles) ? copro.profiles[0] : copro.profiles;
        if (!coproProfile?.email) continue;
        if (coproProfile.unsubscribe_marketing) continue;

        const prenom = coproProfile.prenom?.trim() || (coproProfile.full_name ?? '').split(' ')[0] || null;
        const planLabel = copro.plan_id === 'illimite' ? 'Illimité' : copro.plan_id === 'confort' ? 'Confort' : 'Essentiel';
        const subject = buildChurnReactivationSubject(copro.nom, reminderKind);
        const churnUnsubUrl = buildUnsubscribeUrl(coproProfile.id, SITE_URL);

        const result = await resend.emails.send({
          from: FROM,
          to: coproProfile.email,
          subject,
          html: buildChurnReactivationEmail({
            prenom,
            coproprieteNom: copro.nom,
            planLabel,
            dashboardUrl: `${SITE_URL}/abonnement`,
            kind: reminderKind,
            unsubscribeUrl: churnUnsubUrl,
          }),
        });
        await trackCronEmail({
          providerMessageId: result.data?.id,
          errorMessage: result.error?.message,
          templateKey: `subscription_churn_reactivation_${reminderKind}`,
          recipientEmail: coproProfile.email,
          subject,
          coproprieteId: copro.id,
          legalEventType: 'subscription_reactivation',
          legalReference: copro.id,
          payload: { trigger: 'cron', reminderType: `churn_${reminderKind}`, planId: copro.plan_id },
        });
        if (!result.error) {
          await supabase.from('user_events').insert({
            user_email: churnEmail,
            event_type: eventType,
            label: `Relance réactivation post-churn envoyée (${reminderKind.toUpperCase()})`,
            copropriete_id: copro.id,
          });
          totalSent++;
          churnReactivationSent++;
        } else console.error(`[cron] Erreur email churn réactivation ${reminderKind}:`, result.error);
      }
    }
  }

  // ── Sondage J+1 — essai non converti ────────────────────────────────────────
  // Cible : syndics dont l'essai a expiré sans souscription il y a ~1j
  // (event_type trial_cancelled créé hier, plan toujours 'resilie').
  // Idempotence : event_type trial_survey_j1_sent.
  let trialSurveyJ1Sent = 0;
  if (!onboardingOnly) {
    const surveyWindowEnd   = addDays(today, -1);
    const surveyWindowStart = addDays(today, -2); // +1j de rattrapage

    const { data: trialCancelledEvents } = await supabase
      .from('user_events')
      .select('user_email')
      .eq('event_type', 'trial_cancelled')
      .gte('created_at', `${surveyWindowStart}T00:00:00.000Z`)
      .lt('created_at',  `${surveyWindowEnd}T23:59:59.999Z`)
      .not('user_email', 'is', null);

    if (trialCancelledEvents?.length) {
      const surveyEmails = [...new Set(
        (trialCancelledEvents as Array<{ user_email: string }>)
          .map((e) => e.user_email.trim().toLowerCase())
          .filter(Boolean),
      )];

      // Idempotence : exclure ceux qui ont déjà reçu le sondage
      const { data: alreadySurveyed } = await supabase
        .from('user_events')
        .select('user_email')
        .eq('event_type', 'trial_survey_j1_sent')
        .in('user_email', surveyEmails);
      const alreadySurveyedSet = new Set(
        (alreadySurveyed ?? []).map((r: { user_email: string }) => r.user_email?.trim().toLowerCase()).filter(Boolean),
      );
      const surveyCandidates = surveyEmails.filter((e) => !alreadySurveyedSet.has(e));
      if (!surveyCandidates.length) {
        // tous déjà traités, continuer
      } else {
        // Charger les profils et copropriétés associées (plan='resilie')
        const { data: surveyProfiles } = await supabase
          .from('profiles')
          .select('id, email, full_name, prenom, unsubscribe_marketing')
          .in('email', surveyCandidates);

        if (surveyProfiles?.length) {
          type SurveyProfile = { id: string; email: string; full_name: string | null; prenom: string | null; unsubscribe_marketing: boolean };
          const profileMap = new Map<string, SurveyProfile>();
          for (const p of surveyProfiles as SurveyProfile[]) profileMap.set(p.id, p);
          const profileIds = [...profileMap.keys()];

          const { data: surveyCopros } = await supabase
            .from('coproprietes')
            .select('id, nom, plan_id, syndic_id')
            .in('syndic_id', profileIds)
            .eq('plan', 'resilie');

          type SurveyCopro = { id: string; nom: string; plan_id: string | null; syndic_id: string };
          // Un syndic peut avoir plusieurs copropriétés : on prend la première par syndic_id
          const syndicCoproMap = new Map<string, SurveyCopro>();
          for (const c of (surveyCopros ?? []) as SurveyCopro[]) {
            if (!syndicCoproMap.has(c.syndic_id)) syndicCoproMap.set(c.syndic_id, c);
          }

          for (const profile of surveyProfiles as SurveyProfile[]) {
            const email = profile.email.trim().toLowerCase();
            if (alreadySurveyedSet.has(email)) continue;
            if (profile.unsubscribe_marketing) continue;

            const copro = syndicCoproMap.get(profile.id);
            if (!copro) continue;

            const prenom = profile.prenom?.trim() || (profile.full_name ?? '').split(' ')[0] || null;
            const subject = buildTrialSurveyJ1Subject(copro.nom);
            const html = buildTrialSurveyJ1Email({
              prenom,
              coproprieteNom: copro.nom,
              abonnementUrl: `${SITE_URL}/abonnement`,
              unsubscribeUrl: buildUnsubscribeUrl(profile.id, SITE_URL),
            });

            const result = await resend.emails.send({ from: FROM, to: email, subject, html });
            await trackCronEmail({
              providerMessageId: result.data?.id,
              errorMessage: result.error?.message,
              templateKey: 'trial_survey_j1',
              recipientEmail: email,
              subject,
              coproprieteId: copro.id,
              legalEventType: 'trial_survey',
              legalReference: copro.id,
              payload: { trigger: 'cron', reminderType: 'trial_survey_j1', planId: copro.plan_id },
            });

            if (!result.error) {
              await supabase.from('user_events').insert({
                user_email: email,
                event_type: 'trial_survey_j1_sent',
                label: `Sondage essai non converti J+1 envoyé — ${copro.nom}`,
                copropriete_id: copro.id,
              });
              totalSent++;
              trialSurveyJ1Sent++;
            } else console.error('[cron] Erreur email trial_survey_j1:', result.error);
          }
        }
      }
    }
  }

  // ── Garde-fou volume (P4.a) ──────────────────────────────────────────────────
  const MAX_EMAILS_PER_RUN = 500;
  if (totalSent > MAX_EMAILS_PER_RUN) {
    console.warn(`[cron/rappels-appels] Volume inhabituel : ${totalSent} emails envoyés en un seul run (seuil : ${MAX_EMAILS_PER_RUN})`);
    await pushAdminAlert({
      title: 'Volume cron emails inhabituel',
      body: `${totalSent} emails envoyés en un seul run (seuil : ${MAX_EMAILS_PER_RUN})`,
      href: '/admin/emails',
      severity: 'warning',
      metadata: { totalSent, maxAllowed: MAX_EMAILS_PER_RUN, date: today.toISOString().slice(0, 10) },
    });
  }

  // ── Monitoring file retry (P4.b) ─────────────────────────────────────────────
  // Seuil d'alerte : >50 messages en failed/bounced avec des retries restants.
  const { count: failedRetryCount } = await supabase
    .from('email_deliveries')
    .select('id', { count: 'exact', head: true })
    .in('status', ['failed', 'bounced'])
    .lt('retry_count', 3)
    .not('next_retry_at', 'is', null);

  const RETRY_ALERT_THRESHOLD = 50;
  if ((failedRetryCount ?? 0) > RETRY_ALERT_THRESHOLD) {
    await pushAdminAlert({
      title: 'File email_deliveries retry élevée',
      body: `${failedRetryCount} emails en échec avec des retries restants (seuil : ${RETRY_ALERT_THRESHOLD})`,
      href: '/admin/emails',
      severity: 'danger',
      metadata: { failedRetryCount, threshold: RETRY_ALERT_THRESHOLD },
    });
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
    j1_appels:         j1Appels?.length      ?? 0,
    j15_appels:        j15Appels?.length     ?? 0,
    j0_syndic_appels:  j0SyndicAppels?.length ?? 0,
    brouillon_groupes: brouillonGroups.size,
    brouillon_j14_groupes: brouillonJ14Groups.size,
    brouillon_j7_groupes: brouillonJ7Groups.size,
    brouillon_j1_urgent_groupes: brouillonJ1UrgentGroups.size,
    onboarding_j2: onboardingJ2Sent,
    onboarding_j7: onboardingJ7Sent,
    onboarding_j14: onboardingJ14Sent,
    onboarding_j30: onboardingJ30Sent,
    checkout_abandon_j1: checkoutAbandonSent,
    checkout_abandon_j3: checkoutAbandonJ3Sent,
    cancel_renewal: cancelRenewalSent,
    churn_reactivation: churnReactivationSent,
    trial_survey_j1: trialSurveyJ1Sent,
    failed_retry_queue: failedRetryCount ?? 0,
    sent: totalSent,
    retries,
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

type SyndicProfileRow = { id: string; email: string | null; full_name: string | null; prenom: string | null };

interface AppelWithSyndicRow extends Omit<AppelRow, 'coproprietes'> {
  coproprietes: {
    nom: string;
    profiles: SyndicProfileRow | SyndicProfileRow[] | null;
  } | null;
}

type OnboardingSyndicProfile = {
  id: string;
  email: string;
  full_name: string | null;
  prenom: string | null;
};

/** Extrait le prénom depuis un profil : utilise profiles.prenom si disponible,
 *  sinon premier mot de full_name (fallback). */
function getPrenom(profile: { prenom?: string | null; full_name?: string | null } | null | undefined, fallback = 'Syndic'): string {
  if (!profile) return fallback;
  return profile.prenom?.trim() || (profile.full_name ?? '').split(' ')[0] || fallback;
}

type OnboardingCopro = {
  id: string;
  syndic_id: string;
};

function buildUtcRangeBounds(startDateIso: string | null, endDateIso: string): { start: string | null; end: string } {
  const endDate = new Date(`${endDateIso}T00:00:00.000Z`);
  endDate.setUTCDate(endDate.getUTCDate() + 1);

  return {
    start: startDateIso ? `${startDateIso}T00:00:00.000Z` : null,
    end: endDate.toISOString(),
  };
}

async function getConfirmedEmailsForDate(
  supabase: ReturnType<typeof createAdminClient>,
  window: {
    startDateIso: string | null;
    endDateIso: string;
  },
): Promise<string[]> {
  const { start, end } = buildUtcRangeBounds(window.startDateIso, window.endDateIso);
  let query = supabase
    .from('user_events')
    .select('user_email')
    .eq('event_type', 'account_confirmed')
    .lt('created_at', end);

  if (start) {
    query = query.gte('created_at', start);
  }

  const { data } = await query;

  const rows = (data ?? []) as Array<{ user_email: string | null }>;
  return [...new Set(rows.map((row) => String(row.user_email ?? '').trim().toLowerCase()).filter((email): email is string => email.length > 0))];
}

async function getAlreadyRemindedEmails(
  supabase: ReturnType<typeof createAdminClient>,
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
  supabase: ReturnType<typeof createAdminClient>,
  confirmationWindow: {
    startDateIso: string | null;
    endDateIso: string;
  },
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
    : await getConfirmedEmailsForDate(supabase, confirmationWindow);
  if (!confirmedEmails.length) return 0;

  const eventType = kind === 'j2'
    ? 'onboarding_copro_reminder_j2_sent'
    : kind === 'j7'
      ? 'onboarding_copro_reminder_j7_sent'
      : kind === 'j14'
        ? 'onboarding_copro_reminder_j14_sent'
        : kind === 'j30'
          ? 'onboarding_copro_reminder_j30_sent'
          : 'onboarding_copro_reminder_j21_sent';

  const alreadyReminded = force
    ? new Set<string>()
    : await getAlreadyRemindedEmails(supabase, eventType, confirmedEmails);
  const candidateEmails = force
    ? confirmedEmails
    : confirmedEmails.filter((email) => !alreadyReminded.has(email));
  if (!candidateEmails.length) return 0;

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email, full_name, prenom')
    .eq('role', 'syndic')
    .eq('email_bounced_hard', false)
    .eq('unsubscribe_marketing', false)
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

  // Syndics ayant au moins un appel de fonds publié (condition de sortie de séquence onboarding)
  const syndicIdsWithPublishedAppel = new Set<string>();
  if (coproIds.length) {
    const { data: publishedAppels } = await supabase
      .from('appels_de_fonds')
      .select('copropriete_id')
      .eq('statut', 'publie')
      .in('copropriete_id', coproIds);
    for (const a of (publishedAppels ?? []) as Array<{ copropriete_id: string }>) {
      const coproRow = coproRows.find((c) => c.id === a.copropriete_id);
      if (coproRow) syndicIdsWithPublishedAppel.add(coproRow.syndic_id);
    }
  }

  let sent = 0;
  for (const profile of syndicProfiles) {
    const email = profile.email.trim().toLowerCase();
    const syndicCoproIds = coproBySyndicId.get(profile.id) ?? [];
    const coproCount = syndicCoproIds.length;
    const coproprietairesCount = syndicCoproIds.reduce((acc, coproId) => acc + (coproCountById.get(coproId) ?? 0), 0);
    const hasPublishedAppel = syndicIdsWithPublishedAppel.has(profile.id);

    if (!force && coproCount > 0 && coproprietairesCount >= 2 && hasPublishedAppel) continue;

    const prenom = getPrenom(profile, 'Syndic');
    const actionUrl = coproCount === 0 ? `${SITE_URL}/coproprietes` : `${SITE_URL}/coproprietaires`;
    const subject = kind === 'j21'
      ? buildSyndicReactivationSubject()
      : kind === 'j30'
        ? buildSyndicOnboardingJ30Subject()
        : kind === 'j14'
          ? buildSyndicOnboardingJ14Subject()
          : kind === 'j7'
            ? buildSyndicOnboardingJ7Subject({ coproCount })
            : buildSyndicOnboardingJ2Subject({ coproCount });

    const unsubUrl = buildUnsubscribeUrl(profile.id, SITE_URL);
    const html = kind === 'j21'
      ? buildSyndicReactivationEmail({
          syndicPrenom: prenom,
          coproCount,
          coproprietairesCount,
          dashboardUrl: coproCount === 0 ? `${SITE_URL}/coproprietes` : `${SITE_URL}/dashboard`,
          unsubscribeUrl: unsubUrl,
        })
      : kind === 'j30'
        ? buildSyndicOnboardingJ30Email({ syndicPrenom: prenom, dashboardUrl: `${SITE_URL}/dashboard`, unsubscribeUrl: unsubUrl })
        : kind === 'j14'
          ? buildSyndicOnboardingJ14Email({ syndicPrenom: prenom, actionUrl: coproCount === 0 ? `${SITE_URL}/coproprietes` : `${SITE_URL}/dashboard`, unsubscribeUrl: unsubUrl })
          : kind === 'j7'
            ? buildSyndicOnboardingJ7Email({ syndicPrenom: prenom, coproCount, actionUrl, unsubscribeUrl: unsubUrl })
            : buildSyndicOnboardingJ2Email({ syndicPrenom: prenom, coproCount, actionUrl, unsubscribeUrl: unsubUrl });

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

function getAppelTemplateKey(type: AppelEmailType): string {
  if (type === 'avis') return 'appel_avis';
  if (type === 'rappel') return 'appel_rappel';
  if (type === 'rappel_j1') return 'appel_rappel_j1';
  return 'appel_mise_en_demeure';
}

function getAppelLegalEventType(type: AppelEmailType): string {
  if (type === 'avis') return 'appel_de_fonds_avis';
  if (type === 'mise_en_demeure') return 'appel_de_fonds_rappel_impaye';
  return 'appel_de_fonds_rappel';
}

// ---- Envoi des notifications pour un appel donné ----
async function sendRappelEmails(
  supabase: ReturnType<typeof createAdminClient>,
  appel: AppelRow,
  type: AppelEmailType
): Promise<number> {
  // Pour l'avis initial (J-30), on cible toutes les lignes.
  // Pour les rappels J-7 / J+3 et le rappel d'impayé J+15, uniquement les impayées.
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

  // Filtre hard bounce : exclure les destinataires marqués en bounce permanent dans profiles
  const allCandidateEmails = rows
    .map(({ cop }) => cop.email || (cop.user_id ? emailByUserId.get(cop.user_id) ?? '' : ''))
    .filter((e): e is string => e.length > 0)
    .map((e) => e.trim().toLowerCase());
  const bouncedEmails = new Set<string>();
  if (allCandidateEmails.length > 0) {
    const { data: bouncedProfiles } = await supabase
      .from('profiles')
      .select('email')
      .eq('email_bounced_hard', true)
      .in('email', allCandidateEmails);
    for (const p of (bouncedProfiles ?? []) as Array<{ email: string }>) {
      if (p.email) bouncedEmails.add(p.email.trim().toLowerCase());
    }
  }

  // Envoi des emails par lots de 10 pour respecter le rate-limit Resend
  // et éviter des pics simultanés sur des copropriétés avec beaucoup de lots.
  const CHUNK_SIZE = 10;
  let sent = 0;
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE);
    await Promise.all(chunk.map(async ({ cop, montant_du, regularisation_ajustement }) => {
    const email = cop.email || (cop.user_id ? emailByUserId.get(cop.user_id) ?? '' : '');
    if (!email) return;
    if (bouncedEmails.has(email.trim().toLowerCase())) return;

    // P2.c : copropriétaire avec compte → lien direct vers le dashboard.
    // P2.a : montant passé au builder du sujet pour l'avis initial.
    const espaceUrl = cop.user_id ? `${SITE_URL}/dashboard` : `${SITE_URL}/login`;
    const subject = buildAppelEmailSubject({
      type,
      coproprieteNom,
      dateEcheance: appel.date_echeance,
      montantDu: type === 'avis' ? montant_du : undefined,
    });

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
        espaceUrl,
      }),
    });

    if (result.error) {
      await trackEmailDelivery({
        templateKey: getAppelTemplateKey(type),
        status: 'failed',
        recipientEmail: email,
        recipientUserId: cop.user_id,
        coproprieteId: appel.copropriete_id,
        appelDeFondsId: appel.id,
        subject,
        legalEventType: getAppelLegalEventType(type),
        legalReference: appel.id,
        payload: { trigger: 'cron', type },
        lastError: result.error.message,
      });
      return;
    }

    await trackEmailDelivery({
      providerMessageId: result.data?.id,
      templateKey: getAppelTemplateKey(type),
      status: 'sent',
      recipientEmail: email,
      recipientUserId: cop.user_id,
      coproprieteId: appel.copropriete_id,
      appelDeFondsId: appel.id,
      subject,
      legalEventType: getAppelLegalEventType(type),
      legalReference: appel.id,
      payload: { trigger: 'cron', type },
    });
    sent++;
  }));
  }

  return sent;
}

async function sendSyndicImpayesRecap(
  supabase: ReturnType<typeof createAdminClient>,
  appel: AppelWithSyndicRow,
): Promise<number> {
  const copro = appel.coproprietes;
  const profile = Array.isArray(copro?.profiles) ? copro.profiles[0] : copro?.profiles;
  let syndicEmail = normalizeEmail(profile?.email ?? null);

  // Fallback : si l'email n'est pas dans profiles, on le résout via auth.users
  if (!syndicEmail && profile?.id) {
    const { data: authUser } = await supabase.auth.admin.getUserById(profile.id);
    syndicEmail = normalizeEmail(authUser?.user?.email ?? null);
  }

  if (!copro || !syndicEmail) return 0;

  const { data: lignes } = await supabase
    .from('lignes_appels_de_fonds')
    .select('montant_du, regularisation_ajustement, coproprietaires(nom, prenom, email, user_id)')
    .eq('appel_de_fonds_id', appel.id)
    .eq('paye', false);

  const impayes = ((lignes ?? []) as LigneRow[])
    .map((ligne) => {
      const coproprietaire = Array.isArray(ligne.coproprietaires) ? ligne.coproprietaires[0] : ligne.coproprietaires;
      if (!coproprietaire) return null;

      return {
        nom: `${coproprietaire.prenom} ${coproprietaire.nom}`.trim(),
        montantDu: ligne.montant_du,
      };
    })
    .filter((row): row is { nom: string; montantDu: number } => Boolean(row));

  if (impayes.length === 0) return 0;

  const syndicPrenom = getPrenom(profile, 'Syndic');
  const subject = buildSyndicImpayesRecapSubject(copro.nom, appel.titre, impayes.length);
  const result = await resend.emails.send({
    from: FROM,
    to: syndicEmail,
    subject,
    html: buildSyndicImpayesRecapEmail({
      syndicPrenom,
      coproprieteNom: copro.nom,
      appelTitre: appel.titre,
      dateEcheance: appel.date_echeance,
      appelsUrl: `${SITE_URL}/appels-de-fonds`,
      impayes,
    }),
  });

  await trackCronEmail({
    providerMessageId: result.data?.id,
    errorMessage: result.error?.message,
    templateKey: 'appel_syndic_impayes_j0',
    recipientEmail: syndicEmail,
    subject,
    coproprieteId: appel.copropriete_id,
    legalEventType: 'appel_de_fonds_syndic_impayes_j0',
    legalReference: appel.id,
    payload: {
      trigger: 'cron',
      type: 'syndic_impayes_j0',
      appelId: appel.id,
      unpaidCount: impayes.length,
      totalMontantDu: impayes.reduce((sum, row) => sum + row.montantDu, 0),
    },
  });

  return result.error ? 0 : 1;
}
