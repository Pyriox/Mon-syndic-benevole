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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type       = searchParams.get('type') as EmailOtpType | null;
  const code       = searchParams.get('code'); // flux PKCE

  // Destination par défaut selon le type
  const defaultNext = type === 'recovery' ? '/reset-password' : '/dashboard';
  const next        = searchParams.get('next') ?? defaultNext;

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

    // Après une confirmation d'inscription via PKCE, même auto-liaison que le flux token_hash
    if (type === 'signup' && data.user) {
      const { id: userId, email } = data.user;
      if (email) {
        try {
          const admin = createAdminClient();
          await admin
            .from('coproprietaires')
            .update({ user_id: userId })
            .eq('email', email.toLowerCase())
            .is('user_id', null);
          await admin
            .from('invitations')
            .update({ statut: 'acceptee' })
            .eq('email', email.toLowerCase())
            .eq('statut', 'en_attente');
        } catch (linkErr) {
          console.error('[auth/confirm] PKCE auto-link error:', linkErr);
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

  // Après une confirmation d'inscription, lier automatiquement l'utilisateur
  // à sa fiche coproprietaire (si une fiche avec ce même email existe sans user_id)
  if (type === 'signup' && data.user) {
    const { id: userId, email } = data.user;
    if (email) {
      try {
        const admin = createAdminClient();

        // 1. Lier toutes les fiches coproprietaires avec cet email et sans user_id
        await admin
          .from('coproprietaires')
          .update({ user_id: userId })
          .eq('email', email.toLowerCase())
          .is('user_id', null);

        // 2. Marquer les invitations en attente pour cet email comme acceptées
        await admin
          .from('invitations')
          .update({ statut: 'acceptee' })
          .eq('email', email.toLowerCase())
          .eq('statut', 'en_attente');
      } catch (linkErr) {
        // Non bloquant — l'utilisateur peut quand même accéder au dashboard
        console.error('[auth/confirm] auto-link error:', linkErr);
      }
    }
  }

  return response;
}
