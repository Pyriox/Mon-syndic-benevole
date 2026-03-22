// ============================================================
// GET /api/support/messages?ticketId=xxx — Messages d'un ticket
// Réservé à l'admin
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'tpn.fabien@gmail.com';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email?.toLowerCase() !== ADMIN_EMAIL?.toLowerCase()) {
    return NextResponse.json({ message: 'Non autorisé' }, { status: 403 });
  }

  const ticketId = req.nextUrl.searchParams.get('ticketId');
  if (!ticketId?.trim()) {
    return NextResponse.json({ message: 'ticketId requis' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('support_messages')
    .select('id, ticket_id, author, content, created_at')
    .eq('ticket_id', ticketId.trim())
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ message: 'Erreur base de données' }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
