// ============================================================
// POST /api/support/client-reply — Réponse client dans un ticket
// Utilisateur authentifié uniquement, propriétaire du ticket
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { h } from '@/lib/emails/base';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM          = `Mon Syndic Bénévole <${process.env.EMAIL_FROM ?? 'onboarding@resend.dev'}>`;
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL ?? 'contact@mon-syndic-benevole.fr';
const SITE_URL      = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.mon-syndic-benevole.fr';

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
  const adminHtml = `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1f2937">
  <div style="background:#1d4ed8;padding:24px 32px;border-radius:12px 12px 0 0">
    <h1 style="color:#ffffff;font-size:18px;margin:0">Nouvelle réponse client</h1>
    <p style="color:#bfdbfe;font-size:13px;margin:4px 0 0">Ticket support — Mon Syndic Bénévole</p>
  </div>
  <div style="background:#ffffff;padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;width:120px;color:#6b7280;font-size:13px;font-weight:600">Utilisateur</td>
        <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:14px;color:#111827">${h(ticket.user_name)} &lt;<a href="mailto:${h(ticket.user_email)}" style="color:#2563eb">${h(ticket.user_email)}</a>&gt;</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#6b7280;font-size:13px;font-weight:600">Sujet</td>
        <td style="padding:8px 0;font-size:14px;color:#111827">${h(ticket.subject)}</td>
      </tr>
    </table>
    <h3 style="font-size:13px;font-weight:600;color:#6b7280;margin:0 0 10px;text-transform:uppercase;letter-spacing:.05em">Message</h3>
    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;font-size:14px;color:#374151;line-height:1.7;white-space:pre-wrap">${h(message.trim())}</div>
    <div style="margin-top:24px">
      <a href="${ticketUrl}" style="display:inline-block;background:#1d4ed8;color:#ffffff;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;text-decoration:none">Voir le ticket</a>
    </div>
  </div>
</div>`;

  resend.emails.send({
    from:    FROM,
    to:      [SUPPORT_EMAIL],
    subject: `[Support] Réponse client — ${ticket.subject}`,
    html:    adminHtml,
  }).catch((err) => console.error('[client-reply] admin notification error:', err));

  return NextResponse.json({ message: 'Message envoyé' });
}
