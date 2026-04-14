import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { trackResendSendResult } from '@/lib/email-delivery';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = `Mon Syndic Bénévole <${process.env.EMAIL_FROM ?? 'contact@mon-syndic-benevole.fr'}>`;
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL ?? 'contact@mon-syndic-benevole.fr';
const COPRO_TECHNICAL_TOPICS = new Set([
  'probleme de connexion',
  'invitation ou e-mail non recu',
  'document ou avis inaccessible',
  'bug sur mon espace',
  'autre probleme technique',
]);

export async function POST(req: NextRequest) {
  // Validation basique de la source (Content-Type JSON)
  const contentType = req.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    return NextResponse.json({ message: 'Bad request' }, { status: 400 });
  }

  // Rate limiting : 5 messages par IP par minute
  const ip = getClientIp(req);
  if (!await rateLimit(ip, 5, 60_000)) {
    return NextResponse.json({ message: 'Trop de tentatives. Réessayez dans une minute.' }, { status: 429 });
  }

  let body: {
    name?: string;
    email?: string;
    subject?: string;
    message?: string;
    userId?: string;
    supportRole?: string;
    supportTopic?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 });
  }

  const { name, email, subject, message, userId, supportRole, supportTopic } = body;

  // Validation des champs obligatoires
  if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
    return NextResponse.json({ message: 'Champs manquants' }, { status: 422 });
  }

  // Validation basique de l'email (évite l'injection d'en-têtes)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ message: 'Email invalide' }, { status: 422 });
  }

  // Limitation de longueur pour éviter les abus
  if (name.length > 200 || subject.length > 500 || message.length > 5000) {
    return NextResponse.json({ message: 'Contenu trop long' }, { status: 422 });
  }

  const normalizedSupportRole = normalizeSupportRole(supportRole);
  const normalizedSupportTopic = normalizeSupportTopic(supportTopic);

  let authenticatedUserId: string | null = null;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    authenticatedUserId = user?.id ?? null;
  } catch {
    authenticatedUserId = null;
  }

  let effectiveSupportRole = normalizedSupportRole;
  if (authenticatedUserId) {
    try {
      const admin = createAdminClient();
      const [{ data: syndicAccess }, { data: coproAccess }] = await Promise.all([
        admin.from('coproprietes').select('id').eq('syndic_id', authenticatedUserId).maybeSingle(),
        admin.from('coproprietaires').select('id').eq('user_id', authenticatedUserId).maybeSingle(),
      ]);

      const hasSyndicAccess = Boolean(syndicAccess);
      const hasCoproAccess = Boolean(coproAccess);

      if (normalizedSupportRole === 'coproprietaire' && hasCoproAccess) {
        effectiveSupportRole = 'coproprietaire';
      } else if (normalizedSupportRole === 'syndic' && hasSyndicAccess) {
        effectiveSupportRole = 'syndic';
      } else if (!hasSyndicAccess && hasCoproAccess) {
        effectiveSupportRole = 'coproprietaire';
      } else if (hasSyndicAccess) {
        effectiveSupportRole = 'syndic';
      }
    } catch (roleErr) {
      console.warn('[contact] role detection error:', roleErr);
    }
  }

  const resolvedUserId = authenticatedUserId;

  if (effectiveSupportRole === 'coproprietaire' && !COPRO_TECHNICAL_TOPICS.has(normalizedSupportTopic)) {
    return NextResponse.json({
      message: 'Le support copropriétaire traite uniquement les problèmes techniques. Pour toute question sur votre solde, vos charges ou vos appels de fonds, contactez votre syndic.',
    }, { status: 422 });
  }

  const supportContextLabel = effectiveSupportRole === 'coproprietaire'
    ? 'Copropriétaire · support technique'
    : 'Syndic / contact général';

  const html = `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1f2937">
  <div style="background:#2563eb;padding:24px 32px;border-radius:12px 12px 0 0">
    <h1 style="color:#ffffff;font-size:20px;margin:0">Nouveau message de contact</h1>
    <p style="color:#bfdbfe;font-size:13px;margin:4px 0 0">Mon Syndic Bénévole</p>
  </div>
  <div style="background:#ffffff;padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;width:120px;color:#6b7280;font-size:13px;font-weight:600">Nom</td>
        <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:14px;color:#111827">${escapeHtml(name)}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:13px;font-weight:600">Email</td>
        <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:14px;color:#2563eb">
          <a href="mailto:${escapeHtml(email)}" style="color:#2563eb">${escapeHtml(email)}</a>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#6b7280;font-size:13px;font-weight:600">Sujet</td>
        <td style="padding:8px 0;font-size:14px;color:#111827">${escapeHtml(subject)}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-top:1px solid #f3f4f6;color:#6b7280;font-size:13px;font-weight:600">Contexte</td>
        <td style="padding:8px 0;border-top:1px solid #f3f4f6;font-size:14px;color:#111827">${escapeHtml(supportContextLabel)}</td>
      </tr>
    </table>
    <h3 style="font-size:13px;font-weight:600;color:#6b7280;margin:0 0 10px;text-transform:uppercase;letter-spacing:.05em">Message</h3>
    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;font-size:14px;color:#374151;line-height:1.7">${escapeHtml(message).replace(/\n/g, '<br>')}</div>
    <p style="margin-top:24px;font-size:12px;color:#9ca3af">
      Ce message a été envoyé depuis la page Aide &amp; Contact de Mon Syndic Bénévole.
    </p>
  </div>
</div>`;

  const subjectLine = `[Contact] ${subject}`;
  let emailWarning = false;

  try {
    const result = await resend.emails.send({
      from: FROM,
      to: [SUPPORT_EMAIL],
      replyTo: email,
      subject: subjectLine,
      html,
    });

    const tracked = await trackResendSendResult(result, {
      templateKey: 'contact_notification',
      recipientEmail: SUPPORT_EMAIL,
      subject: subjectLine,
      legalEventType: 'contact_notification',
      legalReference: email.trim().toLowerCase(),
      payload: {
        fromEmail: email.trim().toLowerCase(),
        fromName: name.trim(),
        userId: resolvedUserId,
      },
    });

    emailWarning = !tracked.ok;
    if (emailWarning) {
      console.error('[contact] Resend error:', tracked.errorMessage);
    }
  } catch (emailErr) {
    emailWarning = true;
    console.error('[contact] unexpected email error:', emailErr);
  }

  // ── Persister le ticket en base (best-effort, non bloquant) ──
  let ticketId: string | null = null;
  try {
    const admin = createAdminClient();

    const { data: ticket } = await admin
      .from('support_tickets')
      .insert({
        user_id:    resolvedUserId,
        user_email: email.trim().toLowerCase(),
        user_name:  name.trim(),
        subject:    subject.trim(),
        status:     'ouvert',
      })
      .select('id')
      .single();

    if (ticket?.id) {
      ticketId = ticket.id;
      await admin.from('support_messages').insert({
        ticket_id:   ticket.id,
        author:      'client',
        content:     message.trim(),
        client_read: true,
      });
      await Promise.resolve(
        admin.from('user_events').insert({
          user_email: email.trim().toLowerCase(),
          event_type: 'ticket_created',
          label:      `Ticket ouvert — ${subject.trim()}`,
        }),
      ).catch((e: Error) => console.warn('[contact] logUserEvent error:', e?.message));
    }
  } catch (dbErr) {
    console.error('[contact] DB persist error:', dbErr);
  }

  if (!ticketId && emailWarning) {
    return NextResponse.json({ message: 'Erreur lors de l’envoi au support.' }, { status: 500 });
  }

  return NextResponse.json({ message: 'Envoyé', ticketId, emailWarning });
}

/** Échappe les caractères HTML pour éviter les injections dans le corps du mail */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeSupportRole(value: string | undefined): 'syndic' | 'coproprietaire' | null {
  const normalized = normalizeSupportTopic(value);
  if (normalized === 'syndic') return 'syndic';
  if (normalized === 'coproprietaire') return 'coproprietaire';
  return null;
}

function normalizeSupportTopic(value: string | undefined): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}
