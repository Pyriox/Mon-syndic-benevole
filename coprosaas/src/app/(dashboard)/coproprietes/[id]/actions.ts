'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { invalidateLayoutCache, invalidateLotsCache } from '@/lib/cached-queries';
import { sanitizeTantiemesGroupesMap } from '@/lib/utils';

function buildLotSettingsPayload(data: {
  numero: string;
  type: string;
  tantiemes: number;
  batiment?: string | null;
  groupesRepartition?: string[];
  tantiemesGroupes?: Record<string, number>;
}) {
  const normalizedBatiment = data.batiment?.trim() || null;
  const normalizedKeyTantiemes = sanitizeTantiemesGroupesMap(data.tantiemesGroupes ?? {});
  const normalizedGroups = Array.from(new Set([
    ...(data.groupesRepartition ?? [])
      .map((group) => group.trim())
      .filter(Boolean),
    ...Object.keys(normalizedKeyTantiemes).filter((group) => group !== normalizedBatiment),
  ])).sort((a, b) => a.localeCompare(b, 'fr'));

  return {
    numero: data.numero.trim(),
    type: data.type,
    tantiemes: data.tantiemes,
    batiment: normalizedBatiment,
    groupes_repartition: normalizedGroups,
    tantiemes_groupes: normalizedKeyTantiemes,
  };
}

// ---- Ajouter ou modifier un lot ----
export async function saveLot(data: {
  coproprieteId: string;
  lotId?: string;
  numero: string;
  type: string;
  tantiemes: number;
  batiment?: string;
  groupesRepartition?: string[];
  tantiemesGroupes?: Record<string, number>;
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

  const payload = buildLotSettingsPayload(data);

  if (data.lotId) {
    const { error } = await supabase
      .from('lots')
      .update(payload)
      .eq('id', data.lotId);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from('lots')
      .insert({
        copropriete_id: data.coproprieteId,
        ...payload,
      });
    if (error) return { error: error.message };
  }

  revalidatePath('/coproprietes');
  revalidatePath(`/coproprietes/${data.coproprieteId}`);
  revalidatePath(`/coproprietes/${data.coproprieteId}/parametrage`);
  invalidateLotsCache(data.coproprieteId);
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

  revalidatePath('/coproprietes');
  revalidatePath(`/coproprietes/${coproprieteId}`);
  revalidatePath(`/coproprietes/${coproprieteId}/parametrage`);
  invalidateLotsCache(coproprieteId);
  return {};
}

export async function saveCoproprieteSettings(data: {
  coproprieteId: string;
  nom: string;
  adresse: string;
  code_postal: string;
  ville: string;
  lots: Array<{
    id: string;
    numero: string;
    type: string;
    tantiemes: number;
    batiment?: string | null;
    groupesRepartition?: string[];
    tantiemesGroupes?: Record<string, number>;
  }>;
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: copro } = await supabase
    .from('coproprietes')
    .select('id')
    .eq('id', data.coproprieteId)
    .eq('syndic_id', user.id)
    .maybeSingle();
  if (!copro) return { error: 'Accès non autorisé' };

  const { error: coproError } = await supabase
    .from('coproprietes')
    .update({
      nom: data.nom.trim(),
      adresse: data.adresse.trim(),
      code_postal: data.code_postal.trim(),
      ville: data.ville.trim(),
    })
    .eq('id', data.coproprieteId)
    .eq('syndic_id', user.id);

  if (coproError) return { error: coproError.message };

  for (const lot of data.lots) {
    const payload = buildLotSettingsPayload(lot);
    const { error: lotError } = await supabase
      .from('lots')
      .update(payload)
      .eq('id', lot.id)
      .eq('copropriete_id', data.coproprieteId);

    if (lotError) {
      return { error: `Lot ${lot.numero} : ${lotError.message}` };
    }
  }

  revalidatePath('/coproprietes');
  revalidatePath(`/coproprietes/${data.coproprieteId}`);
  revalidatePath(`/coproprietes/${data.coproprieteId}/parametrage`);
  invalidateLotsCache(data.coproprieteId);
  invalidateLayoutCache(user.id);
  return {};
}

// ---- Modifier les infos d'une copropriété ----
export async function updateCopropriete(data: {
  coproprieteId: string;
  nom: string;
  adresse: string;
  code_postal: string;
  ville: string;
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { error } = await supabase
    .from('coproprietes')
    .update({ nom: data.nom, adresse: data.adresse, code_postal: data.code_postal, ville: data.ville })
    .eq('id', data.coproprieteId)
    .eq('syndic_id', user.id);
  if (error) return { error: error.message };

  revalidatePath('/coproprietes');
  revalidatePath(`/coproprietes/${data.coproprieteId}`);
  revalidatePath(`/coproprietes/${data.coproprieteId}/parametrage`);
  // Le nom / l'adresse de la copro apparaissent dans la sidebar du layout
  invalidateLayoutCache(user.id);
  return {};
}
