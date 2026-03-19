import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Resend } from 'resend';
import { wrapEmail, h, alertBanner, infoTable, infoRow, COLOR, CONTACT_EMAIL, SITE_URL } from '@/lib/emails/base';
import { rateLimit } from '@/lib/rate-limit';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? 'noreply@mon-syndic-benevole.fr';

// ── Templates ────────────────────────────────────────────────

function passwordChangedHtml(): string {
  const content = `
<h1 style="margin:0 0 20px;font-size:20px;font-weight:700;color:${COLOR.text}">Mot de passe modifié</h1>

<p style="margin:0 0 16px;font-size:14px;color:${COLOR.text};line-height:1.6">
  Votre mot de passe a été modifié avec succès.
</p>

${alertBanner(
  `Si vous n'êtes pas à l'origine de ce changement, contactez-nous immédiatement à <a href="mailto:${CONTACT_EMAIL}" style="color:${COLOR.red}">${CONTACT_EMAIL}</a>.`,
  COLOR.red, '#fff5f5'
)}

<p style="margin:0;font-size:13px;color:${COLOR.muted}">Si c'est bien vous, aucune action n'est requise.</p>`;

  return wrapEmail(content, COLOR.blue);
}

function emailChangeRequestedHtml(newEmail: string): string {
  const content = `
<h1 style="margin:0 0 20px;font-size:20px;font-weight:700;color:${COLOR.text}">Changement d'adresse e-mail</h1>

<p style="margin:0 0 16px;font-size:14px;color:${COLOR.text};line-height:1.6">
  Une demande de changement d'adresse e-mail a été effectuée sur votre compte.
</p>

${infoTable(infoRow('Nouvelle adresse demandée', h(newEmail)))}

<p style="margin:0 0 12px;font-size:14px;color:${COLOR.text};line-height:1.6">
  Un lien de confirmation a été envoyé à cette adresse. Le changement ne sera effectif qu'après validation.
</p>

<p style="margin:0;font-size:13px;color:${COLOR.muted}">
  Si vous n'avez pas fait cette demande, ignorez ce message — votre adresse actuelle reste inchangée.
</p>`;

  return wrapEmail(content, COLOR.blue);
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

  // Rate limiting : 5 emails de sécurité par utilisateur par heure
  if (!rateLimit(user.id, 5, 3_600_000)) {
    return NextResponse.json({ message: 'Trop de tentatives. Réessayez dans une heure.' }, { status: 429 });
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
