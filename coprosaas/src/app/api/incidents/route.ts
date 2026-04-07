import { NextRequest, NextResponse } from 'next/server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { invalidateDashboardCache } from '@/lib/cached-queries';
import type { NatureIncident, PrioriteIncident, TypeIncident } from '@/types';

const VALID_NATURES: NatureIncident[] = ['incident', 'travaux'];
const VALID_PRIORITIES: PrioriteIncident[] = ['faible', 'moyenne', 'haute', 'urgente'];
const VALID_TYPES: TypeIncident[] = [
  'plomberie',
  'electricite',
  'parties_communes',
  'ascenseur',
  'toiture',
  'securite',
  'espaces_verts',
  'autre',
];

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  let body: {
    copropriete_id?: string;
    nature?: NatureIncident;
    titre?: string;
    description?: string;
    priorite?: PrioriteIncident;
    type_incident?: TypeIncident;
    localisation?: string;
    date_intervention_prevue?: string | null;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const coproprieteId = body.copropriete_id?.trim();
  const titre = body.titre?.trim();
  const description = body.description?.trim() ?? '';
  const nature = body.nature ?? 'incident';
  const priorite = body.priorite ?? 'moyenne';
  const typeIncident = body.type_incident ?? 'autre';
  const localisation = body.localisation?.trim() || null;
  const dateIntervention = body.date_intervention_prevue?.trim() || null;

  if (!coproprieteId || !titre) {
    return NextResponse.json({ error: 'Champs manquants' }, { status: 422 });
  }

  if (!VALID_NATURES.includes(nature)) {
    return NextResponse.json({ error: 'Nature invalide' }, { status: 422 });
  }

  if (!VALID_PRIORITIES.includes(priorite)) {
    return NextResponse.json({ error: 'Priorité invalide' }, { status: 422 });
  }

  if (!VALID_TYPES.includes(typeIncident)) {
    return NextResponse.json({ error: 'Type invalide' }, { status: 422 });
  }

  if (titre.length > 160 || description.length > 5000 || (localisation?.length ?? 0) > 200) {
    return NextResponse.json({ error: 'Contenu trop long' }, { status: 422 });
  }

  if (dateIntervention && Number.isNaN(Date.parse(dateIntervention))) {
    return NextResponse.json({ error: 'Date d’intervention invalide' }, { status: 422 });
  }

  const admin = createAdminClient();
  const { data: copro } = await admin
    .from('coproprietes')
    .select('id')
    .eq('id', coproprieteId)
    .eq('syndic_id', user.id)
    .maybeSingle();

  if (!copro) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  const { data: incident, error } = await admin
    .from('incidents')
    .insert({
      copropriete_id: coproprieteId,
      titre,
      description,
      nature,
      priorite,
      type_incident: typeIncident,
      localisation,
      date_intervention_prevue: nature === 'travaux' ? dateIntervention : null,
      statut: 'ouvert',
      declare_par: user.id,
      date_declaration: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error || !incident) {
    console.error('[incidents/create] insert error:', error?.message);
    return NextResponse.json({ error: 'Erreur lors de la création du suivi' }, { status: 500 });
  }

  invalidateDashboardCache(coproprieteId);

  return NextResponse.json({ ok: true, id: incident.id });
}
