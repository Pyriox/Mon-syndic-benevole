import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Resend } from 'resend';
import { buildIncidentResoluEmail, buildIncidentResoluSubject } from '@/lib/emails/syndic-notifications';
import type { StatutIncident } from '@/types';
import { trackResendSendResult } from '@/lib/email-delivery';
import { getCanonicalSiteUrl } from '@/lib/site-url';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = `Mon Syndic Bénévole <${process.env.EMAIL_FROM ?? 'noreply@mon-syndic-benevole.fr'}>`;
const SITE_URL = getCanonicalSiteUrl();

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
  if (!['ouvert', 'devis_demande', 'devis_recu', 'en_cours', 'resolu'].includes(statut)) {
    return NextResponse.json({ error: 'statut invalide' }, { status: 422 });
  }

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

  // Mise à jour du statut avec whitelist stricte des champs modifiables
  const ALLOWED_EXTRA_FIELDS = new Set([
    'priorite',
    'type_incident',
    'localisation',
    'artisan_nom',
    'artisan_contact',
    'montant_devis',
    'montant_final',
    'date_intervention_prevue',
    'notes_internes',
  ]);
  const safeExtra = Object.fromEntries(
    Object.entries(extra).filter(([key]) => ALLOWED_EXTRA_FIELDS.has(key))
  );
  const payload: Record<string, unknown> = { statut, ...safeExtra };
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
        const subject = buildIncidentResoluSubject(incident.titre);
        const result = await resend.emails.send({
          from: FROM,
          to: declarantEmail,
          subject,
          html: buildIncidentResoluEmail({
            prenomDeclarant: prenom,
            titreIncident: incident.titre,
            coproprieteNom: copro.nom,
            dateResolution: new Date().toISOString(),
            montantFinal: incident.montant_final as number | null,
            incidentsUrl: `${SITE_URL}/incidents`,
          }),
        });
        const tracked = await trackResendSendResult(result, {
          templateKey: 'incident_resolved',
          recipientEmail: declarantEmail,
          recipientUserId: incident.declare_par,
          coproprieteId: incident.copropriete_id,
          subject,
          legalEventType: 'incident_resolved',
          legalReference: incidentId,
          payload: { titreIncident: incident.titre },
        });
        if (!tracked.ok) {
          console.error('[incidents/statut] Email error:', tracked.errorMessage);
        }
      }
    } catch (e) {
      console.error('[incidents/statut] Erreur email résolu:', e);
    }
  }

  return NextResponse.json({ ok: true });
}
