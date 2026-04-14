import { createAdminClient } from '@/lib/supabase/admin';
import { logCurrentUserEvent } from './log-user-event';

export async function updateUserAccessWithJournal({ userId, coproId, updates, before }: { userId: string; coproId: string; updates: any; before?: any }) {
  const admin = createAdminClient();
  const { data, error } = await admin.from('users').update(updates).eq('id', userId).select().single();
  if (!error && data) {
    await logCurrentUserEvent({
      eventType: 'user_access_updated',
      label: `Droits d'accès modifiés pour l'utilisateur : ${userId}`,
      metadata: { coproId, userId, before, after: data, updates },
    });
  }
  return { data, error };
}
