// ============================================================
// API Admin — génération de lien magique pour impersonation
// POST /api/admin/impersonate  { email }
// Retourne { link } — lien de connexion à usage unique (15 min)
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

function getAdminEmail(): string | undefined {
  return process.env.ADMIN_EMAIL;
}

export async function POST(request: NextRequest) {
  const ADMIN_EMAIL = getAdminEmail();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!ADMIN_EMAIL || !user || user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const body = await request.json() as { email?: string };
  const { email } = body;

  if (!email || typeof email !== 'string' || (ADMIN_EMAIL && email === ADMIN_EMAIL)) {
    return NextResponse.json({ error: 'Email invalide ou protégé' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
  });

  if (error || !data?.properties?.action_link) {
    return NextResponse.json(
      { error: error?.message ?? 'Impossible de générer le lien' },
      { status: 500 }
    );
  }

  return NextResponse.json({ link: data.properties.action_link });
}
