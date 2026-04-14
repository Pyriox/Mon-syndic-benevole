import { createAdminClient } from '@/lib/supabase/admin';
import { logCurrentUserEvent } from './log-user-event';

export async function addCompteBancaireWithJournal({ coproId, compte }: { coproId: string; compte: any }) {
  const admin = createAdminClient();
  const { data, error } = await admin.from('comptes_bancaires').insert({ ...compte, copropriete_id: coproId }).select().single();
  if (!error && data) {
    await logCurrentUserEvent({
      eventType: 'compte_bancaire_added',
      label: `Compte bancaire ajouté : ${compte.label ?? ''}`.trim(),
      metadata: { coproId, compte },
    });
  }
  return { data, error };
}

export async function deleteCompteBancaireWithJournal({ compteId, coproId, compteLabel }: { compteId: string; coproId: string; compteLabel?: string }) {
  const admin = createAdminClient();
  const { error } = await admin.from('comptes_bancaires').delete().eq('id', compteId);
  if (!error) {
    await logCurrentUserEvent({
      eventType: 'compte_bancaire_deleted',
      label: `Compte bancaire supprimé : ${compteLabel ?? compteId}`,
      metadata: { coproId, compteId },
    });
  }
  return { error };
}
