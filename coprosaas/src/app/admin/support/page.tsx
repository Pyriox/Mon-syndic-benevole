// ============================================================
// Page Admin — Support tickets
// Server Component : charge les tickets via createAdminClient()
// ============================================================
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import AdminSupportShell from './AdminSupportShell';

import { isAdminUser } from '@/lib/admin-config';

export default async function AdminSupportPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; ticket?: string }>;
}) {
  // Vérification admin
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await isAdminUser(user.id, supabase))) redirect('/login');

  const { q, status, ticket } = await searchParams;
  const admin = createAdminClient();

  // Charger tous les tickets avec le dernier message
  const { data: tickets } = await admin
    .from('support_tickets')
    .select('id, user_email, user_name, subject, status, created_at, updated_at')
    .order('updated_at', { ascending: false });

  return (
    <AdminSupportShell
      initialTickets={tickets ?? []}
      initialSearch={q ?? ''}
      initialFilterStatus={status === 'ouvert' || status === 'en_cours' || status === 'resolu' ? status : 'all'}
      initialTicketId={ticket ?? null}
    />
  );
}
