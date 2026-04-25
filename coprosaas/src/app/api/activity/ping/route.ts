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
  const [{ data: sessionId }, { error: profileError }] = await Promise.all([
    admin.rpc('upsert_user_session', { p_user_id: user.id }),
    admin.from('profiles').upsert({ id: user.id, last_active_at: now }, { onConflict: 'id' }),
  ]);

  if (profileError) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({
    sessionId: typeof sessionId === 'string' ? sessionId : null,
  });
}