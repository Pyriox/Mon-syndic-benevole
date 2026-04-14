import { createAdminClient } from '@/lib/supabase/admin';
import { logCurrentUserEvent } from './log-user-event';

/**
 * Journalise la modification d'un appel de fonds (hors statut).
 */
export async function updateAppelDeFondsWithJournal({
  appelId,
  coproId,
  updates,
  before,
}: {
  appelId: string;
  coproId: string;
  updates: any;
  before?: any;
}) {
  const admin = createAdminClient();
  const { data, error } = await admin.from('appels_de_fonds').update(updates).eq('id', appelId).select().single();
  if (!error && data) {
    await logCurrentUserEvent({
      eventType: 'appel_fonds_updated',
      label: `Appel de fonds modifié : ${appelId}`,
      metadata: { coproId, appelId, before, after: data, updates },
    });
  }
  return { data, error };
}

/**
 * Journalise le changement de statut d'un appel de fonds.
 */
export async function logAppelDeFondsStatusChange({
  appelId,
  coproId,
  oldStatus,
  newStatus,
  label,
}: {
  appelId: string;
  coproId: string;
  oldStatus: string;
  newStatus: string;
  label?: string;
}) {
  await logCurrentUserEvent({
    eventType: 'appel_fonds_status_changed',
    label: label || `Statut appel de fonds modifié : ${oldStatus} → ${newStatus}`,
    metadata: { appelId, coproId, oldStatus, newStatus },
  });
}
