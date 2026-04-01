// ============================================================
// Route : POST /api/ag/[agId]/terminer
//
// Clôture une AG (statut → terminee) et envoie une notification
// e-mail au syndic pour lui rappeler de créer les appels de fonds.
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { Resend } from 'resend';
import { createClient } from '@/lib/supabase/server';
import {
  buildAGTermineeEmail,
  buildAGTermineeSubject,
} from '@/lib/emails/syndic-notifications';
import { trackResendSendResult } from '@/lib/email-delivery';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = `Mon Syndic Bénévole <${process.env.EMAIL_FROM ?? 'noreply@mon-syndic-benevole.fr'}>`;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ agId: string }> }
) {
  const { agId } = await params;
  const { quorumAtteint } = (await req.json()) as { quorumAtteint: boolean };

  // Vérification de l'authentification
  const authClient = await createClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );

  // Récupère l'AG + copropriété + profil du syndic
  const { data: ag } = await supabase
    .from('assemblees_generales')
    .select(
      'id, date_ag, statut, coproprietes(nom, syndic_id, profiles!coproprietes_syndic_id_fkey(email, full_name))'
    )
    .eq('id', agId)
    .single();

  if (!ag) return NextResponse.json({ message: 'AG introuvable' }, { status: 404 });

  const copro = Array.isArray(ag.coproprietes) ? ag.coproprietes[0] : ag.coproprietes;
  if (!copro || copro.syndic_id !== user.id) {
    return NextResponse.json({ message: 'Accès refusé' }, { status: 403 });
  }

  if (ag.statut === 'terminee') {
    return NextResponse.json({ message: 'AG déjà clôturée' }, { status: 409 });
  }

  // Clôture l'AG
  const { error: updateError } = await supabase
    .from('assemblees_generales')
    .update({ statut: 'terminee', quorum_atteint: quorumAtteint })
    .eq('id', agId);

  if (updateError) {
    return NextResponse.json({ message: 'Erreur lors de la mise à jour' }, { status: 500 });
  }

  // Envoie l'email de notification au syndic (best-effort, non bloquant)
  const profile = Array.isArray(copro.profiles) ? copro.profiles[0] : copro.profiles;
  const syndicEmail = profile?.email;
  if (syndicEmail) {
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.mon-syndic-benevole.fr';
    const prenom = (profile?.full_name ?? '').split(' ')[0] || 'Syndic';
    const subject = buildAGTermineeSubject(copro.nom ?? '');
    await resend.emails
      .send({
        from: FROM,
        to: syndicEmail,
        subject,
        html: buildAGTermineeEmail({
          syndicPrenom: prenom,
          coproprieteNom: copro.nom ?? '',
          dateAG: ag.date_ag,
          appelsDeGondsUrl: `${siteUrl}/appels-de-fonds`,
        }),
      })
      .then((result) => trackResendSendResult(result, {
        templateKey: 'ag_ended_syndic_notification',
        recipientEmail: syndicEmail,
        recipientUserId: user.id,
        subject,
        legalEventType: 'ag_ended_syndic_notification',
        legalReference: agId,
        payload: { quorumAtteint, coproprieteNom: copro.nom ?? '' },
      }))
      .catch((e) => console.error('[ag/terminer] Erreur envoi email syndic:', e));
  }

  return NextResponse.json({ ok: true });
}
