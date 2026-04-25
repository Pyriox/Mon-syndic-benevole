'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export type EventSeverity = 'info' | 'warning' | 'error';

/**
 * Format canonique d'un événement interne.
 *
 * ── Règles de normalisation ────────────────────────────────────
 * - `eventType`  : identifiant snake_case unique par action métier
 * - `label`      : description humaine courte (affiché dans l'admin)
 * - `metadata`   : conteneur JSONB flexible pour toute donnée structurée
 *                  → ajouter toute nouvelle donnée ici, pas en colonne
 * - `sessionId`  : UUID de la session d'utilisation (optionnel, côté client)
 * - `severity`   : 'info' par défaut, 'warning'/'error' pour les alertes
 */
export type LogUserEventInput = {
  eventType: string;
  label?: string;
  severity?: EventSeverity;
  metadata?: Record<string, unknown>;
  userId?: string | null;
  /** Session d'utilisation interne. Disponible via getCurrentSessionId() (client uniquement). */
  sessionId?: string | null;
};

export async function logCurrentUserEvent({
  eventType,
  label = '',
  severity = 'info',
  metadata,
  userId,
  sessionId,
}: LogUserEventInput): Promise<void> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const email = user?.email?.trim().toLowerCase();
    if (!email || !eventType.trim()) return;

    const admin = createAdminClient();
    await admin.from('user_events').insert({
      user_id: userId ?? user?.id ?? null,
      user_email: email,
      event_type: eventType.trim(),
      label: label.trim(),
      severity,
      metadata: metadata ?? null,
      session_id: sessionId ?? null,
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
  userId,
  sessionId,
}: LogUserEventInput & { email: string }): Promise<void> {
  try {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !eventType.trim()) return;
    const admin = createAdminClient();
    await admin.from('user_events').insert({
      user_id: userId ?? null,
      user_email: normalizedEmail,
      event_type: eventType.trim(),
      label: label.trim(),
      severity,
      metadata: metadata ?? null,
      session_id: sessionId ?? null,
    });
  } catch {
    // Journal non bloquant
  }
}

/** Variante dédiée aux actions admin sensibles. */
export async function logAdminAction({
  adminEmail,
  eventType,
  label = '',
  severity = 'info',
  metadata,
  userId,
  sessionId,
}: LogUserEventInput & { adminEmail: string }): Promise<void> {
  try {
    const normalizedEmail = adminEmail.trim().toLowerCase();
    if (!normalizedEmail || !eventType.trim()) return;

    const admin = createAdminClient();
    await admin.from('user_events').insert({
      user_id: userId ?? null,
      user_email: normalizedEmail,
      event_type: eventType.trim(),
      label: label.trim(),
      severity,
      metadata: {
        scope: 'admin',
        ...(metadata ?? {}),
      },
      session_id: sessionId ?? null,
    });
  } catch {
    // Journal non bloquant
  }
}
