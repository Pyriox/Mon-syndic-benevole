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

  let body: { ticketId?: string; ticketIds?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 });
  }

  const candidateIds = [
    ...(body.ticketId ? [body.ticketId] : []),
    ...(body.ticketIds ?? []),
  ]
    .map((id) => id.trim())
    .filter(Boolean);

  const ticketIds = Array.from(new Set(candidateIds));
  if (ticketIds.length === 0) {
    return NextResponse.json({ message: 'ticketId requis' }, { status: 422 });
  }

  const admin = createAdminClient();

  // Vérifier que les tickets appartiennent bien à cet utilisateur
  const { data: ownedTickets } = await admin
    .from('support_tickets')
    .select('id')
    .in('id', ticketIds)
    .eq('user_id', user.id);

  const ownedTicketIds = (ownedTickets ?? []).map((ticket) => ticket.id);
  if (ownedTicketIds.length === 0) {
    return NextResponse.json({ message: 'Ticket introuvable' }, { status: 404 });
  }

  // Marquer tous les messages admin comme lus
  await admin
    .from('support_messages')
    .update({ client_read: true })
    .in('ticket_id', ownedTicketIds)
    .eq('author', 'admin')
    .eq('client_read', false);

  return NextResponse.json({ message: 'OK' });
}
