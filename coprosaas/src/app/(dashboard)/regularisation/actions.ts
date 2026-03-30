'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { invalidateCoproprietairesCache } from '@/lib/cached-queries';

export interface RegularisationResult {
  error?: string;
  exerciceId?: string;
}

// ── Helper : vérifie que l'utilisateur est bien le syndic de l'exercice ───────
async function assertSyndicOwnsExercice(
  supabase: Awaited<ReturnType<typeof createClient>>,
  exerciceId: string,
  userId: string
) {
  const { data: exercice } = await supabase
    .from('exercices')
    .select('id, statut, copropriete_id, date_debut, date_fin')
    .eq('id', exerciceId)
    .single();

  if (!exercice) return null;

  const { data: copro } = await supabase
    .from('coproprietes')
    .select('id')
    .eq('id', exercice.copropriete_id)
    .eq('syndic_id', userId)
    .maybeSingle();

  if (!copro) return null;
  return exercice;
}

// ── Créer l'exercice (ou retourner l'existant) ────────────────────────────────
export async function createExercice(data: {
  coproprieteId: string;
  annee: number;
}): Promise<RegularisationResult> {
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

  const currentYear = new Date().getFullYear();
  if (data.annee >= currentYear) {
    return {
      error: `La régularisation ${data.annee} n'est pas disponible avant le 1er janvier ${data.annee + 1}.`,
    };
  }

  const { data: existing } = await supabase
    .from('exercices')
    .select('id')
    .eq('copropriete_id', data.coproprieteId)
    .eq('annee', data.annee)
    .maybeSingle();

  if (existing) return { exerciceId: existing.id };

  const { data: inserted, error } = await supabase
    .from('exercices')
    .insert({
      copropriete_id: data.coproprieteId,
      annee: data.annee,
      date_debut: `${data.annee}-01-01`,
      date_fin: `${data.annee}-12-31`,
      created_by: user.id,
    })
    .select('id')
    .single();

  if (error) return { error: error.message };
  revalidatePath('/regularisation');
  return { exerciceId: inserted.id };
}

// ── Calculer (ou recalculer) les lignes de régularisation ────────────────────
export async function calculerRegularisation(exerciceId: string): Promise<RegularisationResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const exercice = await assertSyndicOwnsExercice(supabase, exerciceId, user.id);
  if (!exercice) return { error: 'Accès non autorisé' };
  if (exercice.statut === 'cloture') return { error: 'Exercice clôturé — non modifiable.' };

  // L'exercice doit être terminé (date_fin < maintenant)
  if (new Date() <= new Date(exercice.date_fin)) {
    const fin = new Date(exercice.date_fin).toLocaleDateString('fr-FR');
    return { error: `L'exercice n'est pas encore achevé. La régularisation sera disponible après le ${fin}.` };
  }

  const coproprieteId = exercice.copropriete_id;

  // Coproprietaires de la copropriété
  const { data: coproprietaires } = await supabase
    .from('coproprietaires')
    .select('id')
    .eq('copropriete_id', coproprieteId);

  // Lots pour calculer les tantièmes
  const { data: lots } = await supabase
    .from('lots')
    .select('tantiemes, coproprietaire_id')
    .eq('copropriete_id', coproprieteId)
    .not('coproprietaire_id', 'is', null);

  const totalTantiemes = (lots ?? []).reduce((s, l) => s + (l.tantiemes ?? 0), 0);
  const tantByOwner: Record<string, number> = {};
  for (const l of lots ?? []) {
    if (l.coproprietaire_id) {
      tantByOwner[l.coproprietaire_id] = (tantByOwner[l.coproprietaire_id] ?? 0) + (l.tantiemes ?? 0);
    }
  }

  // Appels de fonds de l'exercice (hors fonds_travaux) → filtrés par date_echeance
  const { data: appels } = await supabase
    .from('appels_de_fonds')
    .select('id')
    .eq('copropriete_id', coproprieteId)
    .gte('date_echeance', exercice.date_debut)
    .lte('date_echeance', exercice.date_fin)
    .or('type_appel.is.null,type_appel.neq.fonds_travaux');

  const appelIds = (appels ?? []).map((a) => a.id);
  const montantAppeleByOwner: Record<string, number> = {};

  if (appelIds.length > 0) {
    const { data: lignesAppels } = await supabase
      .from('lignes_appels_de_fonds')
      .select('coproprietaire_id, montant_du')
      .in('appel_de_fonds_id', appelIds);

    for (const l of lignesAppels ?? []) {
      if (l.coproprietaire_id) {
        montantAppeleByOwner[l.coproprietaire_id] =
          (montantAppeleByOwner[l.coproprietaire_id] ?? 0) + (l.montant_du ?? 0);
      }
    }
  }

  // Dépenses réelles de l'exercice (hors fonds_travaux_alur)
  const { data: depenses } = await supabase
    .from('depenses')
    .select('montant')
    .eq('copropriete_id', coproprieteId)
    .gte('date_depense', exercice.date_debut)
    .lte('date_depense', exercice.date_fin)
    .neq('categorie', 'fonds_travaux_alur');

  const totalReelles = (depenses ?? []).reduce((s, d) => s + d.montant, 0);

  // Récupérer les soldes_reprise et modes existants pour les préserver
  const { data: existingLignes } = await supabase
    .from('regularisation_lignes')
    .select('coproprietaire_id, solde_reprise, mode')
    .eq('exercice_id', exerciceId);

  const existingSoldeReprise: Record<string, number> = Object.fromEntries(
    (existingLignes ?? []).map((l) => [l.coproprietaire_id, l.solde_reprise])
  );
  const existingMode: Record<string, string> = Object.fromEntries(
    (existingLignes ?? []).map((l) => [l.coproprietaire_id, l.mode])
  );

  // Construire les lignes de régularisation
  const rows = (coproprietaires ?? []).map((c) => {
    const tant = tantByOwner[c.id] ?? 0;
    const pct = totalTantiemes > 0 ? tant / totalTantiemes : 0;
    const montantReel = Math.round(totalReelles * pct * 100) / 100;
    const montantAppele = Math.round((montantAppeleByOwner[c.id] ?? 0) * 100) / 100;

    return {
      exercice_id: exerciceId,
      coproprietaire_id: c.id,
      montant_appele: montantAppele,
      montant_reel: montantReel,
      solde_reprise: existingSoldeReprise[c.id] ?? 0,
      mode: existingMode[c.id] ?? 'en_attente',
    };
  });

  if (rows.length > 0) {
    const { error } = await supabase
      .from('regularisation_lignes')
      .upsert(rows, { onConflict: 'exercice_id,coproprietaire_id' });
    if (error) return { error: error.message };
  }

  revalidatePath('/regularisation');
  return {};
}

