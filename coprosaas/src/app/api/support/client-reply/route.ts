// ============================================================
// POST /api/support/client-reply — Réponse client dans un ticket
// Utilisateur authentifié uniquement, propriétaire du ticket
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  // Rate limit : 20 messages par IP par minute
  const ip = getClientIp(req);
  if (!await rateLimit(ip, 20, 60_000)) {
    return NextResponse.json({ message: 'Trop de tentatives. Réessayez dans une minute.' }, { status: 429 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });
  }

  let body: { ticketId?: string; message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 });
  }

  const { ticketId, message } = body;

  if (!ticketId?.trim() || !message?.trim()) {
    return NextResponse.json({ message: 'Champs manquants' }, { status: 422 });
  }
  if (message.length > 10000) {
    return NextResponse.json({ message: 'Message trop long (max 10 000 caractères)' }, { status: 422 });
  }

  const admin = createAdminClient();

  // Vérifier que le ticket appartient bien à cet utilisateur
  const { data: ticket, error: ticketErr } = await admin
    .from('support_tickets')
    .select('id, status')
    .eq('id', ticketId.trim())
    .eq('user_id', user.id)
    .single();

  if (ticketErr || !ticket) {
    return NextResponse.json({ message: 'Ticket introuvable' }, { status: 404 });
  }

  if (ticket.status === 'resolu') {
    return NextResponse.json({ message: 'Ce ticket est résolu, vous ne pouvez plus y répondre.' }, { status: 409 });
  }

  const { error: msgErr } = await admin.from('support_messages').insert({
    ticket_id:   ticket.id,
    author:      'client',
    content:     message.trim(),
    client_read: true,
  });

  if (msgErr) {
    return NextResponse.json({ message: 'Erreur base de données' }, { status: 500 });
  }

  // Repasser le ticket en 'en_cours' si résolu accidentellement (ne s'applique pas ici car bloqué au dessus, mais bonne pratique)
  if (ticket.status === 'ouvert') {
    // Laisse ouvert
  }

  return NextResponse.json({ message: 'Message envoyé' });
}
