import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import NotificationsCenter from './NotificationsCenter';

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: notifs } = await supabase
    .from('app_notifications')
    .select('id, type, severity, title, body, href, action_label, is_read, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(300);

  return <NotificationsCenter initialItems={notifs ?? []} />;
}
