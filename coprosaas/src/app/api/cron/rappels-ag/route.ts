import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Resend } from 'resend';
import { buildAGReminderEmail, buildAGReminderSubject } from '@/lib/emails/ag-reminders';
import {
  buildMilestoneAGPlanifieeSubject, buildMilestoneAGPlanifieeEmail,
  buildAGConvocationManquanteSubject, buildAGConvocationManquanteEmail,
} from '@/lib/emails/syndic-notifications';
import { pushNotification, pushAdminAlert } from '@/lib/notification-center';
import { trackEmailDelivery } from '@/lib/email-delivery';
import { getCronAuthState } from '@/lib/cron-auth';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = `Mon Syndic Bénévole <${process.env.EMAIL_FROM ?? 'noreply@mon-syndic-benevole.fr'}>`;

function addDays(base: Date, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  const cronAuth = getCronAuthState(req);
  if (!cronAuth.ok) {
    return NextResponse.json({
      message: 'Unauthorized',
      ...cronAuth.debug,
    }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const today = now.toISOString().slice(0, 10);
  const j14 = addDays(now, 14);
  const j7 = addDays(now, 7);
  const j2 = addDays(now, 2);

  let sent = 0;
  let retries = 0;

  const { data: agsJ14 } = await admin
    .from('assemblees_generales')
    .select('id, copropriete_id, titre, date_ag, lieu, convocation_envoyee_le, convocation_rappel_j14_at, coproprietes(nom, syndic_id)')
    .eq('statut', 'planifiee')
    .gt('date_ag', j7)
    .lte('date_ag', j14)
    .not('convocation_envoyee_le', 'is', null)
    .is('convocation_rappel_j14_at', null);

  const { data: agsJ7 } = await admin
    .from('assemblees_generales')
    .select('id, copropriete_id, titre, date_ag, lieu, convocation_envoyee_le, convocation_rappel_j7_at, coproprietes(nom, syndic_id)')
    .eq('statut', 'planifiee')
    .gte('date_ag', today)
    .lte('date_ag', j7)
    .not('convocation_envoyee_le', 'is', null)
    .is('convocation_rappel_j7_at', null);

  const allAgRows = [...(agsJ14 ?? []), ...(agsJ7 ?? [])];
  const allCoproIds = [...new Set(allAgRows.map((r) => r.copropriete_id))];

  // Chargement en batch de tous les copropriétaires concernés (évite N+1 requêtes)
  const recipientsByCopro = new Map<string, Array<{ id: string; nom: string; prenom: string; email: string; user_id: string | null }>>();
  if (allCoproIds.length > 0) {
    const { data: allRecipients } = await admin
      .from('coproprietaires')
      .select('id, nom, prenom, email, user_id, copropriete_id')
      .in('copropriete_id', allCoproIds)
      .not('email', 'is', null);
    for (const cp of allRecipients ?? []) {
      const list = recipientsByCopro.get(cp.copropriete_id) ?? [];
      list.push({ id: cp.id, nom: cp.nom, prenom: cp.prenom, email: cp.email as string, user_id: cp.user_id });
      recipientsByCopro.set(cp.copropriete_id, list);
    }
  }

  for (const row of agsJ14 ?? []) {
    const copro = Array.isArray(row.coproprietes) ? row.coproprietes[0] : row.coproprietes;
    const recipients = recipientsByCopro.get(row.copropriete_id) ?? [];

    let sentForAg = 0;
    for (const cp of recipients) {
      const subject = buildAGReminderSubject({
        coproprieteNom: copro?.nom ?? '',
        dateAg: row.date_ag,
        kind: 'j14',
      });

      const html = buildAGReminderEmail({
        prenom: cp.prenom,
        nom: cp.nom,
        coproprieteNom: copro?.nom ?? '',
        agTitre: row.titre,
        dateAg: row.date_ag,
        lieu: row.lieu,
        kind: 'j14',
      });

      const result = await resend.emails.send({ from: FROM, to: cp.email, subject, html });
      if (result.error) {
        await trackEmailDelivery({
          templateKey: 'ag_convocation_reminder_j14',
          status: 'failed',
          recipientEmail: cp.email,
          recipientUserId: cp.user_id,
          coproprieteId: row.copropriete_id,
          agId: row.id,
          subject,
          legalEventType: 'ag_convocation_reminder',
          legalReference: row.id,
          payload: { kind: 'j14' },
          lastError: result.error.message,
        });
        continue;
      }

      await trackEmailDelivery({
        providerMessageId: result.data?.id,
        templateKey: 'ag_convocation_reminder_j14',
        status: 'sent',
        recipientEmail: cp.email,
        recipientUserId: cp.user_id,
        coproprieteId: row.copropriete_id,
        agId: row.id,
        subject,
        legalEventType: 'ag_convocation_reminder',
        legalReference: row.id,
        payload: { kind: 'j14' },
      });

      sentForAg++;
      sent++;
    }

    if (sentForAg > 0) {
      await admin.from('assemblees_generales').update({ convocation_rappel_j14_at: new Date().toISOString() }).eq('id', row.id);
      if (copro?.syndic_id) {
        await pushNotification({
          userId: copro.syndic_id,
          coproprieteId: row.copropriete_id,
          type: 'ag',
          severity: 'info',
          title: `[J-14] Rappel convocation envoye`,
          body: `${sentForAg} coproprietaire(s) notif(ie)s`,
          href: '/assemblees',
          actionLabel: 'Ouvrir',
          metadata: { agId: row.id },
        });
      }
    }
  }

  for (const row of agsJ7 ?? []) {
    const copro = Array.isArray(row.coproprietes) ? row.coproprietes[0] : row.coproprietes;
    const recipients = recipientsByCopro.get(row.copropriete_id) ?? [];

    let sentForAg = 0;
    for (const cp of recipients) {
      const subject = buildAGReminderSubject({
        coproprieteNom: copro?.nom ?? '',
        dateAg: row.date_ag,
        kind: 'j7',
      });

      const html = buildAGReminderEmail({
        prenom: cp.prenom,
        nom: cp.nom,
        coproprieteNom: copro?.nom ?? '',
        agTitre: row.titre,
        dateAg: row.date_ag,
        lieu: row.lieu,
        kind: 'j7',
      });

      const result = await resend.emails.send({ from: FROM, to: cp.email, subject, html });
      if (result.error) {
        await trackEmailDelivery({
          templateKey: 'ag_convocation_reminder_j7',
          status: 'failed',
          recipientEmail: cp.email,
          recipientUserId: cp.user_id,
          coproprieteId: row.copropriete_id,
          agId: row.id,
          subject,
          legalEventType: 'ag_convocation_reminder',
          legalReference: row.id,
          payload: { kind: 'j7' },
          lastError: result.error.message,
        });
        continue;
      }

      await trackEmailDelivery({
        providerMessageId: result.data?.id,
        templateKey: 'ag_convocation_reminder_j7',
        status: 'sent',
        recipientEmail: cp.email,
        recipientUserId: cp.user_id,
        coproprieteId: row.copropriete_id,
        agId: row.id,
        subject,
        legalEventType: 'ag_convocation_reminder',
        legalReference: row.id,
        payload: { kind: 'j7' },
      });

      sentForAg++;
      sent++;
    }

    if (sentForAg > 0) {
      await admin.from('assemblees_generales').update({ convocation_rappel_j7_at: new Date().toISOString() }).eq('id', row.id);
      if (copro?.syndic_id) {
        await pushNotification({
          userId: copro.syndic_id,
          coproprieteId: row.copropriete_id,
          type: 'ag',
          severity: 'warning',
          title: `[J-7] Rappel convocation envoye`,
          body: `${sentForAg} coproprietaire(s) notif(ie)s`,
          href: '/assemblees',
          actionLabel: 'Ouvrir',
          metadata: { agId: row.id },
        });
      }
    }
  }

  const { data: unopened } = await admin
    .from('email_deliveries')
    .select('id, recipient_email, recipient_user_id, copropriete_id, ag_id, template_key, sent_at')
    .in('template_key', ['ag_convocation', 'ag_convocation_reminder_j14', 'ag_convocation_reminder_j7'])
    .is('opened_at', null)
    .is('reminder_unopened_at', null)
    .in('status', ['sent', 'delivered'])
    .lt('sent_at', new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString())
    .limit(300);

  if ((unopened?.length ?? 0) >= 300) {
    console.warn('[cron/rappels-ag] Limite de relances non-ouvertes atteinte (300) — file partiellement traitée, certains destinataires reportés au prochain run');
  }

  // Batch-load AGs et coproprietaires pour éviter N+1 (jusqu'à 300 rows)
  const validUnopenedRows = (unopened ?? []).filter((d) => d.ag_id && d.copropriete_id);
  const uniqueUnopenedAgIds = [...new Set(validUnopenedRows.map((d) => d.ag_id as string))];
  const { data: batchUnopenedAGs } = uniqueUnopenedAgIds.length > 0
    ? await admin
        .from('assemblees_generales')
        .select('id, titre, date_ag, lieu, coproprietes(nom, syndic_id)')
        .in('id', uniqueUnopenedAgIds)
        .gt('date_ag', j2)
    : { data: [] };
  type BatchUnopenedAG = { id: string; titre: string; date_ag: string; lieu: string | null; coproprietes: { nom: string; syndic_id: string | null } | { nom: string; syndic_id: string | null }[] | null };
  const unopenedAgMap = new Map<string, BatchUnopenedAG>();
  for (const ag of (batchUnopenedAGs ?? []) as unknown as BatchUnopenedAG[]) unopenedAgMap.set(ag.id, ag);

  const uniqueUnopenedCoproIds = [...new Set(
    validUnopenedRows
      .filter((d) => unopenedAgMap.has(d.ag_id as string))
      .map((d) => d.copropriete_id as string),
  )];
  const { data: batchUnopenedCps } = uniqueUnopenedCoproIds.length > 0
    ? await admin
        .from('coproprietaires')
        .select('nom, prenom, email, copropriete_id')
        .in('copropriete_id', uniqueUnopenedCoproIds)
    : { data: [] };
  const unopenedCpMap = new Map<string, { nom: string; prenom: string }>();
  for (const cp of batchUnopenedCps ?? []) {
    if (cp.email) unopenedCpMap.set(`${cp.copropriete_id}:${String(cp.email).trim().toLowerCase()}`, { nom: cp.nom, prenom: cp.prenom });
  }

  for (const d of validUnopenedRows) {
    const ag = unopenedAgMap.get(d.ag_id as string);
    if (!ag) continue;

    const cp = unopenedCpMap.get(`${d.copropriete_id}:${d.recipient_email.trim().toLowerCase()}`);
    const copro = Array.isArray(ag.coproprietes) ? ag.coproprietes[0] : ag.coproprietes;

    const subject = buildAGReminderSubject({
      coproprieteNom: copro?.nom ?? '',
      dateAg: ag.date_ag,
      kind: 'unopened',
    });

    const html = buildAGReminderEmail({
      prenom: cp?.prenom ?? 'Coproprietaire',
      nom: cp?.nom ?? '',
      coproprieteNom: copro?.nom ?? '',
      agTitre: ag.titre,
      dateAg: ag.date_ag,
      lieu: ag.lieu,
      kind: 'unopened',
    });

    const result = await resend.emails.send({ from: FROM, to: d.recipient_email, subject, html });

    if (result.error) {
      await trackEmailDelivery({
        templateKey: 'ag_convocation_unopened_relance',
        status: 'failed',
        recipientEmail: d.recipient_email,
        recipientUserId: d.recipient_user_id,
        coproprieteId: d.copropriete_id,
        agId: d.ag_id,
        subject,
        legalEventType: 'ag_convocation_unopened_relance',
        legalReference: d.ag_id,
        payload: { sourceDeliveryId: d.id },
        lastError: result.error.message,
      });
      continue;
    }

    await admin.from('email_deliveries').update({ reminder_unopened_at: new Date().toISOString() }).eq('id', d.id);

    await trackEmailDelivery({
      providerMessageId: result.data?.id,
      templateKey: 'ag_convocation_unopened_relance',
      status: 'sent',
      recipientEmail: d.recipient_email,
      recipientUserId: d.recipient_user_id,
      coproprieteId: d.copropriete_id,
      agId: d.ag_id,
      subject,
      legalEventType: 'ag_convocation_unopened_relance',
      legalReference: d.ag_id,
      payload: { sourceDeliveryId: d.id },
    });

    sent++;
  }

  const { data: retryRows } = await admin
    .from('email_deliveries')
    .select('id, recipient_email, recipient_user_id, copropriete_id, ag_id, template_key, retry_count, next_retry_at')
    .in('status', ['failed', 'bounced'])
    .not('next_retry_at', 'is', null)
    .lte('next_retry_at', new Date().toISOString())
    .lt('retry_count', 3)
    .in('template_key', ['ag_convocation', 'ag_convocation_reminder_j14', 'ag_convocation_reminder_j7', 'ag_convocation_unopened_relance'])
    .limit(200);

  if ((retryRows?.length ?? 0) >= 200) {
    console.warn('[cron/rappels-ag] Limite de retries atteinte (200) — file partiellement traitée, certains retries reportés au prochain run');
  }

  // Batch-load AGs et coproprietaires pour les retries (évite N+1)
  const validRetryRows = (retryRows ?? []).filter((r) => r.ag_id && r.copropriete_id);
  const uniqueRetryAgIds = [...new Set(validRetryRows.map((r) => r.ag_id as string))];
  const { data: batchRetryAGs } = uniqueRetryAgIds.length > 0
    ? await admin
        .from('assemblees_generales')
        .select('id, titre, date_ag, lieu, coproprietes(nom)')
        .in('id', uniqueRetryAgIds)
    : { data: [] };
  type BatchRetryAG = { id: string; titre: string; date_ag: string; lieu: string | null; coproprietes: { nom: string } | { nom: string }[] | null };
  const retryAgMap = new Map<string, BatchRetryAG>();
  for (const ag of (batchRetryAGs ?? []) as unknown as BatchRetryAG[]) retryAgMap.set(ag.id, ag);

  const uniqueRetryCoproIds = [...new Set(validRetryRows.map((r) => r.copropriete_id as string))];
  const { data: batchRetryCps } = uniqueRetryCoproIds.length > 0
    ? await admin
        .from('coproprietaires')
        .select('nom, prenom, email, copropriete_id')
        .in('copropriete_id', uniqueRetryCoproIds)
    : { data: [] };
  const retryCpMap = new Map<string, { nom: string; prenom: string }>();
  for (const cp of batchRetryCps ?? []) {
    if (cp.email) retryCpMap.set(`${cp.copropriete_id}:${String(cp.email).trim().toLowerCase()}`, { nom: cp.nom, prenom: cp.prenom });
  }

  for (const row of validRetryRows) {
    const ag = retryAgMap.get(row.ag_id as string);
    if (!ag) continue;

    const copro = Array.isArray(ag.coproprietes) ? ag.coproprietes[0] : ag.coproprietes;
    const cp = retryCpMap.get(`${row.copropriete_id}:${row.recipient_email.trim().toLowerCase()}`);

    const subject = buildAGReminderSubject({
      coproprieteNom: copro?.nom ?? '',
      dateAg: ag.date_ag,
      kind: 'unopened',
    });

    const html = buildAGReminderEmail({
      prenom: cp?.prenom ?? 'Coproprietaire',
      nom: cp?.nom ?? '',
      coproprieteNom: copro?.nom ?? '',
      agTitre: ag.titre,
      dateAg: ag.date_ag,
      lieu: ag.lieu,
      kind: 'unopened',
    });

    const result = await resend.emails.send({ from: FROM, to: row.recipient_email, subject, html });

    if (result.error) {
      const count = (row.retry_count ?? 0) + 1;
      const exhausted = count >= 3;
      await admin
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

    await admin
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

  // ── Milestone : première AG planifiée ─────────────────────────────────────
  // Cible : copropriétés dont la première AG vient d'être planifiée
  // (créée dans les 2 derniers jours) — syndic pas encore notifié.
  let milestoneAGSent = 0;
  const yesterday = addDays(now, -1);
  const { data: firstAGCandidates } = await admin
    .from('assemblees_generales')
    .select('id, copropriete_id, titre, date_ag, coproprietes!inner(nom, syndic_id)')
    .gte('created_at', `${yesterday}T00:00:00.000Z`)
    .in('statut', ['creation', 'planifiee']);

  for (const ag of firstAGCandidates ?? []) {
    const copro = Array.isArray(ag.coproprietes) ? ag.coproprietes[0] : ag.coproprietes;
    if (!copro?.syndic_id) continue;

    // Vérifie si c'est bien la première AG de cette copropriété
    const { count: totalAGs } = await admin
      .from('assemblees_generales')
      .select('id', { count: 'exact', head: true })
      .eq('copropriete_id', ag.copropriete_id)
      .neq('statut', 'annulee');

    if ((totalAGs ?? 0) !== 1) continue;

    // Récupère le profil du syndic
    const { data: profile } = await admin
      .from('profiles')
      .select('email, full_name, prenom')
      .eq('id', copro.syndic_id)
      .maybeSingle();

    if (!profile?.email) continue;

    // Idempotence via user_events
    const { count: alreadySent } = await admin
      .from('user_events')
      .select('id', { count: 'exact', head: true })
      .eq('user_email', profile.email)
      .eq('event_type', 'milestone_premiere_ag_planifiee')
      .eq('copropriete_id', ag.copropriete_id);

    if (alreadySent) continue;

    const syndicPrenom = profile.prenom?.trim() || (profile.full_name ?? '').split(' ')[0] || '';
    const subject = buildMilestoneAGPlanifieeSubject(copro.nom);
    const result = await resend.emails.send({
      from: FROM,
      to: profile.email,
      subject,
      html: buildMilestoneAGPlanifieeEmail({
        syndicPrenom,
        coproprieteNom: copro.nom,
        agTitre: ag.titre,
        dateAg: ag.date_ag,
        agUrl: `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/assemblees/${ag.id}`,
      }),
    });

    if (!result.error) {
      await admin.from('user_events').insert({
        user_email: profile.email,
        event_type: 'milestone_premiere_ag_planifiee',
        label: `Milestone : première AG planifiée (${ag.titre})`,
        copropriete_id: ag.copropriete_id,
      });
      sent++;
      milestoneAGSent++;
    } else {
      console.error('[cron/rappels-ag] Erreur email milestone AG:', result.error);
    }
  }

  // ── Alerte AG sans convocation ────────────────────────────────────────────
  // AG planifiée dans ≤ 30 jours, créée il y a > 3 jours, sans convocation envoyée.
  let convocationManquanteSent = 0;

  const createdBefore = new Date(now);
  createdBefore.setDate(createdBefore.getDate() - 3);
  const createdBeforeStr = createdBefore.toISOString().slice(0, 10);
  const in30days = addDays(now, 30);

  const { data: agsManquantes } = await admin
    .from('assemblees_generales')
    .select('id, copropriete_id, titre, date_ag, coproprietes(nom, syndic_id)')
    .eq('statut', 'planifiee')
    .gt('date_ag', today)
    .lte('date_ag', in30days)
    .is('convocation_envoyee_le', null)
    .lt('created_at', createdBeforeStr);

  for (const ag of agsManquantes ?? []) {
    const copro = Array.isArray(ag.coproprietes) ? ag.coproprietes[0] : ag.coproprietes;
    if (!copro?.syndic_id || !copro?.nom) continue;

    const { data: profile } = await admin
      .from('profiles')
      .select('email, full_name, prenom')
      .eq('id', copro.syndic_id)
      .maybeSingle();

    if (!profile?.email) continue;

    const { count: alreadySentAlert } = await admin
      .from('email_deliveries')
      .select('id', { count: 'exact', head: true })
      .eq('recipient_email', profile.email)
      .eq('template_key', 'ag_convocation_manquante')
      .eq('ag_id', ag.id);

    if ((alreadySentAlert ?? 0) > 0) continue;

    const dateAgFormatted = new Date(ag.date_ag).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
    const syndicPrenom = profile.prenom?.trim() || (profile.full_name ?? '').split(' ')[0] || null;
    const agUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/assemblees/${ag.id}`;
    const subject = buildAGConvocationManquanteSubject(copro.nom, ag.titre);

    const result = await resend.emails.send({
      from: FROM,
      to: profile.email,
      subject,
      html: buildAGConvocationManquanteEmail({
        syndicPrenom,
        coproprieteNom: copro.nom,
        agTitre: ag.titre,
        dateAg: dateAgFormatted,
        agUrl,
      }),
    });

    if (!result.error) {
      await trackEmailDelivery({
        providerMessageId: result.data?.id ?? null,
        templateKey: 'ag_convocation_manquante',
        status: 'sent',
        recipientEmail: profile.email,
        coproprieteId: ag.copropriete_id,
        agId: ag.id,
        subject,
      });
      sent++;
      convocationManquanteSent++;
    } else {
      console.error('[cron/rappels-ag] Erreur email convocation manquante:', result.error);
    }
  }

  return NextResponse.json({
    ok: true,
    sent,
    retries,
    milestone_ag: milestoneAGSent,
    convocation_manquante: convocationManquanteSent,
  });
}
