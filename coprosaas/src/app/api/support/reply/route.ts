// ============================================================
// POST /api/support/reply — Réponse admin à un ticket support
// Réservé à l'admin : vérifie l'email admin avant d'agir
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import {
  buildSupportReplyEmail,
  buildSupportReplyEmailSubject,
} from '@/lib/emails/support-reply';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM  = `Mon Syndic Bénévole <${process.env.EMAIL_FROM ?? 'onboarding@resend.dev'}>`;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'tpn.fabien@gmail.com';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://mon-syndic-benevole.fr';

export async function POST(req: NextRequest) {
  // ── Auth : seul l'admin peut répondre ──
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email?.toLowerCase() !== ADMIN_EMAIL?.toLowerCase()) {
    return NextResponse.json({ message: 'Non autorisé' }, { status: 403 });
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
    return NextResponse.json({ message: 'Message trop long' }, { status: 422 });
  }

  const admin = createAdminClient();

  // Récupérer le ticket
  const { data: ticket, error: ticketErr } = await admin
    .from('support_tickets')
    .select('id, user_email, user_name, subject, status')
    .eq('id', ticketId.trim())
    .single();

  if (ticketErr || !ticket) {
    return NextResponse.json({ message: 'Ticket introuvable' }, { status: 404 });
  }

  // Insérer le message admin
  const { error: msgErr } = await admin.from('support_messages').insert({
    ticket_id: ticket.id,
    author:    'admin',
    content:   message.trim(),
  });
  if (msgErr) {
    console.error('[support/reply] insert message error:', msgErr);
    return NextResponse.json({ message: 'Erreur base de données' }, { status: 500 });
  }

  // Passer le ticket en 'en_cours' si encore ouvert
  if (ticket.status === 'ouvert') {
    await admin
      .from('support_tickets')
      .update({ status: 'en_cours' })
      .eq('id', ticket.id);
  }

  // Envoyer l'email de notification au client
  const ticketUrl = `${SITE_URL}/aide?ticket=${ticket.id}`;
  const html = buildSupportReplyEmail({
    userName:     ticket.user_name,
    subject:      ticket.subject,
    adminMessage: message.trim(),
    ticketUrl,
  });

  const { error: mailErr } = await resend.emails.send({
    from:    FROM,
    to:      [ticket.user_email],
    subject: buildSupportReplyEmailSubject(ticket.subject),
    html,
  });

  if (mailErr) {
    console.error('[support/reply] Resend error:', mailErr);
    // On continue — le message est sauvegardé même si l'email échoue
  }

  return NextResponse.json({ message: 'Réponse envoyée' });
}
