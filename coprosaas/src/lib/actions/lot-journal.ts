import { createAdminClient } from '@/lib/supabase/admin';
import { logCurrentUserEvent } from './log-user-event';
import type { Lot } from '@/types';

/**
 * Modifie un lot et journalise l'action (ex : tantièmes/quotes-parts).
 */
export async function updateLotWithJournal({
  lotId,
  coproId,
  updates,
  before,
}: {
  lotId: string;
  coproId: string;
  updates: Partial<Omit<Lot, 'id' | 'created_at'>>;
  before?: Partial<Lot>;
}) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('lots')
    .update(updates)
    .eq('id', lotId)
    .select()
    .single();

  if (!error && data) {
    await logCurrentUserEvent({
      eventType: 'lot_updated',
      label: `Lot modifié : ${data.numero ?? ''} ${data.batiment ?? ''}`.trim(),
      metadata: { coproId, lotId, before, after: data, updates },
    });
  }
  return { data, error };
}

/**
 * Ajoute un lot à la copropriété et journalise l'action.
 */
export async function createLotWithJournal({
  coproId,
  lot,
}: {
  coproId: string;
  lot: Omit<Lot, 'id' | 'created_at'>;
}) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('lots')
    .insert({ ...lot, copropriete_id: coproId })
    .select()
    .single();

  if (!error && data) {
    await logCurrentUserEvent({
      eventType: 'lot_added',
      label: `Lot ajouté : ${lot.numero ?? ''} ${lot.batiment ?? ''}`.trim(),
      metadata: { coproId, lot },
    });
  }
  return { data, error };
}

/**
 * Supprime un lot et journalise l'action.
 */
export async function deleteLotWithJournal({
  lotId,
  coproId,
  lotLabel,
}: {
  lotId: string;
  coproId: string;
  lotLabel?: string;
}) {
  const admin = createAdminClient();
  const { error } = await admin.from('lots').delete().eq('id', lotId);
  if (!error) {
    await logCurrentUserEvent({
      eventType: 'lot_deleted',
      label: `Lot supprimé : ${lotLabel ?? lotId}`,
      metadata: { coproId, lotId },
    });
  }
  return { error };
}
