'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

// ---- Ajouter ou modifier un lot ----
export async function saveLot(data: {
  coproprieteId: string;
  lotId?: string;
  numero: string;
  type: string;
  tantiemes: number;
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Vérifie que l'utilisateur est bien le syndic de cette copropriété
  const { data: copro } = await supabase
    .from('coproprietes')
    .select('id')
    .eq('id', data.coproprieteId)
    .eq('syndic_id', user.id)
    .maybeSingle();
  if (!copro) return { error: 'Accès non autorisé' };

  if (data.lotId) {
    const { error } = await supabase
      .from('lots')
      .update({ numero: data.numero, type: data.type, tantiemes: data.tantiemes })
      .eq('id', data.lotId);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from('lots')
      .insert({ copropriete_id: data.coproprieteId, numero: data.numero, type: data.type, tantiemes: data.tantiemes });
    if (error) return { error: error.message };
  }

  revalidatePath(`/coproprietes/${data.coproprieteId}`);
  return {};
}

// ---- Supprimer un lot ----
export async function deleteLot(lotId: string, coproprieteId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Vérifie que l'utilisateur est bien le syndic de cette copropriété
  const { data: copro } = await supabase
    .from('coproprietes')
    .select('id')
    .eq('id', coproprieteId)
    .eq('syndic_id', user.id)
    .maybeSingle();
  if (!copro) return { error: 'Accès non autorisé' };

  const { error } = await supabase.from('lots').delete().eq('id', lotId);
  if (error) return { error: error.message };

  revalidatePath(`/coproprietes/${coproprieteId}`);
  return {};
}
