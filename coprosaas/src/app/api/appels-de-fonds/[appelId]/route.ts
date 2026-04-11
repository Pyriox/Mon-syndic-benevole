// ============================================================
// Route : DELETE /api/appels-de-fonds/[appelId]
// - Vérifie que l'appelant est bien le syndic de la copropriété
// - Réverse les soldes des copropriétaires non payés (si publié)
// - Supprime les lignes puis l'appel de fonds
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { applyCoproprietaireBalanceDelta } from '@/lib/coproprietaire-balance';

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
    .select('id, titre, statut, type_appel, montant_fonds_travaux, copropriete_id, coproprietes(syndic_id)')
    .eq('id', appelId)
    .single();

  if (!appel) return NextResponse.json({ message: 'Appel de fonds introuvable' }, { status: 404 });

  const copro = (Array.isArray(appel.coproprietes) ? appel.coproprietes[0] : appel.coproprietes) as { syndic_id: string } | null;
  if (copro?.syndic_id !== user.id) {
    return NextResponse.json({ message: 'Non autorisé' }, { status: 403 });
  }

  // Ajuster les soldes selon le statut de l'appel :
  // - publie   : rétablir les lignes impayées (on ajoute le montant)
  // - confirme : annuler les crédits importés marqués payés (on retire le montant)
  if (appel.statut === 'publie' || appel.statut === 'confirme') {
    const { data: lignes } = await supabase
      .from('lignes_appels_de_fonds')
      .select('montant_du, regularisation_ajustement, paye, coproprietaire_id')
      .eq('appel_de_fonds_id', appelId);

    const deltaByCopro = new Map<string, number>();
    for (const ligne of lignes ?? []) {
      if (!ligne.coproprietaire_id) continue;

      // Convention : solde positif = doit de l'argent.
      // publier a ajouté +montant pour chaque ligne impayée → inverser au delete.
      // importer ne touche plus au solde → rien à inverser pour confirme.
      let delta = 0;
      if (appel.statut === 'publie' && !ligne.paye) {
        delta = -Math.round((ligne.montant_du - (ligne.regularisation_ajustement ?? 0)) * 100) / 100;  // annule la dette créée lors de la publication
      }
      if (delta === 0) continue;

      deltaByCopro.set(
        ligne.coproprietaire_id,
        (deltaByCopro.get(ligne.coproprietaire_id) ?? 0) + delta
      );
    }

    const accountType = appel.type_appel === 'fonds_travaux'
      ? 'fonds_travaux'
      : (appel.montant_fonds_travaux ?? 0) > 0
        ? 'mixte'
        : 'principal';

    for (const [coproprietaireId, delta] of deltaByCopro.entries()) {
      const { error: balanceError } = await applyCoproprietaireBalanceDelta(supabase, {
        coproprietaireId,
        delta,
        label: `Suppression d'appel de fonds — ${appel.titre}`,
        sourceType: 'appel_suppression',
        effectiveDate: new Date().toISOString().slice(0, 10),
        accountType,
        sourceId: appelId,
        metadata: { appelId, statut: appel.statut },
        createdBy: user.id,
      });

      if (balanceError) {
        return NextResponse.json({ message: 'Erreur de mise à jour du solde : ' + balanceError.message }, { status: 500 });
      }
    }
  }

  // Supprimer les lignes puis l'appel
  await supabase.from('lignes_appels_de_fonds').delete().eq('appel_de_fonds_id', appelId);
  const { error } = await supabase.from('appels_de_fonds').delete().eq('id', appelId);

  if (error) return NextResponse.json({ message: 'Erreur suppression : ' + error.message }, { status: 500 });

  return NextResponse.json({ message: 'Appel de fonds supprimé.' });
}
