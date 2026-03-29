// ============================================================
// POST /api/auth/reset-password
//
// Génère un lien de réinitialisation de mot de passe via le
// client admin Supabase (service role), puis l'envoie par Resend.
//
// Stratégie du lien :
//   On utilise data.properties.hashed_token (et non action_link) pour
//   construire un lien direct vers notre app :
//     /auth/confirm?token_hash=XXX&type=recovery
//   Cela évite le détour par les serveurs Supabase (action_link), qui
//   redirige en PKCE sans paramètre `type`, ce qui faisait atterrir
//   l'utilisateur sur /dashboard au lieu de /reset-password.
//
//   Notre confirm route voit token_hash+type=recovery et redirige vers
//   /reset-password?token_hash=XXX&type=recovery, où verifyOtp est
//   appelé only au clic utilisateur (anti-scanner).
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createAdminClient } from '@/lib/supabase/admin';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { RESET_PASSWORD_SUBJECT, buildResetPasswordEmail } from '@/lib/emails/reset-password';
import { logEventForEmail } from '@/lib/actions/log-user-event';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = `Mon Syndic Bénévole <${process.env.EMAIL_FROM ?? 'noreply@mon-syndic-benevole.fr'}>`;

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'https://mon-syndic-benevole.fr';
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

    const { data, error } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email,
    });

    if (error || !data?.properties) {
      // Anti-enumération : on répond 200 même si le compte n'existe pas
      console.error('[reset-password] generateLink error:', error?.message);
      return NextResponse.json({ ok: true });
    }

    // Construire le lien directement vers notre app avec le token_hash,
    // en évitant le passage par les serveurs Supabase (action_link).
    const props = data.properties as { hashed_token?: string; action_link: string };
    const tokenHash = props.hashed_token;
    const resetLink = tokenHash
      ? `${getBaseUrl()}/auth/confirm?token_hash=${encodeURIComponent(tokenHash)}&type=recovery`
      : props.action_link; // fallback si hashed_token absent (ne devrait pas arriver)

    const { error: sendError } = await resend.emails.send({
      from: FROM,
      to: email,
      subject: RESET_PASSWORD_SUBJECT,
      html: buildResetPasswordEmail(resetLink),
    });

    if (sendError) {
      console.error('[reset-password] Resend error:', sendError.message);
      return NextResponse.json({ message: 'Erreur lors de l\'envoi de l\'e-mail. Réessayez.' }, { status: 500 });
    }

    // Log événement (après envoi réussi, fire-and-forget)
    void logEventForEmail({
      email,
      eventType: 'password_reset_requested',
      label: 'Réinitialisation de mot de passe demandée',
    }).catch(() => undefined);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[reset-password] unexpected error:', err);
    return NextResponse.json({ message: 'Une erreur serveur est survenue.' }, { status: 500 });
  }
}
