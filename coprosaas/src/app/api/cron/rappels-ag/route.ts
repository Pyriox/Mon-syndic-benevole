import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Resend } from 'resend';
import { buildAGReminderEmail, buildAGReminderSubject } from '@/lib/emails/ag-reminders';
import { pushNotification, pushAdminAlert } from '@/lib/notification-center';
import { trackEmailDelivery } from '@/lib/email-delivery';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = `Mon Syndic Benevole <${process.env.EMAIL_FROM ?? 'noreply@mon-syndic-benevole.fr'}>`;

function addDays(base: Date, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const today = now.toISOString().slice(0, 10);
  const j14 = addDays(now, 14);
  const j7 = addDays(now, 7);

  let sent = 0;
  let retries = 0;

  const { data: agsJ14 } = await admin
    .from('assemblees_generales')
    .select('id, copropriete_id, titre, date_ag, lieu, convocation_envoyee_le, convocation_rappel_j14_at, coproprietes(nom, syndic_id)')
    .eq('statut', 'planifiee')
    .eq('date_ag', j14)
    .not('convocation_envoyee_le', 'is', null)
    .is('convocation_rappel_j14_at', null);

  const { data: agsJ7 } = await admin
    .from('assemblees_generales')
    .select('id, copropriete_id, titre, date_ag, lieu, convocation_envoyee_le, convocation_rappel_j7_at, coproprietes(nom, syndic_id)')
    .eq('statut', 'planifiee')
    .eq('date_ag', j7)
    .not('convocation_envoyee_le', 'is', null)
    .is('convocation_rappel_j7_at', null);

  for (const row of agsJ14 ?? []) {
    const copro = Array.isArray(row.coproprietes) ? row.coproprietes[0] : row.coproprietes;
    const { data: recipients } = await admin
      .from('coproprietaires')
      .select('id, nom, prenom, email, user_id')
      .eq('copropriete_id', row.copropriete_id)
      .not('email', 'is', null);

    let sentForAg = 0;
    for (const cp of recipients ?? []) {
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
    const { data: recipients } = await admin
      .from('coproprietaires')
      .select('id, nom, prenom, email, user_id')
      .eq('copropriete_id', row.copropriete_id)
      .not('email', 'is', null);

    let sentForAg = 0;
    for (const cp of recipients ?? []) {
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

  for (const d of unopened ?? []) {
    if (!d.ag_id || !d.copropriete_id) continue;

    const { data: ag } = await admin
      .from('assemblees_generales')
      .select('id, titre, date_ag, lieu, coproprietes(nom, syndic_id)')
      .eq('id', d.ag_id)
      .gte('date_ag', today)
      .maybeSingle();

    if (!ag) continue;

    const { data: cp } = await admin
      .from('coproprietaires')
      .select('nom, prenom')
      .eq('copropriete_id', d.copropriete_id)
      .eq('email', d.recipient_email)
      .maybeSingle();

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
    if (result.error) continue;

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

  for (const row of retryRows ?? []) {
    if (!row.ag_id || !row.copropriete_id) continue;

    const { data: ag } = await admin
      .from('assemblees_generales')
      .select('id, titre, date_ag, lieu, coproprietes(nom)')
      .eq('id', row.ag_id)
      .maybeSingle();

    if (!ag) continue;
    const copro = Array.isArray(ag.coproprietes) ? ag.coproprietes[0] : ag.coproprietes;

    const { data: cp } = await admin
      .from('coproprietaires')
      .select('nom, prenom')
      .eq('copropriete_id', row.copropriete_id)
      .eq('email', row.recipient_email)
      .maybeSingle();

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

  return NextResponse.json({
    ok: true,
    sent,
    retries,
  });
}
