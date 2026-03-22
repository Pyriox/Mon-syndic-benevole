// ============================================================
// Page Admin — Support tickets
// Server Component : charge les tickets via createAdminClient()
// ============================================================
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import AdminSupportShell from './AdminSupportShell';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'tpn.fabien@gmail.com';

export default async function AdminSupportPage() {
  // Vérification admin
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email?.toLowerCase() !== ADMIN_EMAIL?.toLowerCase()) redirect('/login');

  const admin = createAdminClient();

  // Charger tous les tickets avec le dernier message
  const { data: tickets } = await admin
    .from('support_tickets')
    .select('id, user_email, user_name, subject, status, created_at, updated_at')
    .order('updated_at', { ascending: false });

  return <AdminSupportShell initialTickets={tickets ?? []} />;
}
