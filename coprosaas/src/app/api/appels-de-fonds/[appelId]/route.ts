// ============================================================
// Route : DELETE /api/appels-de-fonds/[appelId]
// - Vérifie que l'appelant est bien le syndic de la copropriété
// - Réverse les soldes des copropriétaires non payés (si publié)
// - Supprime les lignes puis l'appel de fonds
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ appelId: string }> }
) {
  const { appelId } = await params;
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );

  // Auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });

  // Fetch appel + copropriété
  const { data: appel } = await supabase
    .from('appels_de_fonds')
    .select('id, statut, coproprietes(syndic_id)')
    .eq('id', appelId)
    .single();

  if (!appel) return NextResponse.json({ message: 'Appel de fonds introuvable' }, { status: 404 });

  const copro = (Array.isArray(appel.coproprietes) ? appel.coproprietes[0] : appel.coproprietes) as { syndic_id: string } | null;
  if (copro?.syndic_id !== user.id) {
    return NextResponse.json({ message: 'Non autorisé' }, { status: 403 });
  }

  // Si l'appel est publié, reverser les soldes des copropriétaires non payés
  if (appel.statut === 'publie') {
    const { data: lignes } = await supabase
      .from('lignes_appels_de_fonds')
      .select('montant_du, paye, coproprietaire_id')
      .eq('appel_de_fonds_id', appelId);

    for (const ligne of lignes ?? []) {
      if (!ligne.paye && ligne.coproprietaire_id) {
        const { data: cop } = await supabase
          .from('coproprietaires')
          .select('solde')
          .eq('id', ligne.coproprietaire_id)
          .single();
        await supabase.from('coproprietaires').update({
          solde: Math.round(((cop?.solde ?? 0) + ligne.montant_du) * 100) / 100,
        }).eq('id', ligne.coproprietaire_id);
      }
    }
  }

  // Supprimer les lignes puis l'appel
  await supabase.from('lignes_appels_de_fonds').delete().eq('appel_de_fonds_id', appelId);
  const { error } = await supabase.from('appels_de_fonds').delete().eq('id', appelId);

  if (error) return NextResponse.json({ message: 'Erreur suppression : ' + error.message }, { status: 500 });

  return NextResponse.json({ message: 'Appel de fonds supprimé.' });
}
