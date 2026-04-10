// ============================================================
// GET /api/support/tickets — Liste tous les tickets
// Réservé à l'admin
// ============================================================
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

import { isAdminUser } from '@/lib/admin-config';
import { getAdminSupportTickets } from '@/lib/admin-support';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const admin = createAdminClient();
  if (!user || !(await isAdminUser(user.id, admin))) {
    return NextResponse.json({ message: 'Non autorisé' }, { status: 403 });
  }

  const tickets = await getAdminSupportTickets(admin);
  return NextResponse.json(tickets);
}
