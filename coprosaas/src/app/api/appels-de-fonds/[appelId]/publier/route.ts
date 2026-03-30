// ============================================================
// Route : POST /api/appels-de-fonds/[appelId]/publier
// 1. Génère la répartition (lignes) depuis les lots à jour
// 2. Débite les soldes des copropriétaires
// 3. Marque l'appel "publié"
// 4. Envoie les avis par e-mail uniquement si l'échéance
//    est dans <= 30 jours — sinon, le cron quotidien s'en charge
//    (J-30 automatique) afin d'éviter d'envoyer un avis pour un
//    appel exigible dans plusieurs mois.
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { repartirMontant } from '@/lib/utils';
import { Resend } from 'resend';
import { buildAppelEmail, buildAppelEmailSubject } from '@/lib/emails/appel-de-fonds';
import { isSubscribed } from '@/lib/subscription';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = `Mon Syndic Bénévole <${process.env.EMAIL_FROM ?? 'noreply@mon-syndic-benevole.fr'}>`;

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

  // Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });

  // Fetch appel + copropriété
  const { data: appel } = await supabase
    .from('appels_de_fonds')
    .select('*, coproprietes(id, nom, adresse, ville, code_postal, syndic_id, plan)')
    .eq('id', appelId)
    .single();

  if (!appel) return NextResponse.json({ message: 'Appel de fonds introuvable' }, { status: 404 });

  // Autorisation : seul le syndic de la copropriété peut publier
  const coproPublier = appel.coproprietes as { syndic_id: string; plan: string | null } | null;
  if (coproPublier?.syndic_id !== user.id) {
    return NextResponse.json({ message: 'Non autorisé' }, { status: 403 });
  }

  // Vérification de l'abonnement actif
  if (!isSubscribed(coproPublier?.plan)) {
    return NextResponse.json({ message: 'Abonnement requis pour publier un appel de fonds' }, { status: 403 });
  }

  if (appel.statut === 'publie') {
    return NextResponse.json({ message: 'Cet appel est déjà publié.' }, { status: 409 });
  }

  // Lots avec copropriétaires assignés
  const { data: lots } = await supabase
    .from('lots')
    .select('id, tantiemes, coproprietaire_id')
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

  // Calculer la répartition (regrouper par copropriétaire si multi-lots)
  const coprMap = new Map<string, { tantiemes: number; lotId: string | null }>();
  for (const lot of lots) {
    const copId = lot.coproprietaire_id as string;
    if (coprMap.has(copId)) {
      const e = coprMap.get(copId)!;
      e.tantiemes += lot.tantiemes ?? 0;
      e.lotId = null;
    } else {
      coprMap.set(copId, { tantiemes: lot.tantiemes ?? 0, lotId: lot.id });
    }
  }
  const repartition = repartirMontant(
    appel.montant_total,
    Array.from(coprMap.entries()).map(([copId, e]) => ({ copId, lotId: e.lotId, tantiemes: e.tantiemes }))
  );

  // Déterminer si cet appel est le premier publié après une clôture de régularisation.
  // Dans ce cas, on reporte le solde existant dans le montant dû de l'appel
  // pour que le copropriétaire revienne à 0 après paiement complet.
  const { data: lastClosedExercice } = await supabase
    .from('exercices')
    .select('cloture_at')
    .eq('copropriete_id', appel.copropriete_id)
    .eq('statut', 'cloture')
    .not('cloture_at', 'is', null)
    .order('cloture_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  let applyRegularisationCarryOver = false;
  if (lastClosedExercice?.cloture_at) {
    const { count: nbPublishedSinceClosure } = await supabase
      .from('appels_de_fonds')
      .select('id', { count: 'exact', head: true })
      .eq('copropriete_id', appel.copropriete_id)
      .in('statut', ['publie', 'confirme'])
      .neq('id', appelId)
      .gt('created_at', lastClosedExercice.cloture_at);

    applyRegularisationCarryOver = (nbPublishedSinceClosure ?? 0) === 0;
  }

  const copIds = repartition.map((r) => r.copId);
  const { data: copros } = await supabase
    .from('coproprietaires')
    .select('id, solde')
    .in('id', copIds);

  const soldeByCoproId: Record<string, number> = Object.fromEntries(
    (copros ?? []).map((c) => [c.id, c.solde ?? 0])
  );

  const repartitionAjustee = repartition.map((r) => {
    const baseMontant = Math.round((r.montant ?? 0) * 100) / 100;
    if (!applyRegularisationCarryOver) {
      return { ...r, montant_du: baseMontant };
    }
    const soldeCourant = Math.round((soldeByCoproId[r.copId] ?? 0) * 100) / 100;
    const montantAjuste = Math.round((baseMontant + soldeCourant) * 100) / 100;
    return { ...r, montant_du: montantAjuste };
  });

  // Supprimer les lignes existantes si réémission
  await supabase.from('lignes_appels_de_fonds').delete().eq('appel_de_fonds_id', appelId);

  // Insérer les nouvelles lignes
  const { error: lignesErr } = await supabase.from('lignes_appels_de_fonds').insert(
    repartitionAjustee.map((r) => ({
      appel_de_fonds_id: appelId,
      coproprietaire_id: r.copId,
      lot_id: r.lotId,
      montant_du: r.montant_du,
      paye: false,
      date_paiement: null,
    }))
  );
  if (lignesErr) {
    return NextResponse.json({ message: 'Erreur génération répartition : ' + lignesErr.message }, { status: 500 });
  }

  // Créer/mettre à jour la dette (solde positif = copropriétaire doit de l'argent)
  // Si report régularisation : on remplace le solde courant par le montant dû ajusté,
  // ainsi un paiement complet de ce 1er appel remet le solde à 0.
  for (const r of repartitionAjustee) {
    const soldeCourant = soldeByCoproId[r.copId] ?? 0;
    const nouveauSolde = applyRegularisationCarryOver
      ? r.montant_du
      : Math.round((soldeCourant + r.montant_du) * 100) / 100;
    await supabase
      .from('coproprietaires')
      .update({ solde: nouveauSolde })
      .eq('id', r.copId);
  }

  // Détermine si l'avis doit être envoyé immédiatement (échéance <= J+30)
  // ou différé au cron quotidien (J-30 avant échéance).
  const todayMs = Date.now();
  const echeanceMs = new Date(appel.date_echeance + 'T00:00:00').getTime();
  const daysUntilEcheance = Math.floor((echeanceMs - todayMs) / 86_400_000);
  const sendImmediately = daysUntilEcheance <= 30;

  // Marquer comme publié (emailed_at = now seulement si envoi immédiat)
  const now = new Date().toISOString();
  await supabase.from('appels_de_fonds')
    .update({ statut: 'publie', ...(sendImmediately ? { emailed_at: now } : {}) })
    .eq('id', appelId);

  if (!sendImmediately) {
    return NextResponse.json({
      message: `Appel publié · L'avis sera envoyé automatiquement 30 jours avant l'échéance.`,
      sent: 0,
      deferred: true,
    });
  }

  // Envoyer les e-mails immédiatement (échéance proche)
  const { data: lignes } = await supabase
    .from('lignes_appels_de_fonds')
    .select('montant_du, coproprietaires(nom, prenom, email, user_id)')
    .eq('appel_de_fonds_id', appelId);

  const coproprieteNom = (appel.coproprietes as { nom: string } | null)?.nom ?? '';
  let sent = 0;

  for (const l of lignes ?? []) {
    const c = Array.isArray(l.coproprietaires) ? l.coproprietaires[0] : l.coproprietaires;
    if (!c) continue;
    const cop = c as { nom: string; prenom: string; email: string; user_id: string | null };
    let email = cop.email ?? '';
    if (!email && cop.user_id) {
      const { data: authData } = await supabase.auth.admin.getUserById(cop.user_id);
      email = authData?.user?.email ?? '';
    }
    if (!email) continue;

    const { error } = await resend.emails.send({
      from: FROM,
      to: email,
      subject: buildAppelEmailSubject({
        type: 'avis',
        coproprieteNom,
        dateEcheance: appel.date_echeance,
      }),
      html: buildAppelEmail({
        type: 'avis',
        prenom: cop.prenom,
        nom: cop.nom,
        coproprieteNom,
        titre: appel.titre,
        montantDu: l.montant_du,
        dateEcheance: appel.date_echeance,
      }),
    });
    if (!error) sent++;
  }

  return NextResponse.json({
    message: `Appel publié · ${sent} avis envoyé(s) par e-mail.${applyRegularisationCarryOver ? ' Report de solde de régularisation appliqué.' : ''}`,
    sent,
  });
}
