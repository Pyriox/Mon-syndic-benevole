import { createAdminClient } from '@/lib/supabase/admin';
import { logCurrentUserEvent } from './log-user-event';

export async function addFournisseurWithJournal({ coproId, fournisseur }: { coproId: string; fournisseur: any }) {
  const admin = createAdminClient();
  const { data, error } = await admin.from('fournisseurs').insert({ ...fournisseur, copropriete_id: coproId }).select().single();
  if (!error && data) {
    await logCurrentUserEvent({
      eventType: 'fournisseur_added',
      label: `Fournisseur ajouté : ${fournisseur.nom ?? ''}`.trim(),
      metadata: { coproId, fournisseur },
    });
  }
  return { data, error };
}

export async function deleteFournisseurWithJournal({ fournisseurId, coproId, fournisseurLabel }: { fournisseurId: string; coproId: string; fournisseurLabel?: string }) {
  const admin = createAdminClient();
  const { error } = await admin.from('fournisseurs').delete().eq('id', fournisseurId);
  if (!error) {
    await logCurrentUserEvent({
      eventType: 'fournisseur_deleted',
      label: `Fournisseur supprimé : ${fournisseurLabel ?? fournisseurId}`,
      metadata: { coproId, fournisseurId },
    });
  }
  return { error };
}

export async function addPrestataireWithJournal({ coproId, prestataire }: { coproId: string; prestataire: any }) {
  const admin = createAdminClient();
  const { data, error } = await admin.from('prestataires').insert({ ...prestataire, copropriete_id: coproId }).select().single();
  if (!error && data) {
    await logCurrentUserEvent({
      eventType: 'prestataire_added',
      label: `Prestataire ajouté : ${prestataire.nom ?? ''}`.trim(),
      metadata: { coproId, prestataire },
    });
  }
  return { data, error };
}

export async function deletePrestataireWithJournal({ prestataireId, coproId, prestataireLabel }: { prestataireId: string; coproId: string; prestataireLabel?: string }) {
  const admin = createAdminClient();
  const { error } = await admin.from('prestataires').delete().eq('id', prestataireId);
  if (!error) {
    await logCurrentUserEvent({
      eventType: 'prestataire_deleted',
      label: `Prestataire supprimé : ${prestataireLabel ?? prestataireId}`,
      metadata: { coproId, prestataireId },
    });
  }
  return { error };
}
