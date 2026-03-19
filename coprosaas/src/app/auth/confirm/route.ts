// ============================================================
// Route de confirmation Supabase (flux PKCE)
//
// Supabase redirige ici après que l'utilisateur a cliqué un lien
// d'email (confirmation d'inscription, réinitialisation de MDP,
// changement d'adresse email…).
//
// Params attendus (query string) :
//   token_hash  — token opaque fourni par Supabase
//   type        — 'signup' | 'recovery' | 'email_change' | …
//   next        — (optionnel) URL de redirection après succès
// ============================================================
import { type EmailOtpType } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type       = searchParams.get('type') as EmailOtpType | null;

  // Destination par défaut selon le type
  const defaultNext = type === 'recovery' ? '/reset-password' : '/dashboard';
  const next        = searchParams.get('next') ?? defaultNext;

  if (!token_hash || !type) {
    return NextResponse.redirect(new URL('/login?error=lien_invalide', request.url));
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
  const { error } = await supabase.auth.verifyOtp({ type, token_hash });

  if (error) {
    console.error('[auth/confirm] verifyOtp error:', error.message);
    return NextResponse.redirect(new URL('/login?error=lien_invalide', request.url));
  }

  return response;
}
