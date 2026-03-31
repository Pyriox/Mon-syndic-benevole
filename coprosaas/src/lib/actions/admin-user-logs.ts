'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { isAdminUser } from '@/lib/admin-config';

export type UserEvent = {
  id: string;
  event_type: string;
  label: string;
  severity: 'info' | 'warning' | 'error';
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export type GetUserLogsFilters = {
  severity?: 'info' | 'warning' | 'error';
  category?: 'billing' | 'account' | 'activity' | 'admin';
  search?: string;
};

const CATEGORY_EVENTS: Record<'billing' | 'account' | 'activity' | 'admin', string[]> = {
  billing: ['trial_started', 'subscription_created', 'subscription_cancelled', 'payment_succeeded', 'payment_failed', 'subscription_renewed', 'subscription_upgraded'],
  account: ['account_confirmed', 'user_registered', 'password_reset_requested', 'login_success', 'login_failed', 'email_confirmation_resent'],
  activity: ['copropriete_created', 'appel_fonds_created', 'ag_created', 'coproprietaire_added', 'ticket_created', 'document_uploaded', 'coproprietaire_deleted', 'appel_fonds_sent'],
  admin: ['admin_user_deleted', 'admin_resend_confirmation', 'admin_force_confirm', 'admin_invitation_cancelled', 'admin_role_revoked', 'admin_role_granted', 'admin_user_updated', 'admin_invitation_deleted', 'admin_subscription_reset', 'admin_stripe_sync', 'admin_syndic_reassigned', 'admin_copro_updated', 'admin_impersonation_link_created', 'admin_coproprietaire_updated'],
};

export async function getUserLogs(
  email: string,
  filters?: GetUserLogsFilters,
): Promise<{ events?: UserEvent[]; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await isAdminUser(user.id, supabase))) {
    return { error: 'Non autorisé' };
  }

  const admin = createAdminClient();
  let query = admin
    .from('user_events')
    .select('id, event_type, label, severity, metadata, created_at')
    .eq('user_email', email.toLowerCase())
    .order('created_at', { ascending: false })
    .limit(200);

  if (filters?.severity) {
    query = query.eq('severity', filters.severity);
  }
  if (filters?.category) {
    query = query.in('event_type', CATEGORY_EVENTS[filters.category]);
  }

  const { data, error } = await query;
  if (error) return { error: error.message };

  let events = (data ?? []) as UserEvent[];
  if (filters?.search) {
    const needle = filters.search.toLowerCase();
    events = events.filter((ev) =>
      ev.label.toLowerCase().includes(needle) ||
      ev.event_type.toLowerCase().includes(needle),
    );
  }

  return { events };
}
