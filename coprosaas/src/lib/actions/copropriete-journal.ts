import { createAdminClient } from '@/lib/supabase/admin';
import { logCurrentUserEvent } from './log-user-event';

export async function updateCoproprieteWithJournal({ coproId, updates, before }: { coproId: string; updates: any; before?: any }) {
  const admin = createAdminClient();
  const { data, error } = await admin.from('coproprietes').update(updates).eq('id', coproId).select().single();
  if (!error && data) {
    await logCurrentUserEvent({
      eventType: 'copropriete_updated',
      label: `Copropriété modifiée : ${data.nom ?? ''}`.trim(),
      metadata: { coproId, before, after: data, updates },
    });
  }
  return { data, error };
}
