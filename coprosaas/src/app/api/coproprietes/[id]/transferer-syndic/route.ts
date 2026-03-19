import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createAdminClient } from '@/lib/supabase/admin';

function makeSupabase(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => { try { toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch { /* lecture seule */ } },
      },
    }
  );
}

// POST /api/coproprietes/[id]/transferer-syndic
// Body : { email: string, password: string }
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: coproprieteId } = await params;
  const cookieStore = await cookies();
  const supabase = makeSupabase(cookieStore);

  // Vérifier que l'utilisateur connecté est bien le syndic actuel
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const body = await request.json();
  const { email, password } = body as { email: string; password: string };

  if (!email || !password) {
    return NextResponse.json({ error: 'Email et mot de passe requis' }, { status: 400 });
  }

  // Vérifier que la copropriété appartient bien à l'utilisateur connecté
  const { data: copro } = await supabase
    .from('coproprietes')
    .select('id, nom, syndic_id')
    .eq('id', coproprieteId)
    .eq('syndic_id', user.id)
    .single();

  if (!copro) {
    return NextResponse.json({ error: 'Copropriété introuvable ou accès refusé' }, { status: 403 });
  }

  // Vérifier le mot de passe de l'utilisateur actuel (confirmation)
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password,
  });
  if (authError) {
    return NextResponse.json({ error: 'Mot de passe incorrect' }, { status: 401 });
  }

  // Rechercher le nouveau syndic par email via une fonction SQL dédiée
  // (getUserByEmail n'est pas disponible dans @supabase/supabase-js v2)
  const admin = createAdminClient();
  const { data: targetUserId } = await admin.rpc('find_auth_user_id_by_email', {
    user_email: email.toLowerCase().trim(),
  });

  if (!targetUserId) {
    return NextResponse.json({ error: "Aucun compte trouvé pour cet email. Le nouveau syndic doit d'abord créer un compte." }, { status: 404 });
  }

  const { data: targetUserData } = await admin.auth.admin.getUserById(targetUserId as string);
  const newSyndicUser = targetUserData?.user ?? null;

  if (!newSyndicUser) {
    return NextResponse.json({ error: "Aucun compte trouvé pour cet email. Le nouveau syndic doit d'abord créer un compte." }, { status: 404 });
  }

  if (newSyndicUser.id === user.id) {
    return NextResponse.json({ error: 'Vous êtes déjà le syndic de cette copropriété' }, { status: 400 });
  }

  // Mettre à jour syndic_id
  const { error: updateError } = await admin
    .from('coproprietes')
    .update({ syndic_id: newSyndicUser.id })
    .eq('id', coproprieteId);

  if (updateError) {
    console.error('[transferer-syndic] DB error:', updateError.message);
    return NextResponse.json({ error: 'Une erreur est survenue lors du transfert.' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    newSyndicName: newSyndicUser.user_metadata?.full_name ?? email,
  });
}
