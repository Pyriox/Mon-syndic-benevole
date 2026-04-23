'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { after } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { invalidateLayoutCache } from '@/lib/cached-queries';

export async function createCopropriete(formData: {
  nom: string;
  adresse: string;
  code_postal: string;
  ville: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Non connecté' };

  const { data, error } = await supabase
    .from('coproprietes')
    .insert({
      nom: formData.nom.trim(),
      adresse: formData.adresse.trim(),
      code_postal: formData.code_postal.trim(),
      ville: formData.ville.trim(),
      syndic_id: user.id,
      plan: 'inactif',
    })
    .select('id')
    .single();

  if (error) return { error: error.message };

  // Log de l'événement (non-bloquant)
  const userEmail = user.email ?? '';
  const coproNom  = formData.nom.trim();
  after(async () => {
    try {
      const admin = createAdminClient();
      await admin.from('user_events').insert({
        user_id: user.id,
        user_email: userEmail.toLowerCase(),
        event_type: 'copropriete_created',
        label: `Copropriété créée — ${coproNom}`,
      });
    } catch { /* non critique */ }
  });

  // Invalide le cache de navigation pour refléter la nouvelle copropriété
  invalidateLayoutCache(user.id);

  // Pose le cookie avant le redirect : garantit que la prochaine requête
  // (déclenchée par le redirect) inclut déjà selected_copro_id.
  const cookieStore = await cookies();
  cookieStore.set('selected_copro_id', data.id, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
  });

  redirect('/dashboard?copro_cree=1');
}
