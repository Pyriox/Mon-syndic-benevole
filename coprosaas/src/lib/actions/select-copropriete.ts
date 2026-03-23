'use server';

import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function selectCopropriete(coproId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Vérifier que l'utilisateur a bien accès à cette copropriété
  const admin = createAdminClient();
  const [{ data: asSyndic }, { data: asCopro }, { data: asCoproByEmail }] = await Promise.all([
    admin.from('coproprietes').select('id').eq('id', coproId).eq('syndic_id', user.id).maybeSingle(),
    admin.from('coproprietaires').select('id').eq('copropriete_id', coproId).eq('user_id', user.id).maybeSingle(),
    admin.from('coproprietaires').select('id').eq('copropriete_id', coproId).eq('email', user.email ?? '').is('user_id', null).maybeSingle(),
  ]);

  if (!asSyndic && !asCopro && !asCoproByEmail) return;

  const cookieStore = await cookies();
  cookieStore.set('selected_copro_id', coproId, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 an
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
  });
}
