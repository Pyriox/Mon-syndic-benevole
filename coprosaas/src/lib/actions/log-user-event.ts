'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export type EventSeverity = 'info' | 'warning' | 'error';

export type LogUserEventInput = {
  eventType: string;
  label?: string;
  severity?: EventSeverity;
  metadata?: Record<string, unknown>;
};

export async function logCurrentUserEvent({
  eventType,
  label = '',
  severity = 'info',
  metadata,
}: LogUserEventInput): Promise<void> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const email = user?.email?.trim().toLowerCase();
    if (!email || !eventType.trim()) return;

    const admin = createAdminClient();
    await admin.from('user_events').insert({
      user_email: email,
      event_type: eventType.trim(),
      label: label.trim(),
      severity,
      metadata: metadata ?? null,
    });
  } catch {
    // Journal non bloquant
  }
}

/** Variante sans contexte auth (pour les routes API qui ont déjà l'email). */
export async function logEventForEmail({
  email,
  eventType,
  label = '',
  severity = 'info',
  metadata,
}: LogUserEventInput & { email: string }): Promise<void> {
  try {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !eventType.trim()) return;
    const admin = createAdminClient();
    await admin.from('user_events').insert({
      user_email: normalizedEmail,
      event_type: eventType.trim(),
      label: label.trim(),
      severity,
      metadata: metadata ?? null,
    });
  } catch {
    // Journal non bloquant
  }
}
