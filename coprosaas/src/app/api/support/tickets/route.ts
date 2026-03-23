// ============================================================
// GET /api/support/tickets — Liste tous les tickets
// Réservé à l'admin
// ============================================================
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

import { isAdminUser } from '@/lib/admin-config';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const admin = createAdminClient();
  if (!user || !(await isAdminUser(user.id, admin))) {
    return NextResponse.json({ message: 'Non autorisé' }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('support_tickets')
    .select('id, user_email, user_name, subject, status, created_at, updated_at')
    .order('updated_at', { ascending: false });

  if (error) {
    return NextResponse.json({ message: 'Erreur base de données' }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
