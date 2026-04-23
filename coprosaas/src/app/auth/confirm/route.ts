// ============================================================
// Route de confirmation Supabase
//
// Supabase redirige ici après que l'utilisateur a cliqué un lien
// d'email (confirmation d'inscription, réinitialisation de MDP,
// changement d'adresse email…).
//
// Deux flux possibles selon le template email configuré :
//
// 1. Flux PKCE (template par défaut — {{ .ConfirmationURL }}) :
//    Supabase vérifie le token sur ses serveurs, puis redirige ici
//    avec ?code=AUTH_CODE&type=<type>. On échange le code contre
//    une session via exchangeCodeForSession().
//
// 2. Flux token_hash (template personnalisé) :
//    Le lien pointe directement ici avec ?token_hash=...&type=...
//    Pour les réinitialisations de MDP, on délègue verifyOtp au
//    navigateur (anti-scanner) ; pour les autres types, on l'effectue
//    côté serveur.
// ============================================================
import { type EmailOtpType } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createAdminClient } from '@/lib/supabase/admin';
import { Resend } from 'resend';
import { buildWelcomeEmail, buildWelcomeSubject } from '@/lib/emails/welcome';
import { trackResendSendResult } from '@/lib/email-delivery';
import { getCanonicalSiteUrl } from '@/lib/site-url';
import { getSafeAuthRedirectPath, shouldRunSignupFollowups } from '@/lib/auth-confirmation';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = `Mon Syndic Bénévole <${process.env.EMAIL_FROM ?? 'noreply@mon-syndic-benevole.fr'}>`;
const SITE_URL = getCanonicalSiteUrl();

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function getFirstName(fullName: unknown): string | null {
  if (typeof fullName !== 'string') return null;
  const value = fullName.trim();
  if (!value) return null;
  return value.split(' ')[0] ?? null;
}

async function getSignupFollowupState(
  admin: ReturnType<typeof createAdminClient>,
  email: string,
): Promise<{
  hasAccountConfirmedEvent: boolean;
  hasWelcomeEmailDelivery: boolean;
}> {
  const normalizedEmail = normalizeEmail(email);

  const [eventQuery, deliveryQuery] = await Promise.all([
    admin
      .from('user_events')
      .select('id', { count: 'exact', head: true })
      .eq('user_email', normalizedEmail)
      .eq('event_type', 'account_confirmed'),
    admin
      .from('email_deliveries')
      .select('id', { count: 'exact', head: true })
      .eq('recipient_email', normalizedEmail)
      .eq('template_key', 'welcome')
      .in('status', ['sent', 'delivered', 'opened', 'clicked']),
  ]);

  return {
    hasAccountConfirmedEvent: (eventQuery.count ?? 0) > 0,
    hasWelcomeEmailDelivery: (deliveryQuery.count ?? 0) > 0,
  };
}

async function sendWelcomeEmail(params: {
  email: string;
  prenom: string | null;
  flow: 'PKCE' | 'token_hash';
  userId?: string | null;
}): Promise<void> {
  const { email, prenom, flow, userId } = params;
  const normalizedEmail = normalizeEmail(email);

  const subject = buildWelcomeSubject();

  const result = await resend.emails.send({
    from: FROM,
    to: normalizedEmail,
    subject,
    html: buildWelcomeEmail({ prenom, dashboardUrl: `${SITE_URL}/dashboard` }),
  });

  const tracked = await trackResendSendResult(result, {
    templateKey: 'welcome',
    recipientEmail: normalizedEmail,
    recipientUserId: userId ?? null,
    subject,
    legalEventType: 'welcome_email',
    legalReference: normalizedEmail,
    payload: { flow },
  });

  if (!tracked.ok) {
    throw new Error(`[${flow}] ${tracked.errorMessage}`);
  }
}

async function logAccountConfirmed(
  admin: ReturnType<typeof createAdminClient>,
  email: string,
  userId?: string | null,
): Promise<void> {
  await admin.from('user_events').insert({
    user_id: userId ?? null,
    user_email: normalizeEmail(email),
    event_type: 'account_confirmed',
    label: 'Compte confirmé',
  });
}

