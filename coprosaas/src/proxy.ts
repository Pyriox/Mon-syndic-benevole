// ============================================================
// Proxy Next.js — Protection des routes authentifiees
// Tout acces a /dashboard/* et les modules necessite une session active
// ============================================================
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { isAdminUser } from '@/lib/admin-config';

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // Creation du client Supabase dans le proxy (avec gestion des cookies)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Met a jour les cookies dans la requete et la reponse
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

  // Lecture de session cote proxy (plus rapide que getUser pour le routage)
  // La validation stricte de l'utilisateur reste faite cote serveur dans le layout protege.
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  const pathname = request.nextUrl.pathname;

  // Route /admin : reservee exclusivement a l'administrateur
  if (pathname.startsWith('/admin')) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
    if (!(await isAdminUser(user.id, supabase))) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
  }

  // Routes protegees : redirige vers /login si non connecte
  const protectedRoutes = [
    '/dashboard',
    '/coproprietes',
    '/coproprietaires',
    '/depenses',
    '/appels-de-fonds',
    '/documents',
    '/assemblees',
    '/incidents',
    '/lots',
    '/profil',
    '/abonnement',
    '/aide',
  ];

  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));

  if (isProtected && !user) {
    // Redirige vers la page de connexion
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Si deja connecte et tente d'acceder au login/register, redirige vers le dashboard.
  // Exception : on laisse passer /register?token=... pour permettre l'acceptation
  // d'une invitation copropriétaire par un compte déjà existant.
  const isInvitationRegister = pathname === '/register' && request.nextUrl.searchParams.has('token');
  if ((pathname === '/login' || (pathname === '/register' && !isInvitationRegister)) && user) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

// Definit les routes sur lesquelles le proxy s'execute
// On exclut volontairement la landing page et les assets statiques pour eviter
// un aller-retour reseau vers Supabase sur chaque requete publique.
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
    '/lots/:path*',
    '/profil/:path*',
    '/abonnement/:path*',
    '/aide/:path*',
    '/admin/:path*',
    '/login',
    '/register',
    '/reset-password',
  ],
};