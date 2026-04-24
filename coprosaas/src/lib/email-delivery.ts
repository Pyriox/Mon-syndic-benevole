import 'server-only';

import { Resend } from 'resend';
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
const STATUS_PRIORITY: Record<EmailDeliveryStatus, number> = {
  queued: 0,
  sent: 1,
  delivered: 2,
  opened: 3,
  clicked: 4,
  bounced: 5,
  complained: 5,
  failed: 5,
};

function normalizeProviderMessageId(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.replace(/^<|>$/g, '');
}

function normalizeRecipientEmail(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const extracted = trimmed.match(/<([^>]+)>/)?.[1] ?? trimmed;
  const normalized = extracted.trim().toLowerCase();
  return normalized || null;
}

function pickPrimaryRecipient(to: string[] | null | undefined): string | null {
  if (!Array.isArray(to)) return null;

  for (const value of to) {
    if (typeof value !== 'string') continue;
    const normalized = normalizeRecipientEmail(value);
    if (normalized) return normalized;
  }

  return null;
}

function inferTemplateKeyFromSubject(subject: string | null | undefined): string {
  const normalized = subject?.trim().toLowerCase() ?? '';

  if (!normalized) return 'resend_import';
  if (normalized.includes('activez votre compte') || normalized.includes('confirmez votre adresse')) return 'signup_confirmation';
  if (normalized.includes('bienvenue sur mon syndic bénévole') || normalized.includes('votre compte est prêt') || normalized.includes('votre compte est pret')) return 'welcome';
  if (normalized.includes('mot de passe') || normalized.includes('réinitialis') || normalized.includes('reinitialis')) return 'password_reset';
  if (normalized.includes('invitation')) return 'invitation';

  return 'resend_import';
}

function buildImportedStatusTimestamps(status: EmailDeliveryStatus, occurredAt: string | null): Record<string, string | null> {
  const at = occurredAt ?? new Date().toISOString();

  return {
    sent_at: status === 'queued' ? null : at,
    delivered_at: status === 'delivered' || status === 'opened' || status === 'clicked' ? at : null,
    opened_at: status === 'opened' || status === 'clicked' ? at : null,
    clicked_at: status === 'clicked' ? at : null,
    bounced_at: status === 'bounced' ? at : null,
    complained_at: status === 'complained' ? at : null,
    failed_at: status === 'failed' ? at : null,
  };
}

type ResendListEmailLike = {
  id?: string | null;
  to?: string[] | null;
  subject?: string | null;
  created_at?: string | null;
  last_event?: string | null;
} & Record<string, unknown>;

function buildImportedProviderDelivery(email: ResendListEmailLike): Record<string, unknown> | null {
  const providerMessageId = normalizeProviderMessageId(email.id ?? null);
  const recipientEmail = pickPrimaryRecipient(email.to ?? null);

  if (!providerMessageId || !recipientEmail) return null;

  const status = mapProviderEventToStatus(email.last_event ?? '') ?? 'sent';
  const occurredAt = typeof email.created_at === 'string' && email.created_at.trim()
    ? email.created_at
    : new Date().toISOString();

  return {
    provider: 'resend',
    provider_message_id: providerMessageId,
    template_key: inferTemplateKeyFromSubject(email.subject ?? null),
    channel: 'email',
    status,
    recipient_email: recipientEmail,
    subject: email.subject ?? null,
    payload: email,
    ...buildStatusUpdate(status),
    ...buildImportedStatusTimestamps(status, occurredAt),
    created_at: occurredAt,
  };
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
  if (normalizedEvent.includes('queued') || normalizedEvent.includes('scheduled')) return 'queued';
  return null;
}

function shouldRefreshFromProvider(status: EmailDeliveryStatus): boolean {
  return status !== 'failed' && status !== 'bounced' && status !== 'complained';
}

function shouldApplyProviderStatus(currentStatus: EmailDeliveryStatus, nextStatus: EmailDeliveryStatus): boolean {
  if (currentStatus === nextStatus) return false;
  if (nextStatus === 'failed' || nextStatus === 'bounced' || nextStatus === 'complained') return true;
  return STATUS_PRIORITY[nextStatus] >= STATUS_PRIORITY[currentStatus];
}

export type EmailDeliverySyncCandidate = {
  id: string;
  providerMessageId: string | null;
  status: EmailDeliveryStatus;
};

