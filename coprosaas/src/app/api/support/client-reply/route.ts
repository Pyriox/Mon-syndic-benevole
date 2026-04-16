// ============================================================
// POST /api/support/client-reply — Réponse client dans un ticket
// Utilisateur authentifié uniquement, propriétaire du ticket
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { h, wrapEmail, ctaButton, infoTable, infoRow, COLOR } from '@/lib/emails/base';
import { trackResendSendResult } from '@/lib/email-delivery';
import { getCanonicalSiteUrl } from '@/lib/site-url';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM          = `Mon Syndic Bénévole <${process.env.EMAIL_FROM ?? 'contact@mon-syndic-benevole.fr'}>`;
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL ?? 'contact@mon-syndic-benevole.fr';
const SITE_URL      = getCanonicalSiteUrl();

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
    .select('id, status, user_name, user_email, subject')
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

  // Notifier l'admin par email (best-effort)
  const ticketUrl = `${SITE_URL}/admin/support?ticket=${ticket.id}`;
  const adminHtml = wrapEmail(`
<h1 style="margin:0 0 6px;font-size:20px;font-weight:700;color:${COLOR.text}">Nouvelle réponse client</h1>
<p style="margin:0 0 20px;font-size:13px;color:${COLOR.muted}">${h(ticket.subject)}</p>

${infoTable(
  infoRow('Utilisateur', `${h(ticket.user_name)} &lt;<a href="mailto:${h(ticket.user_email)}" style="color:${COLOR.blue};text-decoration:none">${h(ticket.user_email)}</a>&gt;`) +
  infoRow('Sujet', h(ticket.subject))
)}

<p style="margin:0 0 10px;font-size:13px;font-weight:700;color:${COLOR.text}">Message</p>
<div style="background:#f9fafb;border:1px solid ${COLOR.border};border-radius:8px;padding:16px;font-size:14px;color:#374151;line-height:1.7">${h(message.trim()).replace(/\n/g, '<br>')}</div>

${ctaButton('Ouvrir la conversation →', ticketUrl, COLOR.blue)}`,
  COLOR.blue,
  'Nouvelle réponse client sur une demande de support',
);

  const subject = `Support — nouvelle réponse client — ${ticket.subject} — Mon Syndic Bénévole`;
  resend.emails.send({
    from:    FROM,
    to:      [SUPPORT_EMAIL],
    subject,
    html:    adminHtml,
  }).then((result) => trackResendSendResult(result, {
    templateKey: 'support_client_reply_notification',
    recipientEmail: SUPPORT_EMAIL,
    subject,
    legalEventType: 'support_client_reply_notification',
    legalReference: ticket.id,
    payload: { ticketId: ticket.id, userId: user.id, fromEmail: ticket.user_email },
  })).catch((err) => console.error('[client-reply] admin notification error:', err));

  return NextResponse.json({ message: 'Message envoyé' });
}
