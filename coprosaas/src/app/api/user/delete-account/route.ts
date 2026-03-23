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

  const admin = createAdminClient();

  // 1. Suppression en cascade pour chaque copropriété dont l'utilisateur est syndic
  const { data: coproprietes } = await admin
    .from('coproprietes')
    .select('id')
    .eq('syndic_id', user.id);

  for (const copro of coproprietes ?? []) {
    const coproId = copro.id;

    // Répartitions des dépenses
    const { data: depenses } = await admin
      .from('depenses')
      .select('id')
      .eq('copropriete_id', coproId);
    if ((depenses?.length ?? 0) > 0) {
      await admin.from('repartitions_depenses').delete().in('depense_id', depenses!.map(d => d.id));
    }
    await admin.from('depenses').delete().eq('copropriete_id', coproId);

    // Lignes des appels de fonds
    const { data: appels } = await admin
      .from('appels_de_fonds')
      .select('id')
      .eq('copropriete_id', coproId);
    if ((appels?.length ?? 0) > 0) {
      await admin.from('lignes_appels_de_fonds').delete().in('appel_id', appels!.map(a => a.id));
    }
    await admin.from('appels_de_fonds').delete().eq('copropriete_id', coproId);

    // Résolutions des AGs
    const { data: ags } = await admin
      .from('assemblees_generales')
      .select('id')
      .eq('copropriete_id', coproId);
    if ((ags?.length ?? 0) > 0) {
      await admin.from('resolutions').delete().in('ag_id', ags!.map(a => a.id));
    }
    await admin.from('assemblees_generales').delete().eq('copropriete_id', coproId);

    await admin.from('incidents').delete().eq('copropriete_id', coproId);
    await admin.from('documents').delete().eq('copropriete_id', coproId);
    await admin.from('coproprietaires').delete().eq('copropriete_id', coproId);
    await admin.from('lots').delete().eq('copropriete_id', coproId);
    await admin.from('coproprietes').delete().eq('id', coproId);
  }

  // 2. Détacher l'utilisateur des autres copropriétés où il est membre
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
