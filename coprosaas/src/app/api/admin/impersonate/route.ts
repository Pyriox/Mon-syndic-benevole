// ============================================================
// API Admin — génération de lien magique pour impersonation
// POST /api/admin/impersonate  { email }
// Retourne { link } — lien de connexion à usage unique (15 min)
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAdminUser } from '@/lib/admin-config';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const admin = createAdminClient();
  if (!user || !(await isAdminUser(user.id, admin))) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const body = await request.json() as { email?: string };
  const { email } = body;

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email invalide' }, { status: 400 });
  }

  // Empêcher l'impersonation d'un autre administrateur
  const { data: { users: allUsers } } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const targetUser = allUsers.find((u) => u.email?.toLowerCase() === email.trim().toLowerCase());
  if (targetUser && await isAdminUser(targetUser.id, admin)) {
    return NextResponse.json({ error: 'Email invalide ou protégé' }, { status: 400 });
  }

  const baseUrl = request.nextUrl.origin;
  const { data, error } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: {
      redirectTo: `${baseUrl}/auth/confirm?next=/dashboard`,
    },
  });

  if (error || !data?.properties?.hashed_token) {
    return NextResponse.json(
      { error: error?.message ?? 'Impossible de générer le lien' },
      { status: 500 }
    );
  }

  // On contourne le flux PKCE en pointant directement vers /auth/confirm
  // avec le token_hash. L'action_link passe par supabase.co/auth/v1/verify
  // qui redirige ensuite avec ?code= (PKCE) — mais ce code nécessite un
  // code_verifier dans les cookies du navigateur, absent ici (lien serveur).
  const confirmLink =
    `${baseUrl}/auth/confirm?token_hash=${encodeURIComponent(data.properties.hashed_token)}&type=magiclink&next=/dashboard`;

  return NextResponse.json({ link: confirmLink });
}
