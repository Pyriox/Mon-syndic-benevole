// ============================================================
// Route : POST /api/appels-de-fonds/[appelId]/importer
// Utilisé pour les appels dont l'échéance est passée
// (migration d'un syndic, saisie a posteriori).
// 1. Génère la répartition (lignes) depuis les lots à jour
// 2. Marque toutes les lignes comme payées + débite les soldes
// 3. Passe le statut à "confirme" — SANS envoyer d'e-mails
// Le syndic peut ensuite décocher individuellement les impayés
// via l'interface de paiement habituelle.
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { parseBudgetPostesFromDescription, repartitionParPostes } from '@/lib/utils';
import { isSubscribed } from '@/lib/subscription';

export async function POST(
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

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });

  const { data: appel } = await supabase
    .from('appels_de_fonds')
    .select('*, coproprietes(id, nom, syndic_id, plan)')
    .eq('id', appelId)
    .single();

  if (!appel) return NextResponse.json({ message: 'Appel de fonds introuvable' }, { status: 404 });

  const copro = appel.coproprietes as { syndic_id: string; plan: string | null } | null;
  if (copro?.syndic_id !== user.id) {
    return NextResponse.json({ message: 'Non autorisé' }, { status: 403 });
  }
  if (!isSubscribed(copro?.plan)) {
    return NextResponse.json({ message: 'Abonnement requis' }, { status: 403 });
  }
  if (appel.statut === 'publie' || appel.statut === 'confirme') {
    return NextResponse.json({ message: 'Cet appel est déjà traité.' }, { status: 409 });
  }

  // Lots avec copropriétaires assignés
  const { data: lots } = await supabase
    .from('lots')
    .select('id, tantiemes, coproprietaire_id, batiment, groupes_repartition, tantiemes_groupes')
    .eq('copropriete_id', appel.copropriete_id)
    .not('coproprietaire_id', 'is', null);

  if (!lots?.length) {
    return NextResponse.json({
      message: "Aucun lot avec copropriétaire assigné. Assignez d'abord les copropriétaires aux lots.",
    }, { status: 422 });
  }

  const totalTantiemes = lots.reduce((s, l) => s + (l.tantiemes ?? 0), 0);
  if (totalTantiemes === 0) {
    return NextResponse.json({ message: 'La somme des tantièmes est zéro.' }, { status: 422 });
  }

  const postes = parseBudgetPostesFromDescription(appel.description);
  if (
    (appel.montant_fonds_travaux ?? 0) > 0
    && !postes.some((poste) => poste.categorie === 'fonds_travaux_alur' || /fonds\s+de\s+travaux/i.test(poste.libelle))
  ) {
    postes.push({
      libelle: 'Fonds de travaux (ALUR)',
      categorie: 'fonds_travaux_alur',
      montant: appel.montant_fonds_travaux,
      repartition_type: 'generale',
      repartition_cible: null,
    });
  }

  const repartition = repartitionParPostes(appel.montant_total, lots, postes);

  // Supprimer les lignes existantes si récréation
  await supabase.from('lignes_appels_de_fonds').delete().eq('appel_de_fonds_id', appelId);

  // Insérer les lignes avec paye = true (déjà réglé)
  const datePaiement = appel.date_echeance;
  const { error: lignesErr } = await supabase.from('lignes_appels_de_fonds').insert(
    repartition.map((r) => ({
      appel_de_fonds_id: appelId,
      coproprietaire_id: r.copId,
      lot_id: r.lotId,
      montant_du: r.montant,
      regularisation_ajustement: 0,
      paye: true,
      date_paiement: datePaiement,
    }))
  );
  if (lignesErr) {
    return NextResponse.json({ message: 'Erreur génération répartition : ' + lignesErr.message }, { status: 500 });
  }

  // Import historique : toutes les lignes sont paye=true immédiatement.
  // La dette et le paiement se compensent → impact net sur solde = 0.
  // Si le syndic décoche un paiement via l'UI, handleUnpay recrée la dette.

  // Passer en confirme (pas publié, pas d'e-mails)
  await supabase.from('appels_de_fonds')
    .update({ statut: 'confirme' })
    .eq('id', appelId);

  return NextResponse.json({ message: 'Appel importé avec paiements validés.', lignes: repartition.length });
}