export async function syncEmailDeliveriesWithResend(rows: EmailDeliverySyncCandidate[]): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || rows.length === 0) return;

  const resend = new Resend(apiKey);
  const admin = createAdminClient();
  const seenProviderIds = new Set<string>();

  const candidates = rows.filter((row) => {
    const providerMessageId = normalizeProviderMessageId(row.providerMessageId);
    if (!providerMessageId || seenProviderIds.has(providerMessageId)) return false;
    if (!shouldRefreshFromProvider(row.status)) return false;
    seenProviderIds.add(providerMessageId);
    return true;
  });

  await Promise.allSettled(candidates.map(async (row) => {
    const providerMessageId = normalizeProviderMessageId(row.providerMessageId);
    if (!providerMessageId) return;

    const result = await resend.emails.get(providerMessageId);
    if (result.error) return;

    const nextStatus = mapProviderEventToStatus(result.data?.last_event ?? '');
    if (!nextStatus || !shouldApplyProviderStatus(row.status, nextStatus)) return;

    await admin.from('email_deliveries').update({
      ...buildStatusUpdate(nextStatus),
      subject: result.data?.subject ?? null,
      payload: (result.data ?? {}) as unknown as Record<string, unknown>,
    }).eq('id', row.id);
  }));
}

export async function backfillEmailDeliveriesFromResend(options: {
  limit?: number;
  searchQuery?: string;
} = {}): Promise<number> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return 0;

  const resend = new Resend(apiKey);
  const admin = createAdminClient();
  const limit = Math.min(Math.max(options.limit ?? 100, 1), 100);

  const result = await resend.emails.list({ limit });
  if (result.error) {
    console.error('[email-delivery] resend.emails.list error:', result.error.message);
    return 0;
  }

  const needle = options.searchQuery?.trim().toLowerCase() ?? '';
  const providerEmails = (result.data?.data ?? []).filter((email) => {
    if (!needle) return true;
    const haystack = [
      email.id ?? '',
      email.subject ?? '',
      ...(Array.isArray(email.to) ? email.to : []),
    ].join(' ').toLowerCase();
    return haystack.includes(needle);
  });

  if (providerEmails.length === 0) return 0;

  const providerIds = providerEmails
    .map((email) => normalizeProviderMessageId(email.id ?? null))
    .filter((value): value is string => Boolean(value));

  if (providerIds.length === 0) return 0;

  const { data: existingRows } = await admin
    .from('email_deliveries')
    .select('provider_message_id')
    .in('provider_message_id', providerIds);

  const existingIds = new Set(
    (existingRows ?? [])
      .map((row) => normalizeProviderMessageId((row as { provider_message_id?: string | null }).provider_message_id ?? null))
      .filter((value): value is string => Boolean(value))
  );

  const rowsToInsert = providerEmails
    .map((email) => buildImportedProviderDelivery(email as ResendListEmailLike))
    .filter((row): row is Record<string, unknown> => {
      if (!row) return false;
      const providerMessageId = typeof row.provider_message_id === 'string' ? row.provider_message_id : null;
      if (!providerMessageId) return false;
      return !existingIds.has(providerMessageId);
    });

  if (rowsToInsert.length === 0) return 0;

  const { error } = await admin
    .from('email_deliveries')
    .upsert(rowsToInsert, { onConflict: 'provider_message_id', ignoreDuplicates: true });

  if (error) {
    console.error('[email-delivery] backfillEmailDeliveriesFromResend upsert error:', error.message);
    return 0;
  }

  return rowsToInsert.length;
}

export async function applyProviderEvent(params: {
  providerMessageId: string;
  providerEvent: string;
  payload: Record<string, unknown>;
  recipientEmail?: string | null;
  subject?: string | null;
  createdAt?: string | null;
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

  if (!delivery && params.recipientEmail) {
    const importedRow = buildImportedProviderDelivery({
      id: normalizedProviderMessageId,
      to: [params.recipientEmail],
      subject: params.subject ?? null,
      created_at: params.createdAt ?? null,
      last_event: params.providerEvent,
      ...(params.payload ?? {}),
    });

    if (importedRow) {
      await admin
        .from('email_deliveries')
        .upsert([importedRow], { onConflict: 'provider_message_id', ignoreDuplicates: true });

      const { data: importedDelivery } = await admin
        .from('email_deliveries')
        .select('id, recipient_email, copropriete_id, ag_id, template_key, status, provider_message_id')
        .eq('provider_message_id', normalizedProviderMessageId)
        .maybeSingle();

      delivery = importedDelivery;
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

/**
 * Vérifie si un email est sur la liste noire des hard bounces.
 * Retourne true si l'email ne doit pas recevoir de messages.
 */
export async function isEmailBounced(email: string): Promise<boolean> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return false;

  const admin = createAdminClient();
  const { data } = await admin
    .from('profiles')
    .select('email_bounced_hard')
    .eq('email', normalizedEmail)
    .eq('email_bounced_hard', true)
    .maybeSingle();

  return Boolean(data);
}
