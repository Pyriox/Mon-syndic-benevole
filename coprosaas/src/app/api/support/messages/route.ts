// ============================================================
// GET /api/support/messages?ticketId=xxx — Messages d'un ticket
// Réservé à l'admin
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { isAdminUser } from '@/lib/admin-config';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const admin = createAdminClient();
  if (!user || !(await isAdminUser(user.id, admin))) {
    return NextResponse.json({ message: 'Non autorisé' }, { status: 403 });
  }

  const ticketId = req.nextUrl.searchParams.get('ticketId');
  if (!ticketId?.trim()) {
    return NextResponse.json({ message: 'ticketId requis' }, { status: 400 });
  }

  const { data, error } = await admin
    .from('support_messages')
    .select('id, ticket_id, author, content, created_at, client_read')
    .eq('ticket_id', ticketId.trim())
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ message: 'Erreur base de données' }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
