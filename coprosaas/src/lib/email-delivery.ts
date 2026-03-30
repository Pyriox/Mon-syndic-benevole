import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';

export type EmailDeliveryStatus =
  | 'queued'
  | 'sent'
  | 'delivered'
  | 'opened'
  | 'clicked'
  | 'bounced'
  | 'complained'
  | 'failed';

export type TrackEmailDeliveryInput = {
  providerMessageId?: string | null;
  templateKey: string;
  status: EmailDeliveryStatus;
  recipientEmail: string;
  recipientUserId?: string | null;
  coproprieteId?: string | null;
  agId?: string | null;
  appelDeFondsId?: string | null;
  subject?: string | null;
  legalEventType?: string | null;
  legalReference?: string | null;
  payload?: Record<string, unknown>;
  lastError?: string | null;
};

export async function trackEmailDelivery(input: TrackEmailDeliveryInput): Promise<void> {
  const admin = createAdminClient();
  const nowIso = new Date().toISOString();

  await admin.from('email_deliveries').insert({
    provider: 'resend',
    provider_message_id: input.providerMessageId ?? null,
    template_key: input.templateKey,
    status: input.status,
    recipient_email: input.recipientEmail,
    recipient_user_id: input.recipientUserId ?? null,
    copropriete_id: input.coproprieteId ?? null,
    ag_id: input.agId ?? null,
    appel_de_fonds_id: input.appelDeFondsId ?? null,
    subject: input.subject ?? null,
    legal_event_type: input.legalEventType ?? null,
    legal_reference: input.legalReference ?? null,
    sent_at: input.status === 'sent' ? nowIso : null,
    failed_at: input.status === 'failed' ? nowIso : null,
    next_retry_at: input.status === 'failed' ? new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString() : null,
    last_error: input.lastError ?? null,
    payload: input.payload ?? {},
  });
}

export function mapProviderEventToStatus(providerEvent: string): EmailDeliveryStatus | null {
  if (providerEvent.includes('delivered')) return 'delivered';
  if (providerEvent.includes('opened') || providerEvent.includes('open')) return 'opened';
  if (providerEvent.includes('clicked') || providerEvent.includes('click')) return 'clicked';
  if (providerEvent.includes('bounced') || providerEvent.includes('bounce')) return 'bounced';
  if (providerEvent.includes('complained') || providerEvent.includes('complaint')) return 'complained';
  if (providerEvent.includes('failed') || providerEvent.includes('fail')) return 'failed';
  if (providerEvent.includes('sent')) return 'sent';
  return null;
}

export async function applyProviderEvent(params: {
  providerMessageId: string;
  providerEvent: string;
  payload: Record<string, unknown>;
}): Promise<{
  delivery: {
    id: string;
    recipient_email: string;
    copropriete_id: string | null;
    ag_id: string | null;
    template_key: string;
    status: string;
  } | null;
  newStatus: EmailDeliveryStatus | null;
}> {
  const admin = createAdminClient();
  const newStatus = mapProviderEventToStatus(params.providerEvent.toLowerCase());
  if (!newStatus) return { delivery: null, newStatus: null };

  const { data: delivery } = await admin
    .from('email_deliveries')
    .select('id, recipient_email, copropriete_id, ag_id, template_key, status')
    .eq('provider_message_id', params.providerMessageId)
    .maybeSingle();

  if (!delivery) return { delivery: null, newStatus };

  const nowIso = new Date().toISOString();
  const patch: Record<string, unknown> = {
    status: newStatus,
    next_retry_at: null,
    last_error: null,
  };

  if (newStatus === 'delivered') patch.delivered_at = nowIso;
  if (newStatus === 'opened') patch.opened_at = nowIso;
  if (newStatus === 'clicked') patch.clicked_at = nowIso;
  if (newStatus === 'bounced') {
    patch.bounced_at = nowIso;
    patch.next_retry_at = new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString();
    patch.last_error = String(params.payload.reason ?? params.payload.error ?? 'bounced');
  }
  if (newStatus === 'complained') {
    patch.complained_at = nowIso;
    patch.next_retry_at = null;
    patch.last_error = String(params.payload.reason ?? params.payload.error ?? 'complained');
  }
  if (newStatus === 'failed') {
    patch.failed_at = nowIso;
    patch.next_retry_at = new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString();
    patch.last_error = String(params.payload.reason ?? params.payload.error ?? 'failed');
  }

  await admin.from('email_deliveries').update(patch).eq('id', delivery.id);
  await admin.from('email_delivery_events').insert({
    delivery_id: delivery.id,
    provider_event: params.providerEvent,
    payload: params.payload,
  });

  return { delivery, newStatus };
}
