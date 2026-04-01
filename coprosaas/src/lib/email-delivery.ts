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

export type ResendSendResultLike = {
  data?: {
    id?: string | null;
  } | null;
  error?: {
    message?: string;
  } | null;
};

const RETRY_DELAY_MS = 6 * 60 * 60 * 1000;

function normalizeProviderMessageId(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.replace(/^<|>$/g, '');
}

function buildStatusUpdate(status: EmailDeliveryStatus, lastError?: string | null): Record<string, string | null> {
  const now = new Date().toISOString();

  switch (status) {
    case 'sent':
      return {
        status,
        sent_at: now,
        delivered_at: null,
        opened_at: null,
        clicked_at: null,
        bounced_at: null,
        complained_at: null,
        failed_at: null,
        next_retry_at: null,
        last_error: null,
      };
    case 'delivered':
      return { status, delivered_at: now, next_retry_at: null, last_error: null };
    case 'opened':
      return { status, opened_at: now, next_retry_at: null, last_error: null };
    case 'clicked':
      return { status, clicked_at: now, next_retry_at: null, last_error: null };
    case 'bounced':
      return {
        status,
        bounced_at: now,
        next_retry_at: new Date(Date.now() + RETRY_DELAY_MS).toISOString(),
        last_error: lastError ?? null,
      };
    case 'complained':
      return { status, complained_at: now, next_retry_at: null, last_error: lastError ?? null };
    case 'failed':
      return {
        status,
        failed_at: now,
        next_retry_at: new Date(Date.now() + RETRY_DELAY_MS).toISOString(),
        last_error: lastError ?? null,
      };
    case 'queued':
    default:
      return { status, last_error: lastError ?? null };
  }
}

function getProviderErrorMessage(payload: Record<string, unknown>, status: EmailDeliveryStatus): string | null {
  if (status === 'failed') {
    const failed = payload.failed;
    if (failed && typeof failed === 'object' && 'reason' in failed && typeof failed.reason === 'string') {
      return failed.reason;
    }
  }

  if (status === 'bounced') {
    const bounce = payload.bounce;
    if (bounce && typeof bounce === 'object' && 'message' in bounce && typeof bounce.message === 'string') {
      return bounce.message;
    }
  }

  if (status === 'complained') {
    return 'Provider complaint event';
  }

  return null;
}

export async function trackEmailDelivery(input: TrackEmailDeliveryInput): Promise<void> {
  const admin = createAdminClient();
  const normalizedEmail = input.recipientEmail.trim().toLowerCase();
  const normalizedProviderMessageId = normalizeProviderMessageId(input.providerMessageId ?? null);
  if (!normalizedEmail) return;

  const row = {
    provider_message_id: normalizedProviderMessageId,
    template_key: input.templateKey,
    status: input.status,
    recipient_email: normalizedEmail,
    recipient_user_id: input.recipientUserId ?? null,
    copropriete_id: input.coproprieteId ?? null,
    ag_id: input.agId ?? null,
    appel_de_fonds_id: input.appelDeFondsId ?? null,
    subject: input.subject ?? null,
    legal_event_type: input.legalEventType ?? null,
    legal_reference: input.legalReference ?? null,
    payload: input.payload ?? {},
    ...buildStatusUpdate(input.status, input.lastError),
  };

  await admin.from('email_deliveries').insert(row);
}

export async function trackResendSendResult(
  result: ResendSendResultLike,
  input: Omit<TrackEmailDeliveryInput, 'status' | 'providerMessageId' | 'lastError'>,
): Promise<{ ok: boolean; errorMessage: string | null }> {
  const errorMessage = result.error?.message ?? null;

  if (errorMessage) {
    await trackEmailDelivery({
      ...input,
      status: 'failed',
      lastError: errorMessage,
    });

    return { ok: false, errorMessage };
  }

  await trackEmailDelivery({
    ...input,
    providerMessageId: normalizeProviderMessageId(result.data?.id ?? null),
    status: 'sent',
  });

  return { ok: true, errorMessage: null };
}

export function mapProviderEventToStatus(providerEvent: string): EmailDeliveryStatus | null {
  const normalizedEvent = providerEvent.toLowerCase();
  if (normalizedEvent.includes('delivered')) return 'delivered';
  if (normalizedEvent.includes('opened') || normalizedEvent.includes('open')) return 'opened';
  if (normalizedEvent.includes('clicked') || normalizedEvent.includes('click')) return 'clicked';
  if (normalizedEvent.includes('bounced') || normalizedEvent.includes('bounce')) return 'bounced';
  if (normalizedEvent.includes('complained') || normalizedEvent.includes('complaint')) return 'complained';
  if (normalizedEvent.includes('failed') || normalizedEvent.includes('fail')) return 'failed';
  if (normalizedEvent.includes('sent')) return 'sent';
  return null;
}

export async function applyProviderEvent(params: {
  providerMessageId: string;
  providerEvent: string;
  payload: Record<string, unknown>;
  recipientEmail?: string | null;
  subject?: string | null;
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
  const newStatus = mapProviderEventToStatus(params.providerEvent);
  if (!newStatus) {
    return { delivery: null, newStatus: null };
  }

  const normalizedProviderMessageId = normalizeProviderMessageId(params.providerMessageId);
  if (!normalizedProviderMessageId) {
    return { delivery: null, newStatus };
  }

  const admin = createAdminClient();
  let { data: delivery } = await admin
    .from('email_deliveries')
    .select('id, recipient_email, copropriete_id, ag_id, template_key, status, provider_message_id')
    .eq('provider_message_id', normalizedProviderMessageId)
    .maybeSingle();

  // Fallback: certains events peuvent arriver avec un id différent (ou des anciennes lignes sans provider_message_id)
  // On récupère alors la ligne la plus récente pour le même destinataire/sujet, puis on attache l'id provider.
  if (!delivery && params.recipientEmail) {
    const normalizedEmail = params.recipientEmail.trim().toLowerCase();
    if (normalizedEmail) {
      let fallback = admin
        .from('email_deliveries')
        .select('id, recipient_email, copropriete_id, ag_id, template_key, status, provider_message_id')
        .eq('recipient_email', normalizedEmail)
        .in('status', ['queued', 'sent', 'delivered', 'opened', 'clicked'])
        .order('created_at', { ascending: false })
        .limit(1);

      const normalizedSubject = params.subject?.trim();
      if (normalizedSubject) {
        fallback = fallback.eq('subject', normalizedSubject);
      }

      const { data: fallbackDelivery } = await fallback.maybeSingle();
      delivery = fallbackDelivery;

      if (delivery && !delivery.provider_message_id) {
        await admin
          .from('email_deliveries')
          .update({ provider_message_id: normalizedProviderMessageId })
          .eq('id', delivery.id)
          .is('provider_message_id', null);
      }
    }
  }

  if (!delivery) {
    return { delivery: null, newStatus };
  }

  await admin.from('email_delivery_events').insert({
    delivery_id: delivery.id,
    provider_event: params.providerEvent,
    payload: params.payload,
  });

  await admin
    .from('email_deliveries')
    .update(buildStatusUpdate(newStatus, getProviderErrorMessage(params.payload, newStatus)))
    .eq('id', delivery.id);

  return {
    delivery,
    newStatus,
  };
}
