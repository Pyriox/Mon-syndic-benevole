// ============================================================
// POST /api/support/mark-read — Marque les messages admin comme lus
// Utilisateur authentifié uniquement, propriétaire du ticket
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });
  }

  let body: { ticketId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 });
  }

  const { ticketId } = body;
  if (!ticketId?.trim()) {
    return NextResponse.json({ message: 'ticketId requis' }, { status: 422 });
  }

  const admin = createAdminClient();

  // Vérifier que le ticket appartient bien à cet utilisateur
  const { data: ticket } = await admin
    .from('support_tickets')
    .select('id')
    .eq('id', ticketId.trim())
    .eq('user_id', user.id)
    .single();

  if (!ticket) {
    return NextResponse.json({ message: 'Ticket introuvable' }, { status: 404 });
  }

  // Marquer tous les messages admin comme lus
  await admin
    .from('support_messages')
    .update({ client_read: true })
    .eq('ticket_id', ticket.id)
    .eq('author', 'admin')
    .eq('client_read', false);

  return NextResponse.json({ message: 'OK' });
}
