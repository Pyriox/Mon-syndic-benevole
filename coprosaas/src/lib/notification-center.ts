import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';

export type NotificationSeverity = 'info' | 'warning' | 'danger';

export type NotificationInput = {
  userId: string;
  coproprieteId?: string | null;
  type: string;
  severity?: NotificationSeverity;
  title: string;
  body?: string | null;
  href?: string;
  actionLabel?: string | null;
  metadata?: Record<string, unknown>;
};

export async function pushNotification(input: NotificationInput): Promise<void> {
  const admin = createAdminClient();
  await admin.from('app_notifications').insert({
    user_id: input.userId,
    copropriete_id: input.coproprieteId ?? null,
    type: input.type,
    severity: input.severity ?? 'info',
    title: input.title,
    body: input.body ?? null,
    href: input.href ?? '/dashboard',
    action_label: input.actionLabel ?? null,
    metadata: input.metadata ?? {},
  });
}

export async function pushNotifications(inputs: NotificationInput[]): Promise<void> {
  if (inputs.length === 0) return;
  const admin = createAdminClient();
  await admin.from('app_notifications').insert(
    inputs.map((input) => ({
      user_id: input.userId,
      copropriete_id: input.coproprieteId ?? null,
      type: input.type,
      severity: input.severity ?? 'info',
      title: input.title,
      body: input.body ?? null,
      href: input.href ?? '/dashboard',
      action_label: input.actionLabel ?? null,
      metadata: input.metadata ?? {},
    }))
  );
}

export async function pushAdminAlert(params: {
  title: string;
  body?: string | null;
  href?: string;
  severity?: NotificationSeverity;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const admin = createAdminClient();
  const { data: admins } = await admin.from('admin_users').select('user_id');
  if (!admins?.length) return;

  await pushNotifications(
    admins.map((a) => ({
      userId: a.user_id,
      type: 'admin_alert',
      severity: params.severity ?? 'warning',
      title: params.title,
      body: params.body ?? null,
      href: params.href ?? '/admin/dashboard',
      actionLabel: 'Voir',
      metadata: params.metadata ?? {},
    }))
  );
}
