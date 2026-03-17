// ============================================================
// Middleware Next.js — Protection des routes authentifiées
// Tout accès à /dashboard/* et les modules nécessite une session active
// ============================================================
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // Création du client Supabase dans le middleware (avec gestion des cookies)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Met à jour les cookies dans la requête et la réponse
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Récupération de l'utilisateur courant (rafraîchit le token si besoin)
  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Route /admin : réservée exclusivement à l'administrateur
  const ADMIN_EMAIL = 'tpn.fabien@gmail.com';
  if (pathname.startsWith('/admin')) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
    if (user.email !== ADMIN_EMAIL) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
  }

  // Routes protégées : redirige vers /login si non connecté
  const protectedRoutes = [
    '/dashboard',
    '/coproprietes',
    '/coproprietaires',
    '/depenses',
    '/appels-de-fonds',
    '/documents',
    '/assemblees',
    '/incidents',
  ];

  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));

  if (isProtected && !user) {
    // Redirige vers la page de connexion
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Si déjà connecté et tente d'accéder au login/register, redirige vers le dashboard
  if ((pathname === '/login' || pathname === '/register') && user) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

// Définit les routes sur lesquelles le middleware s'exécute
// On exclut volontairement la landing page et les assets statiques pour éviter
// un aller-retour réseau vers Supabase sur chaque requête publique.
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/coproprietes/:path*',
    '/coproprietaires/:path*',
    '/depenses/:path*',
    '/appels-de-fonds/:path*',
    '/documents/:path*',
    '/assemblees/:path*',
    '/incidents/:path*',
    '/profil/:path*',
    '/abonnement/:path*',
    '/aide/:path*',
    '/admin/:path*',
    '/login',
    '/register',
    '/reset-password',
  ],
};
