// ============================================================
// Page Admin — Support tickets
// Server Component : charge les tickets via createAdminClient()
// ============================================================
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import AdminSupportShell from './AdminSupportShell';

import { isAdminUser } from '@/lib/admin-config';
import { getAdminSupportTickets } from '@/lib/admin-support';

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

  const tickets = await getAdminSupportTickets(admin);

  return (
    <AdminSupportShell
      initialTickets={tickets}
      initialSearch={q ?? ''}
      initialFilterStatus={status === 'ouvert' || status === 'en_cours' || status === 'resolu' ? status : 'all'}
      initialTicketId={ticket ?? null}
    />
  );
}
