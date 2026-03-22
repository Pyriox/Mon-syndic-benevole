// ============================================================
// POST /api/auth/reset-password
//
// Génère un lien de réinitialisation de mot de passe via le
// client admin Supabase (service role), puis l'envoie par Resend.
//
// Avantages vs supabase.auth.resetPasswordForEmail() côté client :
//   - Contourne la validation de l'allowlist "Redirect URLs" Supabase
//   - Permet de personnaliser le template email (Resend)
//   - Masque les erreurs internes à l'utilisateur (anti-enum)
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createAdminClient } from '@/lib/supabase/admin';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { RESET_PASSWORD_SUBJECT, buildResetPasswordEmail } from '@/lib/emails/reset-password';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = `Mon Syndic Bénévole <${process.env.EMAIL_FROM ?? 'onboarding@resend.dev'}>`;

// La page reset-password doit être dans l'allowlist Supabase OU on passe
// par generateLink (admin) qui n'a pas cette restriction.
// On utilise NEXT_PUBLIC_SITE_URL en priorité, sinon on reconstruit depuis VERCEL_URL.
function getRedirectTo(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return `${process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')}/auth/confirm`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}/auth/confirm`;
  }
  return 'https://mon-syndic-benevole.fr/auth/confirm';
}

export async function POST(req: NextRequest) {
  // Rate limiting : 3 demandes par IP par 10 minutes
  const ip = getClientIp(req);
  if (!await rateLimit(ip, 3, 600_000)) {
    return NextResponse.json({ message: 'Trop de tentatives. Réessayez dans 10 minutes.' }, { status: 429 });
  }

  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ message: 'Adresse email invalide.' }, { status: 400 });
  }

  try {
    const admin = createAdminClient();

    // generateLink avec le client admin (service role) ne valide PAS l'allowlist redirectTo
    const { data, error } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo: getRedirectTo() },
    });

    if (error || !data?.properties?.action_link) {
      // On ne révèle pas si l'email existe ou non (anti-enumération)
      console.error('[reset-password] generateLink error:', error?.message);
      // On répond 200 quand même pour ne pas révéler si le compte existe
      return NextResponse.json({ ok: true });
    }

    await resend.emails.send({
      from: FROM,
      to: email,
      subject: RESET_PASSWORD_SUBJECT,
      html: buildResetPasswordEmail(data.properties.action_link),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[reset-password] unexpected error:', err);
    return NextResponse.json({ message: 'Une erreur serveur est survenue.' }, { status: 500 });
  }
}
