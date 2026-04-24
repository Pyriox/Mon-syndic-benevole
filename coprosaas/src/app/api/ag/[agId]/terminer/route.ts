// ============================================================
// Route : POST /api/ag/[agId]/terminer
//
// Clôture une AG (statut → terminee) et envoie une notification
// e-mail au syndic pour lui rappeler de créer les appels de fonds.
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logEventForEmail } from '@/lib/actions/log-user-event';
import {
  buildAGTermineeEmail,
  buildAGTermineeSubject,
} from '@/lib/emails/syndic-notifications';
import { trackResendSendResult } from '@/lib/email-delivery';
import { getCanonicalSiteUrl } from '@/lib/site-url';
import { pushNotification } from '@/lib/notification-center';
import { buildPVPdfAttachment } from '@/lib/ag-email-pdf';
import { buildPvPdfDisplayName } from '@/lib/pdf-filenames';
import { formatDate, getParisYear } from '@/lib/utils';
const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = `Mon Syndic Bénévole <${process.env.EMAIL_FROM ?? 'noreply@mon-syndic-benevole.fr'}>`;

async function getOrCreateSubDossier(
  admin: ReturnType<typeof createAdminClient>,
  nom: string,
  parentId: string | null,
  syndicId: string,
): Promise<string | null> {
  const base = admin.from('document_dossiers').select('id').eq('syndic_id', syndicId).eq('nom', nom);
  const query = parentId ? base.eq('parent_id', parentId) : base.is('parent_id', null);
  const { data: existing } = await query.maybeSingle();
  if (existing?.id) return existing.id;

  const payload: Record<string, string | boolean | null> = { nom, syndic_id: syndicId, is_default: false };
  if (parentId) payload.parent_id = parentId;

  const { data: created } = await admin.from('document_dossiers').insert(payload).select('id').single();
  return created?.id ?? null;
}

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

  const supabase = authClient;

  // Récupère l'AG + copropriété + profil du syndic
  const { data: ag } = await supabase
    .from('assemblees_generales')
    .select(
      'id, titre, date_ag, lieu, notes, statut, quorum_atteint, copropriete_id, coproprietes(nom, syndic_id, profiles!coproprietes_syndic_id_fkey(email, full_name))'
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

  if (ag.statut === 'annulee') {
    return NextResponse.json({ message: 'AG annulée : clôture impossible.' }, { status: 409 });
  }

  if (ag.statut !== 'en_cours') {
    return NextResponse.json({ message: 'Seule une AG en cours peut être clôturée.' }, { status: 409 });
  }

  // Clôture l'AG
  const { error: updateError } = await supabase
    .from('assemblees_generales')
    .update({ statut: 'terminee', quorum_atteint: quorumAtteint })
    .eq('id', agId);

  if (updateError) {
    return NextResponse.json({ message: 'Erreur lors de la mise à jour' }, { status: 500 });
  }

  // Archivage automatique du PV dans les Documents (best-effort, non bloquant)
  try {
    const admin = createAdminClient();

    const { data: resolutionsPV } = await supabase
      .from('resolutions')
      .select('numero, titre, statut, voix_pour, voix_contre, voix_abstention')
      .eq('ag_id', agId)
      .order('numero');

    const pdfAttachment = buildPVPdfAttachment({
      agId,
      coproprieteNom: copro.nom ?? '',
      titreAg: (ag as { titre?: string }).titre ?? '',
      dateAg: ag.date_ag,
      lieu: (ag as { lieu?: string | null }).lieu ?? null,
      quorumAtteint,
      notes: (ag as { notes?: string | null }).notes ?? null,
      resolutions: (resolutionsPV ?? []).map((r) => ({
        numero: r.numero,
        titre: r.titre,
        statut: r.statut,
        voix_pour: r.voix_pour,
        voix_contre: r.voix_contre,
        voix_abstention: r.voix_abstention,
      })),
    });

    // Créer/récupérer le dossier AG dans Documents
    const agDateValue = ag.date_ag;
    const agTitre = (ag as { titre?: string }).titre ?? '';
    const rootFolderId = await getOrCreateSubDossier(admin, 'Assemblées Générales', null, user.id);
    if (rootFolderId) {
      const year = String(getParisYear(agDateValue) ?? new Date().getFullYear());
      const yearFolderId = await getOrCreateSubDossier(admin, year, rootFolderId, user.id);
      if (yearFolderId) {
        const dateFr = formatDate(agDateValue, { day: 'numeric', month: 'long', year: 'numeric' });
        const agFolderName = `${agTitre} — ${dateFr}`;
        const agFolderId = await getOrCreateSubDossier(admin, agFolderName, yearFolderId, user.id);
        if (agFolderId && ag.copropriete_id) {
          const pdfBuffer = Buffer.from(pdfAttachment.content, 'base64');
          const safeName = pdfAttachment.filename.replace(/\.pdf$/i, '')
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9-_]+/g, '-')
            .replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'pv-ag';
          const storagePath = `${ag.copropriete_id}/${Date.now()}-${safeName}.pdf`;

          const { data: uploadData, error: uploadError } = await admin.storage
            .from('documents')
            .upload(storagePath, pdfBuffer, { contentType: 'application/pdf', cacheControl: '3600', upsert: false });

          if (!uploadError && uploadData) {
            const pvNom = buildPvPdfDisplayName({ coproprieteNom: copro.nom, titreAg: agTitre, dateAg: agDateValue });
            await admin.from('documents').insert({
              copropriete_id: ag.copropriete_id,
              dossier_id: agFolderId,
              nom: pvNom,
              type: 'pv_ag',
              url: uploadData.path,
              taille: pdfBuffer.byteLength,
              uploaded_by: user.id,
            });
          }
        }
      }
    }
  } catch (e) {
    console.error('[ag/terminer] Archivage PV échoué:', e);
  }

  if (user.email) {
    await logEventForEmail({
      email: user.email,
      eventType: 'ag_status_changed',
      label: `Statut AG modifié : ${ag.statut} → terminee`,
      metadata: { agId, coproId: copro.syndic_id, oldStatus: ag.statut, newStatus: 'terminee', quorumAtteint },
    });
  }

  // Notification si des résolutions de révision ont été approuvées
  // ET qu'il existe déjà des appels publiés/confirmés cette année (sinon le syndic créera de zéro avec les bons montants)
  const { data: revisionResolutions } = await supabase
    .from('resolutions')
    .select('id')
    .eq('ag_id', agId)
    .in('type_resolution', ['revision_budget', 'revision_fonds_travaux'])
    .eq('statut', 'approuvee')
    .limit(1);

  const coproprieteId = (ag as { copropriete_id?: string }).copropriete_id;
  let hasExistingAppels = false;
  if (revisionResolutions?.length && coproprieteId) {
    const agYear = ag.date_ag ? new Date(ag.date_ag).getFullYear() : new Date().getFullYear();
    const { count } = await supabase
      .from('appels_de_fonds')
      .select('id', { count: 'exact', head: true })
      .eq('copropriete_id', coproprieteId)
      .in('statut', ['publie', 'confirme'])
      .gte('created_at', `${agYear}-01-01T00:00:00.000Z`)
      .lt('created_at', `${agYear + 1}-01-01T00:00:00.000Z`);
    hasExistingAppels = (count ?? 0) > 0;
  }

  if (revisionResolutions?.length && hasExistingAppels) {
    const dateAGFormatted = ag.date_ag
      ? new Date(ag.date_ag).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : 'cette AG';
    await pushNotification({
      userId: user.id,
      coproprieteId: coproprieteId ?? null,
      type: 'revision_budget_alerte',
      severity: 'warning',
      title: 'Révision votée — ajustez vos appels de fonds',
      body: `Une révision budgétaire a été votée en AG du ${dateAGFormatted}. Vérifiez et ajustez vos prochains appels de fonds.`,
      href: '/appels-de-fonds',
      actionLabel: 'Voir les appels',
      metadata: { agId, agDate: ag.date_ag },
    });
  }

  // Envoie l'email de notification au syndic (best-effort, non bloquant)
  const profile = Array.isArray(copro.profiles) ? copro.profiles[0] : copro.profiles;
  const syndicEmail = profile?.email;
  if (syndicEmail) {
    const siteUrl = getCanonicalSiteUrl();
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
          agUrl: `${siteUrl}/assemblees/${agId}`,
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
