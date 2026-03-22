'use server';

import { revalidateTag } from 'next/cache';
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
    })
    .select('id')
    .single();

  if (error) return { error: error.message };

  // Sélectionne la nouvelle copropriété en posant le cookie immédiatement
  const cookieStore = await cookies();
  cookieStore.set('selected_copro_id', data.id, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });

  // Invalide le cache du layout pour que la barre latérale se mette à jour
  // Cast nécessaire : Next.js 16 surcharge le type avec un 2e arg optionnel
  // mais unstable_cache n'en a pas besoin à l'exécution.
  (revalidateTag as unknown as (tag: string) => void)('dashboard-layout-data');

  return { id: data.id };
}
