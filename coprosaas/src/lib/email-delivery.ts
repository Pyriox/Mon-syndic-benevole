import 'server-only';

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
  void input;
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
  void params;
  return { delivery: null, newStatus: null };
}
