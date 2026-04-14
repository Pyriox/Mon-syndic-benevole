import { createAdminClient } from '@/lib/supabase/admin';
import { logCurrentUserEvent } from './log-user-event';

export async function createChargeWithJournal({ coproId, charge }: { coproId: string; charge: any }) {
  const admin = createAdminClient();
  const { data, error } = await admin.from('charges').insert({ ...charge, copropriete_id: coproId }).select().single();
  if (!error && data) {
    await logCurrentUserEvent({
      eventType: 'charge_added',
      label: `Charge ajoutée : ${charge.libelle ?? ''}`.trim(),
      metadata: { coproId, charge },
    });
  }
  return { data, error };
}

export async function updateChargeWithJournal({ chargeId, coproId, updates, before }: { chargeId: string; coproId: string; updates: any; before?: any }) {
  const admin = createAdminClient();
  const { data, error } = await admin.from('charges').update(updates).eq('id', chargeId).select().single();
  if (!error && data) {
    await logCurrentUserEvent({
      eventType: 'charge_updated',
      label: `Charge modifiée : ${data.libelle ?? ''}`.trim(),
      metadata: { coproId, chargeId, before, after: data, updates },
    });
  }
  return { data, error };
}

export async function deleteChargeWithJournal({ chargeId, coproId, chargeLabel }: { chargeId: string; coproId: string; chargeLabel?: string }) {
  const admin = createAdminClient();
  const { error } = await admin.from('charges').delete().eq('id', chargeId);
  if (!error) {
    await logCurrentUserEvent({
      eventType: 'charge_deleted',
      label: `Charge supprimée : ${chargeLabel ?? chargeId}`,
      metadata: { coproId, chargeId },
    });
  }
  return { error };
}

export async function createTravauxWithJournal({ coproId, travaux }: { coproId: string; travaux: any }) {
  const admin = createAdminClient();
  const { data, error } = await admin.from('travaux').insert({ ...travaux, copropriete_id: coproId }).select().single();
  if (!error && data) {
    await logCurrentUserEvent({
      eventType: 'travaux_added',
      label: `Travaux ajoutés : ${travaux.libelle ?? ''}`.trim(),
      metadata: { coproId, travaux },
    });
  }
  return { data, error };
}

export async function updateTravauxWithJournal({ travauxId, coproId, updates, before }: { travauxId: string; coproId: string; updates: any; before?: any }) {
  const admin = createAdminClient();
  const { data, error } = await admin.from('travaux').update(updates).eq('id', travauxId).select().single();
  if (!error && data) {
    await logCurrentUserEvent({
      eventType: 'travaux_updated',
      label: `Travaux modifiés : ${data.libelle ?? ''}`.trim(),
      metadata: { coproId, travauxId, before, after: data, updates },
    });
  }
  return { data, error };
}

export async function deleteTravauxWithJournal({ travauxId, coproId, travauxLabel }: { travauxId: string; coproId: string; travauxLabel?: string }) {
  const admin = createAdminClient();
  const { error } = await admin.from('travaux').delete().eq('id', travauxId);
  if (!error) {
    await logCurrentUserEvent({
      eventType: 'travaux_deleted',
      label: `Travaux supprimés : ${travauxLabel ?? travauxId}`,
      metadata: { coproId, travauxId },
    });
  }
  return { error };
}
