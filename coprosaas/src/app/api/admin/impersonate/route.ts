// ============================================================
// API Admin — génération de lien magique pour impersonation
// POST /api/admin/impersonate  { email }
// Retourne { link } — lien de connexion à usage unique (15 min)
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAdminUser } from '@/lib/admin-config';
import { getClientIp, rateLimit } from '@/lib/rate-limit';
import { logAdminAction } from '@/lib/actions/log-user-event';

async function findUserIdByEmail(admin: ReturnType<typeof createAdminClient>, email: string): Promise<string | null> {
  const perPage = 200;
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) break;
    const users = data.users ?? [];
    const found = users.find((u) => u.email?.toLowerCase() === email);
    if (found) return found.id;
    if (users.length < perPage) break;
  }
  return null;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const admin = createAdminClient();
  if (!user || !(await isAdminUser(user.id, admin))) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const body = await request.json() as { email?: string };
  const normalizedEmail = body.email?.trim().toLowerCase();

  if (!normalizedEmail) {
    return NextResponse.json({ error: 'Email invalide' }, { status: 400 });
  }

  const ip = getClientIp(request);
  if (!await rateLimit(`admin-impersonate:${user.id}:${ip}`, 10, 10 * 60_000)) {
    return NextResponse.json({ error: 'Trop de tentatives. Réessayez dans 10 minutes.' }, { status: 429 });
  }

  // Empêcher l'impersonation d'un autre administrateur
  const targetUserId = await findUserIdByEmail(admin, normalizedEmail);
  if (targetUserId && await isAdminUser(targetUserId, admin)) {
    return NextResponse.json({ error: 'Email invalide ou protégé' }, { status: 400 });
  }

  const baseUrl = request.nextUrl.origin;
  const { data, error } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: normalizedEmail,
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

  void logAdminAction({
    adminEmail: user.email ?? '',
    eventType: 'admin_impersonation_link_created',
    label: `Lien d'impersonation généré pour ${normalizedEmail}`,
    metadata: { targetEmail: normalizedEmail, ip },
  });

  return NextResponse.json({ link: confirmLink });
}
