'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

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

  // Pose le cookie avant le redirect : garantit que la prochaine requête
  // (déclenchée par le redirect) inclut déjà selected_copro_id.
  const cookieStore = await cookies();
  cookieStore.set('selected_copro_id', data.id, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });

  redirect('/dashboard');
}
