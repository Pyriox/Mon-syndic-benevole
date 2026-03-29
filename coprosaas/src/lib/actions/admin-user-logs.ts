'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { isAdminUser } from '@/lib/admin-config';

export type UserEvent = {
  id: string;
  event_type: string;
  label: string;
  created_at: string;
};

export async function getUserLogs(email: string): Promise<{ events?: UserEvent[]; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await isAdminUser(user.id, supabase))) {
    return { error: 'Non autorisé' };
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('user_events')
    .select('id, event_type, label, created_at')
    .eq('user_email', email.toLowerCase())
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) return { error: error.message };
  return { events: (data ?? []) as UserEvent[] };
}
