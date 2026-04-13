import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Resend } from 'resend';
import { createClient } from '@/lib/supabase/server';
import { isSubscribed } from '@/lib/subscription';
import { buildAppelEmail, buildAppelEmailSubject } from '@/lib/emails/appel-de-fonds';
import { trackEmailDelivery } from '@/lib/email-delivery';
import { pushNotification } from '@/lib/notification-center';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = `Mon Syndic Bénévole <${process.env.EMAIL_FROM ?? 'noreply@mon-syndic-benevole.fr'}>`;

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ appelId: string }> }
) {
  const { appelId } = await params;
  const cookieStore = await cookies();

  // Vérification de l'authentification
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );

  // Récupérer l'appel de fonds + copropriété
  const { data: appel } = await supabase
    .from('appels_de_fonds')
    .select('*, coproprietes(nom, adresse, ville, code_postal, syndic_id, plan)')
    .eq('id', appelId)
    .single();

  if (!appel) return NextResponse.json({ message: 'Appel de fonds introuvable' }, { status: 404 });

  // Vérification que l'utilisateur est bien le syndic de cette copropriété
  const copros = appel.coproprietes as { syndic_id: string; plan: string | null } | null;
  if (copros?.syndic_id !== user.id) {
    return NextResponse.json({ message: 'Accès refusé' }, { status: 403 });
  }

  // Vérification de l'abonnement actif
  if (!isSubscribed(copros?.plan)) {
    return NextResponse.json({ message: 'Abonnement requis pour envoyer des avis de fonds' }, { status: 403 });
  }

  if (appel.statut === 'annulee') {
    return NextResponse.json({ message: 'Cet appel est annulé. Aucun envoi n\'est possible.' }, { status: 409 });
  }

  if (appel.statut === 'brouillon') {
    return NextResponse.json({ message: 'Cet appel est en brouillon. Émettez-le avant envoi.' }, { status: 409 });
  }

  // Récupérer les lignes avec copropriétaires (email + user_id pour fallback auth)
  const { data: lignes } = await supabase
    .from('lignes_appels_de_fonds')
    .select('montant_du, regularisation_ajustement, paye, coproprietaires(nom, prenom, email, user_id)')
    .eq('appel_de_fonds_id', appelId);

  const destinataires: { nom: string; prenom: string; email: string; montant_du: number; regularisation_ajustement: number; paye: boolean }[] = [];
  for (const l of lignes ?? []) {
    const c = Array.isArray(l.coproprietaires)
      ? l.coproprietaires[0] as { nom: string; prenom: string; email: string; user_id: string | null } | undefined
      : l.coproprietaires as { nom: string; prenom: string; email: string; user_id: string | null } | null;
    if (!c) continue;
    let email = c.email ?? '';
    // Fallback : récupérer l’e-mail depuis auth.users si le champ est vide
    if (!email && c.user_id) {
      const { data: authData } = await supabase.auth.admin.getUserById(c.user_id);
      email = authData?.user?.email ?? '';
    }
    if (!email) continue;
    destinataires.push({
      nom: c.nom,
      prenom: c.prenom,
      email,
      montant_du: l.montant_du,
      regularisation_ajustement: l.regularisation_ajustement ?? 0,
      paye: l.paye,
    });
  }

  if (!destinataires.length) {
    const total = (lignes ?? []).length;
    return NextResponse.json({
      message: total === 0
        ? 'Aucune répartition générée pour cet appel. Cliquez sur « Détail » puis « Générer la répartition ».'
        : `${total} copropriétaire(s) trouvé(s) mais aucun n’a d’adresse e-mail renseignée.`,
    }, { status: 422 });
  }

  const coproprieteNom = appel.coproprietes?.nom ?? '';

  let sent = 0;
  const errors: string[] = [];

  for (const dest of destinataires) {
    if (dest.paye) continue; // Ne pas relancer les copropriétaires ayant déjà payé

    const subject = buildAppelEmailSubject({
      type: 'avis',
      coproprieteNom,
      dateEcheance: appel.date_echeance,
    });

    const result = await resend.emails.send({
      from: FROM,
      to: dest.email,
      subject,
      html: buildAppelEmail({
        type: 'avis',
        prenom: dest.prenom,
        nom: dest.nom,
        coproprieteNom,
        titre: appel.titre,
        montantDu: dest.montant_du,
        regularisationAjustement: dest.regularisation_ajustement,
        dateEcheance: appel.date_echeance,
      }),
    });

    if (result.error) {
      errors.push(`${dest.email}: ${result.error.message}`);
      await trackEmailDelivery({
        templateKey: 'appel_avis',
        status: 'failed',
        recipientEmail: dest.email,
        coproprieteId: appel.copropriete_id,
        appelDeFondsId: appelId,
        subject,
        legalEventType: 'appel_de_fonds_avis',
        legalReference: appelId,
        payload: { type: 'manual_send' },
        lastError: result.error.message,
      });
    } else {
      sent++;
      await trackEmailDelivery({
        providerMessageId: result.data?.id,
        templateKey: 'appel_avis',
        status: 'sent',
        recipientEmail: dest.email,
        coproprieteId: appel.copropriete_id,
        appelDeFondsId: appelId,
        subject,
        legalEventType: 'appel_de_fonds_avis',
        legalReference: appelId,
        payload: { type: 'manual_send' },
      });
    }
  }

  // Enregistrer la date d'envoi (nécessite la colonne emailed_at sur appels_de_fonds)
  if (sent > 0) {
    await supabase.from('appels_de_fonds')
      .update({ emailed_at: new Date().toISOString() } as Record<string, unknown>)
      .eq('id', appelId);

    await pushNotification({
      userId: user.id,
      coproprieteId: appel.copropriete_id,
      type: 'appel_fonds',
      severity: 'info',
      title: 'Avis d\'appel de fonds envoyes',
        body: `${sent} avis envoye(s) par e-mail`,
      href: '/appels-de-fonds',
      actionLabel: 'Ouvrir',
      metadata: { appelId, sent, failed: errors.length },
    });
  }

  return NextResponse.json({
    message: errors.length
      ? `${sent} e-mail(s) envoyé(s), ${errors.length} échec(s) : ${errors.join('; ')}`
      : `${sent} e-mail(s) envoyé(s) avec succès.`,
  });
}
