import { NextRequest, NextResponse } from 'next/server';
import { applyProviderEvent } from '@/lib/email-delivery';
import { createAdminClient } from '@/lib/supabase/admin';
import { pushAdminAlert, pushNotification } from '@/lib/notification-center';

function pickProviderMessageId(payload: Record<string, unknown>): string | null {
  const direct = payload.email_id ?? payload.emailId ?? payload.message_id ?? payload.messageId ?? payload.id;
  if (typeof direct === 'string' && direct.length > 0) return direct;

  const data = payload.data as Record<string, unknown> | undefined;
  const nested = data?.email_id ?? data?.emailId ?? data?.message_id ?? data?.messageId ?? data?.id;
  return typeof nested === 'string' && nested.length > 0 ? nested : null;
}

function pickProviderEvent(payload: Record<string, unknown>): string {
  const t = payload.type ?? payload.event ?? payload.last_event;
  if (typeof t === 'string' && t.length > 0) return t.toLowerCase();

  const data = payload.data as Record<string, unknown> | undefined;
  const nested = data?.type ?? data?.event;
  if (typeof nested === 'string' && nested.length > 0) return nested.toLowerCase();

  return 'unknown';
}

export async function POST(req: NextRequest) {
  const expected = process.env.RESEND_WEBHOOK_SECRET;
  const provided = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
    ?? req.headers.get('x-webhook-secret');

  if (expected && provided !== expected) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const payload = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const providerMessageId = pickProviderMessageId(payload);
  const providerEvent = pickProviderEvent(payload);

  if (!providerMessageId || providerEvent === 'unknown') {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const { delivery, newStatus } = await applyProviderEvent({
    providerMessageId,
    providerEvent,
    payload,
  });

  if (!delivery || !newStatus) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const admin = createAdminClient();

  if (delivery.copropriete_id && (newStatus === 'delivered' || newStatus === 'opened') && delivery.template_key.startsWith('ag_')) {
    const { data: copro } = await admin
      .from('coproprietes')
      .select('id, syndic_id, nom')
      .eq('id', delivery.copropriete_id)
      .maybeSingle();

    if (copro?.syndic_id) {
      await pushNotification({
        userId: copro.syndic_id,
        coproprieteId: copro.id,
        type: 'preuve_email',
        severity: 'info',
        title: `AG: statut email ${newStatus}`,
        body: `${delivery.recipient_email} - ${copro.nom ?? 'Copropriete'}`,
        href: '/dashboard/notifications',
        actionLabel: 'Voir',
        metadata: {
          providerMessageId,
          agId: delivery.ag_id,
          templateKey: delivery.template_key,
          status: newStatus,
        },
      });
    }
  }

  if (newStatus === 'bounced' || newStatus === 'complained' || newStatus === 'failed') {
    await pushAdminAlert({
      title: `Alerte delivrabilite email: ${newStatus}`,
      body: `${delivery.recipient_email} (${delivery.template_key})`,
      href: '/admin/emails',
      severity: 'danger',
      metadata: {
        providerMessageId,
        status: newStatus,
        recipient: delivery.recipient_email,
        templateKey: delivery.template_key,
      },
    });
  }

  return NextResponse.json({ ok: true });
}
