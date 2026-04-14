import { createAdminClient } from '@/lib/supabase/admin';
import { logCurrentUserEvent } from './log-user-event';

export async function changeSyndicWithJournal({ coproId, oldSyndicId, newSyndicId, oldSyndicLabel, newSyndicLabel }: { coproId: string; oldSyndicId: string; newSyndicId: string; oldSyndicLabel?: string; newSyndicLabel?: string }) {
  const admin = createAdminClient();
  const { error } = await admin.from('coproprietes').update({ syndic_id: newSyndicId }).eq('id', coproId);
  if (!error) {
    await logCurrentUserEvent({
      eventType: 'syndic_changed',
      label: `Syndic changé : ${oldSyndicLabel ?? oldSyndicId} → ${newSyndicLabel ?? newSyndicId}`,
      metadata: { coproId, oldSyndicId, newSyndicId },
    });
  }
  return { error };
}
