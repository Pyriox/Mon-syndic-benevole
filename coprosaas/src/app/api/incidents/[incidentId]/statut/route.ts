import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Resend } from 'resend';
import { buildIncidentResoluEmail, buildIncidentResoluSubject } from '@/lib/emails/syndic-notifications';
import type { StatutIncident } from '@/types';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = `Mon Syndic Bénévole <${process.env.EMAIL_FROM ?? 'noreply@mon-syndic-benevole.fr'}>`;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.mon-syndic-benevole.fr';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ incidentId: string }> }
) {
  const { incidentId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const body = await req.json() as { statut: StatutIncident } & Record<string, unknown>;
  const { statut, ...extra } = body;
  if (!statut) return NextResponse.json({ error: 'statut requis' }, { status: 400 });

  const admin = createAdminClient();

  // Vérifier que l'incident existe et appartient à une copropriété du syndic
  const { data: incident } = await admin
    .from('incidents')
    .select('id, copropriete_id, titre, declare_par, montant_final')
    .eq('id', incidentId)
    .maybeSingle();
  if (!incident) return NextResponse.json({ error: 'Incident introuvable' }, { status: 404 });

  const { data: copro } = await admin
    .from('coproprietes')
    .select('id, nom')
    .eq('id', incident.copropriete_id)
    .eq('syndic_id', user.id)
    .maybeSingle();
  if (!copro) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

  // Mise à jour du statut
  const payload: Record<string, unknown> = { statut, ...extra };
  if (statut === 'resolu') payload.date_resolution = new Date().toISOString();
  if (statut === 'ouvert') payload.date_resolution = null;

  const { error: updateError } = await admin
    .from('incidents')
    .update(payload)
    .eq('id', incidentId);

  if (updateError) {
    return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
  }

  // Notification email au déclarant si l'incident est résolu
  if (statut === 'resolu' && incident.declare_par) {
    try {
      const { data: { user: declarant } } = await admin.auth.admin.getUserById(incident.declare_par);
      const declarantEmail = declarant?.email;
      if (declarantEmail) {
        const prenom = (declarant?.user_metadata?.full_name as string | undefined)?.split(' ')[0] ?? null;
        resend.emails.send({
          from: FROM,
          to: declarantEmail,
          subject: buildIncidentResoluSubject(incident.titre),
          html: buildIncidentResoluEmail({
            prenomDeclarant: prenom,
            titreIncident: incident.titre,
            coproprieteNom: copro.nom,
            dateResolution: new Date().toISOString(),
            montantFinal: incident.montant_final as number | null,
            incidentsUrl: `${SITE_URL}/incidents`,
          }),
        }).catch((e) => console.error('[incidents/statut] Email error:', e));
      }
    } catch (e) {
      console.error('[incidents/statut] Erreur email résolu:', e);
    }
  }

  return NextResponse.json({ ok: true });
}
