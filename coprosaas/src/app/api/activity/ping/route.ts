import { NextResponse } from 'next/server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();

  // Mise à jour du profil + session atomique en parallèle (best-effort)
  // update() plutôt que upsert() : évite un INSERT incomplet si la ligne
  // profiles n'existe pas encore (colonnes NOT NULL sans valeur fournie).
  const [{ data: sessionId }, { error: profileError }] = await Promise.all([
    admin.rpc('upsert_user_session', { p_user_id: user.id }),
    admin.from('profiles').update({ last_active_at: now }).eq('id', user.id),
  ]);

  if (profileError) {
    console.error('[ping] last_active_at update failed:', profileError.message);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({
    sessionId: typeof sessionId === 'string' ? sessionId : null,
  });
}