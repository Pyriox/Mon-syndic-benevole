import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { applyProviderEvent } from '@/lib/email-delivery';
import { pushAdminAlert } from '@/lib/notification-center';

const resend = new Resend(process.env.RESEND_API_KEY);

export const runtime = 'nodejs';

type ResendEmailWebhook = {
  type: string;
  created_at: string;
  data?: {
    email_id?: string;
    to?: string[];
    subject?: string;
    bounce?: { message?: string };
    failed?: { reason?: string };
  } & Record<string, unknown>;
};

function isAlertStatus(status: string | null): status is 'failed' | 'bounced' | 'complained' {
  return status === 'failed' || status === 'bounced' || status === 'complained';
}

function buildAlertBody(event: ResendEmailWebhook): string {
  const recipient = event.data?.to?.join(', ') ?? 'destinataire inconnu';
  const reason = typeof event.data?.failed?.reason === 'string'
    ? event.data.failed.reason
    : typeof event.data?.bounce?.message === 'string'
      ? event.data.bounce.message
      : event.type;
  return `${recipient} · ${reason}`;
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ message: 'Webhook secret manquant' }, { status: 500 });
  }

  const payload = await req.text();
  const svixId = req.headers.get('svix-id');
  const svixTimestamp = req.headers.get('svix-timestamp');
  const svixSignature = req.headers.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ message: 'Signature webhook manquante' }, { status: 400 });
  }

  let event: ResendEmailWebhook;
  try {
    event = resend.webhooks.verify({
      payload,
      webhookSecret,
      headers: {
        id: svixId,
        timestamp: svixTimestamp,
        signature: svixSignature,
      },
    }) as ResendEmailWebhook;
  } catch (error) {
    console.error('[resend/webhook] verify error:', error);
    return NextResponse.json({ message: 'Signature invalide' }, { status: 400 });
  }

  const providerMessageId = event.data?.email_id;
  if (!providerMessageId) {
    return NextResponse.json({ ok: true, ignored: true, reason: 'missing_email_id' });
  }

  const { delivery, newStatus } = await applyProviderEvent({
    providerMessageId,
    providerEvent: event.type,
    payload: (event.data ?? {}) as Record<string, unknown>,
  });

  if (delivery && isAlertStatus(newStatus)) {
    await pushAdminAlert({
      title: `Email ${newStatus}`,
      body: buildAlertBody(event),
      href: '/admin/emails',
      severity: newStatus === 'complained' ? 'warning' : 'danger',
      metadata: {
        deliveryId: delivery.id,
        templateKey: delivery.template_key,
        recipientEmail: delivery.recipient_email,
        providerMessageId,
        providerEvent: event.type,
      },
    }).catch((error) => {
      console.error('[resend/webhook] admin alert error:', error);
    });
  }

  return NextResponse.json({ ok: true, matched: Boolean(delivery), status: newStatus });
}