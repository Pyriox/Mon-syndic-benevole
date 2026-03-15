import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? 'onboarding@resend.dev';
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL ?? 'support@syndic-benevole.eu';

export async function POST(req: NextRequest) {
  // Validation basique de la source (Content-Type JSON)
  const contentType = req.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    return NextResponse.json({ message: 'Bad request' }, { status: 400 });
  }

  let body: { name?: string; email?: string; subject?: string; message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 });
  }

  const { name, email, subject, message } = body;

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
    </table>
    <h3 style="font-size:13px;font-weight:600;color:#6b7280;margin:0 0 10px;text-transform:uppercase;letter-spacing:.05em">Message</h3>
    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;font-size:14px;color:#374151;line-height:1.7;white-space:pre-wrap">${escapeHtml(message)}</div>
    <p style="margin-top:24px;font-size:12px;color:#9ca3af">
      Ce message a été envoyé depuis la page Aide &amp; Contact de Mon Syndic Bénévole.
    </p>
  </div>
</div>`;

  const { error } = await resend.emails.send({
    from: FROM,
    to: [SUPPORT_EMAIL],
    replyTo: email,
    subject: `[Contact] ${subject}`,
    html,
  });

  if (error) {
    console.error('[contact] Resend error:', error);
    return NextResponse.json({ message: 'Erreur envoi email' }, { status: 500 });
  }

  return NextResponse.json({ message: 'Envoyé' });
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