async function runSignupFollowups(params: {
  email: string;
  prenom: string | null;
  flow: 'PKCE' | 'token_hash';
  userId: string;
  emailConfirmedAt?: string | null;
}): Promise<void> {
  const { email, prenom, flow, userId, emailConfirmedAt } = params;
  const normalizedEmail = normalizeEmail(email);
  const admin = createAdminClient();

  await Promise.all([
    admin
      .from('coproprietaires')
      .update({ user_id: userId })
      .eq('email', normalizedEmail)
      .is('user_id', null),
    admin
      .from('invitations')
      .update({ statut: 'acceptee' })
      .eq('email', normalizedEmail)
      .eq('statut', 'en_attente'),
  ]);

  const { hasAccountConfirmedEvent, hasWelcomeEmailDelivery } = await getSignupFollowupState(admin, normalizedEmail);

  if (!shouldRunSignupFollowups({
    flow: flow === 'PKCE' ? 'pkce' : 'token_hash',
    emailConfirmedAt,
    hasAccountConfirmedEvent,
    hasWelcomeEmailDelivery,
  })) {
    return;
  }

  if (!hasAccountConfirmedEvent) {
    await logAccountConfirmed(admin, normalizedEmail, userId).catch((e: Error) => {
      console.warn('[auth/confirm] logAccountConfirmed error:', e?.message);
    });
  }

  if (!hasWelcomeEmailDelivery) {
    await sendWelcomeEmail({ email: normalizedEmail, prenom, flow, userId });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type       = searchParams.get('type') as EmailOtpType | null;
  const code       = searchParams.get('code'); // flux PKCE

  // Destination par défaut selon le type
  const defaultNext = type === 'recovery' ? '/reset-password' : '/dashboard';
  const next        = getSafeAuthRedirectPath(searchParams.get('next'), defaultNext);

  // ── Flux PKCE : échange du code d'autorisation ──────────────────────
  // Supabase redirige ici avec ?code=AUTH_CODE après avoir vérifié le
  // token OTP sur ses serveurs (template {{ .ConfirmationURL }}).
  // Le code_verifier est dans les cookies du navigateur (@supabase/ssr).
  if (code) {
    const successUrl = new URL(next, request.url);
    const response   = NextResponse.redirect(successUrl);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error('[auth/confirm] exchangeCodeForSession error:', error.message);
      return NextResponse.redirect(new URL('/login?error=lien_invalide', request.url));
    }

    // Les follow-ups d'inscription (liaison invitation, log account_confirmed,
    // e-mail de bienvenue) sont désormais idempotents et basés sur l'historique réel,
    // plutôt que sur une fenêtre temporelle fragile de 2 minutes.
    if (data.user) {
      const { id: userId, email } = data.user;
      if (email) {
        try {
          const prenom = getFirstName(data.user.user_metadata?.full_name);
          await runSignupFollowups({
            email,
            prenom,
            flow: 'PKCE',
            userId,
            emailConfirmedAt: data.user.email_confirmed_at ?? null,
          });
        } catch (linkErr) {
          console.error('[auth/confirm] PKCE signup follow-up error:', linkErr);
        }
      }
    }

    return response;
  }

  if (!token_hash || !type) {
    return NextResponse.redirect(new URL('/login?error=lien_invalide', request.url));
  }

  // Cas particulier : réinitialisation du mot de passe
  // On passe le token_hash au client (page reset-password) plutôt que de l'échanger
  // ici côté serveur. Certains clients mail (Gmail, Outlook…) pre-fetchent les liens
  // pour analyser le contenu — ce qui consommerait le token OTP à usage unique avant
  // que l'utilisateur ne clique. En déléguant verifyOtp au navigateur, on évite ce problème.
  if (type === 'recovery') {
    const resetUrl = new URL('/reset-password', request.url);
    resetUrl.searchParams.set('token_hash', token_hash);
    resetUrl.searchParams.set('type', type);
    return NextResponse.redirect(resetUrl);
  }

  // Pré-création de la réponse de redirection pour pouvoir y attacher les cookies
  const successUrl  = new URL(next, request.url);
  const response    = NextResponse.redirect(successUrl);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Les cookies de session sont posés sur la réponse de redirection
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Échange du token contre une session active
  const { data, error } = await supabase.auth.verifyOtp({ type, token_hash });

  if (error) {
    console.error('[auth/confirm] verifyOtp error:', error.message);
    // Pour une confirmation d'inscription, Supabase confirme le compte en DB
    // même si notre échange de token échoue (token déjà utilisé, délai, etc.).
    // On redirige vers /login avec un message positif plutôt qu'une erreur.
    if (type === 'signup' || type === 'email_change') {
      return NextResponse.redirect(new URL('/login?compte=active', request.url));
    }
    return NextResponse.redirect(new URL('/login?error=lien_invalide', request.url));
  }

  // Après une confirmation d'inscription, on applique les follow-ups de manière
  // idempotente : liaison invitation, log account_confirmed et e-mail de bienvenue.
  if (type === 'signup' && data.user) {
    const { id: userId, email } = data.user;
    if (email) {
      try {
        const prenom = getFirstName(data.user.user_metadata?.full_name);
        await runSignupFollowups({
          email,
          prenom,
          flow: 'token_hash',
          userId,
          emailConfirmedAt: data.user.email_confirmed_at ?? null,
        });
      } catch (linkErr) {
        // Non bloquant — l'utilisateur peut quand même accéder au dashboard
        console.error('[auth/confirm] auto-link error:', linkErr);
      }
    }
  }

  return response;
}
