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
import { trackResendSendResult } from '@/lib/email-delivery';
import { getCanonicalSiteUrl } from '@/lib/site-url';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM  = `Mon Syndic Bénévole <${process.env.EMAIL_FROM ?? 'noreply@mon-syndic-benevole.fr'}>`;
import { isAdminUser } from '@/lib/admin-config';
const SITE_URL = getCanonicalSiteUrl();

export async function POST(req: NextRequest) {
  // ── Auth : seul l'admin peut répondre ──
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const adminClient = createAdminClient();
  if (!user || !(await isAdminUser(user.id, adminClient))) {
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

  const subject = buildSupportReplyEmailSubject(ticket.subject);
  let emailWarning = false;

  try {
    const result = await resend.emails.send({
      from:    FROM,
      to:      [ticket.user_email],
      subject,
      html,
    });

    const tracked = await trackResendSendResult(result, {
      templateKey: 'support_reply',
      recipientEmail: ticket.user_email,
      subject,
      legalEventType: 'support_reply',
      legalReference: ticket.id,
      payload: { ticketId: ticket.id, adminUserId: user.id },
    });

    emailWarning = !tracked.ok;
    if (emailWarning) {
      console.error('[support/reply] Resend error:', tracked.errorMessage);
    }
  } catch (emailErr) {
    emailWarning = true;
    console.error('[support/reply] unexpected email error:', emailErr);
  }

  if (emailWarning) {
    // Le message est sauvegardé — on signale l'échec d'email à l'admin
    return NextResponse.json({ message: 'Réponse enregistrée (email non envoyé)', emailWarning: true });
  }

  return NextResponse.json({ message: 'Réponse envoyée' });
}
