import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? 'noreply@mon-syndic-benevole.fr';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.mon-syndic-benevole.fr';

// ── Templates ────────────────────────────────────────────────

function passwordChangedHtml(): string {
  return `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1f2937">
  <div style="background:#2563eb;padding:24px 32px;border-radius:12px 12px 0 0">
    <h1 style="color:#fff;margin:0;font-size:20px">Mot de passe modifié</h1>
    <p style="color:#bfdbfe;margin:6px 0 0">Mon Syndic Bénévole</p>
  </div>
  <div style="background:#fff;padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
    <p>Votre mot de passe a été modifié avec succès.</p>
    <div style="background:#f0f9ff;border-left:4px solid #2563eb;padding:16px;border-radius:0 8px 8px 0;margin:20px 0">
      <p style="margin:0;font-size:14px">
        🔒 <strong>Si vous êtes à l'origine de ce changement</strong>, aucune action n'est requise.
      </p>
      <p style="margin:10px 0 0;font-size:14px">
        ⚠️ <strong>Si vous n'avez pas effectué cette modification</strong>, votre compte est peut-être compromis.
        Contactez-nous immédiatement à
        <a href="mailto:contact@mon-syndic-benevole.fr" style="color:#2563eb">contact@mon-syndic-benevole.fr</a>.
      </p>
    </div>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
    <p style="font-size:12px;color:#9ca3af">
      Mon Syndic Bénévole —
      <a href="${SITE_URL}" style="color:#2563eb">mon-syndic-benevole.fr</a>
    </p>
  </div>
</div>`;
}

function emailChangeRequestedHtml(newEmail: string): string {
  return `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1f2937">
  <div style="background:#7c3aed;padding:24px 32px;border-radius:12px 12px 0 0">
    <h1 style="color:#fff;margin:0;font-size:20px">Demande de changement d'adresse e-mail</h1>
    <p style="color:#ddd6fe;margin:6px 0 0">Mon Syndic Bénévole</p>
  </div>
  <div style="background:#fff;padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
    <p>Une demande de changement d'adresse e-mail a été effectuée sur votre compte.</p>
    <div style="background:#faf5ff;border-left:4px solid #7c3aed;padding:16px;border-radius:0 8px 8px 0;margin:20px 0">
      <p style="margin:0;font-size:14px">
        📧 <strong>Nouvelle adresse demandée :</strong> ${newEmail}
      </p>
      <p style="margin:10px 0 0;font-size:14px;color:#6b7280">
        Un lien de confirmation a été envoyé à cette adresse. Le changement sera effectif uniquement après validation.
      </p>
    </div>
    <p style="font-size:14px;color:#374151">
      Si vous n'avez pas fait cette demande, ignorez ce message — votre adresse e-mail actuelle reste inchangée tant que le lien n'est pas validé.
    </p>
    <p style="font-size:14px;color:#374151">
      En cas de doute, contactez-nous à
      <a href="mailto:contact@mon-syndic-benevole.fr" style="color:#7c3aed">contact@mon-syndic-benevole.fr</a>.
    </p>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
    <p style="font-size:12px;color:#9ca3af">
      Mon Syndic Bénévole —
      <a href="${SITE_URL}" style="color:#7c3aed">mon-syndic-benevole.fr</a>
    </p>
  </div>
</div>`;
}

// ── Route handler ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Vérification du type de contenu
  const contentType = req.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    return NextResponse.json({ message: 'Bad request' }, { status: 400 });
  }

  let body: { type?: string; newEmail?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 });
  }

  const { type, newEmail } = body;
  if (type !== 'password_changed' && type !== 'email_change_requested') {
    return NextResponse.json({ message: 'Type invalide' }, { status: 422 });
  }
  if (type === 'email_change_requested' && !newEmail) {
    return NextResponse.json({ message: 'newEmail manquant' }, { status: 422 });
  }

  // Vérification de la session
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) {
    return NextResponse.json({ message: 'Non authentifié' }, { status: 401 });
  }

  const toEmail = user.email; // toujours envoyé à l'adresse actuelle (avant changement)

  const { error } = await resend.emails.send({
    from: FROM,
    to: toEmail,
    subject: type === 'password_changed'
      ? 'Votre mot de passe Mon Syndic Bénévole a été modifié'
      : "Demande de changement d'adresse e-mail — Mon Syndic Bénévole",
    html: type === 'password_changed'
      ? passwordChangedHtml()
      : emailChangeRequestedHtml(newEmail!),
  });

  if (error) {
    console.error('[send-security-email] Resend error:', error);
    // On ne bloque pas l'UX si l'e-mail échoue
    return NextResponse.json({ message: 'Erreur envoi email' }, { status: 500 });
  }

  return NextResponse.json({ message: 'Email envoyé' });
}