// ── Mettre à jour le solde de reprise d'une ligne ────────────────────────────
export async function updateSoldeReprise(
  ligneId: string,
  soldeReprise: number
): Promise<RegularisationResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Vérifier accès + exercice non clôturé
  const { data: ligne } = await supabase
    .from('regularisation_lignes')
    .select('exercice_id')
    .eq('id', ligneId)
    .single();
  if (!ligne) return { error: 'Ligne introuvable' };

  const exercice = await assertSyndicOwnsExercice(supabase, ligne.exercice_id, user.id);
  if (!exercice) return { error: 'Accès non autorisé' };
  if (exercice.statut === 'cloture') return { error: 'Exercice clôturé' };

  const { error } = await supabase
    .from('regularisation_lignes')
    .update({ solde_reprise: soldeReprise })
    .eq('id', ligneId);

  if (error) return { error: error.message };
  revalidatePath('/regularisation');
  return {};
}

// ── Mettre à jour le mode de règlement d'une ligne ───────────────────────────
export async function updateModeLigne(
  ligneId: string,
  mode: 'en_attente' | 'imputation' | 'remboursement'
): Promise<RegularisationResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: ligne } = await supabase
    .from('regularisation_lignes')
    .select('exercice_id')
    .eq('id', ligneId)
    .single();
  if (!ligne) return { error: 'Ligne introuvable' };

  const exercice = await assertSyndicOwnsExercice(supabase, ligne.exercice_id, user.id);
  if (!exercice) return { error: 'Accès non autorisé' };
  if (exercice.statut === 'cloture') return { error: 'Exercice clôturé' };

  const { error } = await supabase
    .from('regularisation_lignes')
    .update({ mode })
    .eq('id', ligneId);

  if (error) return { error: error.message };
  revalidatePath('/regularisation');
  return {};
}

// ── Clôturer définitivement un exercice ──────────────────────────────────────
// Met à jour exercices.statut puis répercute la balance de chaque ligne sur
// coproprietaires.solde :  solde = -(montant_reel - montant_appele + solde_reprise)
//   balance > 0 → ils doivent un complément → solde négatif (débit)
//   balance < 0 → trop-perçu → solde positif (crédit)
export async function cloturerExercice(exerciceId: string): Promise<RegularisationResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const exercice = await assertSyndicOwnsExercice(supabase, exerciceId, user.id);
  if (!exercice) return { error: 'Accès non autorisé' };
  if (exercice.statut === 'cloture') return { error: 'Exercice déjà clôturé.' };

  // 1. Clôturer l'exercice
  const { error } = await supabase
    .from('exercices')
    .update({ statut: 'cloture', cloture_at: new Date().toISOString() })
    .eq('id', exerciceId);

  if (error) return { error: error.message };

  // 2. Lire les lignes de régularisation + solde actuel de chaque copropriétaire
  const { data: lignes } = await supabase
    .from('regularisation_lignes')
    .select('coproprietaire_id, balance')
    .eq('exercice_id', exerciceId);

  // 3. Répercuter la balance sur coproprietaires.solde (additif)
  // balance = montant_reel − montant_appele + solde_reprise
  // On ADDITIONNE la balance à l’existant pour ne pas écraser les impayés d’autres exercices.
  // Convention : balance > 0 → complément dû → débit (−) ; balance < 0 → trop-perçu → crédit (+)
  if (lignes && lignes.length > 0) {
    // Lire les soldes actuels en une seule requête
    const copIds = lignes.map((l) => l.coproprietaire_id);
    const { data: copros } = await supabase
      .from('coproprietaires')
      .select('id, solde')
      .in('id', copIds);

    const soldeActuel: Record<string, number> = Object.fromEntries(
      (copros ?? []).map((c) => [c.id, c.solde ?? 0])
    );

    await Promise.all(
      lignes.map((l) => {
        // balance > 0 → complément dû → solde augmente (dette +)
      // balance < 0 → trop-perçu  → solde diminue (crédit −)
      const nouveauSolde = Math.round(
          ((soldeActuel[l.coproprietaire_id] ?? 0) + l.balance) * 100
        ) / 100;
        return supabase
          .from('coproprietaires')
          .update({ solde: nouveauSolde })
          .eq('id', l.coproprietaire_id);
      })
    );
  }

  revalidatePath('/regularisation');
  revalidatePath('/coproprietaires');
  // La clôture modifie les soldes des copropriétaires
  invalidateCoproprietairesCache(exercice.copropriete_id);
  return {};
}
