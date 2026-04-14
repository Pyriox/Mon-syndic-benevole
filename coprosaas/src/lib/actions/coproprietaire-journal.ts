import { createAdminClient } from '@/lib/supabase/admin';
import { logCurrentUserEvent } from './log-user-event';
import type { Coproprietaire } from '@/types';

/**
 * Modifie un copropriétaire et journalise l'action.
 */
export async function updateCoproprietaireWithJournal({
  coproprietaireId,
  coproId,
  updates,
  before,
}: {
  coproprietaireId: string;
  coproId: string;
  updates: Partial<Omit<Coproprietaire, 'id' | 'created_at' | 'solde' | 'lot'>>;
  before?: Partial<Coproprietaire>;
}) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('coproprietaires')
    .update(updates)
    .eq('id', coproprietaireId)
    .select()
    .single();

  if (!error && data) {
    await logCurrentUserEvent({
      eventType: 'coproprietaire_updated',
      label: `Copropriétaire modifié : ${data.nom ?? ''} ${data.prenom ?? ''}`.trim(),
      metadata: { coproId, coproprietaireId, before, after: data, updates },
    });
  }
  return { data, error };
}

/**
 * Ajoute un copropriétaire à la copropriété et journalise l'action.
 */
export async function createCoproprietaireWithJournal({
  coproId,
  coproprietaire,
}: {
  coproId: string;
  coproprietaire: Omit<Coproprietaire, 'id' | 'created_at' | 'solde' | 'lot'>;
}) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('coproprietaires')
    .insert({ ...coproprietaire, copropriete_id: coproId })
    .select()
    .single();

  if (!error && data) {
    await logCurrentUserEvent({
      eventType: 'coproprietaire_added',
      label: `Copropriétaire ajouté : ${coproprietaire.nom ?? ''} ${coproprietaire.prenom ?? ''}`.trim(),
      metadata: { coproId, coproprietaire },
    });
  }
  return { data, error };
}

/**
 * Supprime un copropriétaire et journalise l'action.
 */
export async function deleteCoproprietaireWithJournal({
  coproprietaireId,
  coproId,
  coproprietaireLabel,
}: {
  coproprietaireId: string;
  coproId: string;
  coproprietaireLabel?: string;
}) {
  const admin = createAdminClient();
  const { error } = await admin.from('coproprietaires').delete().eq('id', coproprietaireId);
  if (!error) {
    await logCurrentUserEvent({
      eventType: 'coproprietaire_deleted',
      label: `Copropriétaire supprimé : ${coproprietaireLabel ?? coproprietaireId}`,
      metadata: { coproId, coproprietaireId },
    });
  }
  return { error };
}
