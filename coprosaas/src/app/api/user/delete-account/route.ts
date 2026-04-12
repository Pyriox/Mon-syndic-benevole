import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const CONFIRM_TEXT = 'SUPPRIMER MON COMPTE';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  if (body?.confirmText !== CONFIRM_TEXT) {
    return NextResponse.json({ error: 'Texte de confirmation incorrect.' }, { status: 400 });
  }
  if (!body?.password || typeof body.password !== 'string') {
    return NextResponse.json({ error: 'Mot de passe requis.' }, { status: 400 });
  }

  const { error: passwordError } = await supabase.auth.signInWithPassword({
    email: user.email ?? '',
    password: body.password,
  });
  if (passwordError) {
    return NextResponse.json({ error: 'Mot de passe incorrect.' }, { status: 401 });
  }

  const admin = createAdminClient();

  // 1. Détacher le syndic de ses copropriétés (sans les supprimer — elles restent accessibles)
  await admin
    .from('coproprietes')
    .update({ syndic_id: null })
    .eq('syndic_id', user.id);

  // 2. Détacher l'utilisateur des copropriétés où il est membre (fiche coproprietaire)
  await admin
    .from('coproprietaires')
    .update({ user_id: null })
    .eq('user_id', user.id);

  // 3. Supprimer le profil si existant
  await admin.from('profiles').delete().eq('id', user.id);

  // 4. Supprimer le compte auth
  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteError) {
    return NextResponse.json({ error: 'Erreur lors de la suppression du compte.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
