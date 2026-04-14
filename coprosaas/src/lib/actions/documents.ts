'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

import { logCurrentUserEvent } from './log-user-event';

// Service role client — bypasse le RLS pour l'insert documents
// (la migration RLS `20250116_documents_rls_write.sql` n'a pas encore été
//  appliquée à la base de production, mais le syndic est vérifié ici)
function createAdminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

export async function insertDocument(payload: {
  copropriete_id: string;
  dossier_id: string | null;
  nom: string;
  type: string;
  url: string;
  taille: number;
  uploaded_by: string;
}): Promise<{ error: string | null }> {
  const cookieStore = await cookies();

  // Vérifier l'identité via le client utilisateur (cookie de session)
  const userClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return { error: 'Non autorisé' };

  // Vérifier que la copropriété appartient bien à ce syndic
  const { data: copro } = await userClient
    .from('coproprietes')
    .select('id')
    .eq('id', payload.copropriete_id)
    .eq('syndic_id', user.id)
    .maybeSingle();

  if (!copro) return { error: 'Copropriété introuvable ou accès refusé' };

  // Insert avec le service role (bypass RLS)
  const admin = createAdminClient();
  const { error } = await admin.from('documents').insert(payload);

  if (!error) {
    await logCurrentUserEvent({
      eventType: 'document_added',
      label: `Document ajouté : ${payload.nom}`,
      metadata: { copropriete_id: payload.copropriete_id, document: payload },
    });
  }

  return { error: error?.message ?? null };
}

/**
 * Supprime un document et journalise l'action.
 */
export async function deleteDocumentWithJournal({
  documentId,
  copropriete_id,
  documentLabel,
}: {
  documentId: string;
  copropriete_id: string;
  documentLabel?: string;
}) {
  const admin = createAdminClient();
  const { error } = await admin.from('documents').delete().eq('id', documentId);
  if (!error) {
    await logCurrentUserEvent({
      eventType: 'document_deleted',
      label: `Document supprimé : ${documentLabel ?? documentId}`,
      metadata: { copropriete_id, documentId },
    });
  }
  return { error };
}
