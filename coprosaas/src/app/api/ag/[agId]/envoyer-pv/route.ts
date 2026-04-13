import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Resend } from 'resend';
import { wrapEmail, infoTable, infoRow, alertBanner, h, COLOR } from '@/lib/emails/base';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSubscribed } from '@/lib/subscription';
import { trackEmailDelivery } from '@/lib/email-delivery';
import { pushNotification } from '@/lib/notification-center';
import { formatDate, getParisYear } from '@/lib/utils';
import { buildPVPdfAttachment } from '@/lib/ag-email-pdf';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = `Mon Syndic Bénévole <${process.env.EMAIL_FROM ?? 'noreply@mon-syndic-benevole.fr'}>`;

const STATUT_LABELS: Record<string, { label: string; color: string }> = {
  approuvee: { label: 'Approuvée', color: COLOR.green },
  refusee:   { label: 'Refusée',   color: COLOR.red },
  reportee:  { label: 'Reportée',  color: COLOR.amber },
  en_attente:{ label: 'En attente',color: COLOR.muted },
};

function sanitizeFileName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase() || 'document';
}

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

async function getDossierAGDocuments(
  admin: ReturnType<typeof createAdminClient>,
  syndicId: string,
  dateAg: string,
  titreAg: string,
): Promise<string | null> {
  const rootId = await getOrCreateSubDossier(admin, 'Assemblées Générales', null, syndicId);
  if (!rootId) return null;

  const year = String(getParisYear(dateAg) ?? new Date().getFullYear());
  const yearId = await getOrCreateSubDossier(admin, year, rootId, syndicId);
  if (!yearId) return null;

  const dateFr = formatDate(dateAg, { day: 'numeric', month: 'long', year: 'numeric' });
  const agFolderName = `${titreAg} — ${dateFr}`;
  return getOrCreateSubDossier(admin, agFolderName, yearId, syndicId);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ agId: string }> }) {
  const { agId } = await params;
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

  const { data: ag } = await supabase
    .from('assemblees_generales')
    .select('*, coproprietes(nom, adresse, ville, code_postal, syndic_id, plan)')
    .eq('id', agId)
    .single();

  if (!ag) return NextResponse.json({ message: 'AG introuvable' }, { status: 404 });

  // Vérification que l'utilisateur est bien le syndic de cette copropriété
  const copros = ag.coproprietes as { syndic_id: string; plan: string | null } | null;
  if (copros?.syndic_id !== user.id) {
    return NextResponse.json({ message: 'Accès refusé' }, { status: 403 });
  }

  // Vérification de l'abonnement actif
  if (!isSubscribed(copros?.plan)) {
    return NextResponse.json({ message: 'Abonnement requis pour envoyer le PV' }, { status: 403 });
  }

  if (ag.statut === 'annulee') {
    return NextResponse.json({ message: 'Cette AG est annulée. Envoi du PV impossible.' }, { status: 409 });
  }

  if (ag.statut !== 'terminee') {
    return NextResponse.json({ message: 'Le PV ne peut être envoyé que pour une AG terminée.' }, { status: 409 });
  }

  const { data: resolutions } = await supabase
    .from('resolutions')
    .select('numero, titre, statut, voix_pour, voix_contre, voix_abstention')
    .eq('ag_id', agId)
    .order('numero');

  const { data: coproprietaires } = await supabase
    .from('coproprietaires')
    .select('nom, prenom, email, user_id')
    .eq('copropriete_id', ag.copropriete_id)
    .not('email', 'is', null);

  if (!coproprietaires?.length) {
    return NextResponse.json({ message: 'Aucun copropriétaire avec email trouvé.' }, { status: 422 });
  }

  const dateFormatted = formatDate(ag.date_ag, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const tableauResolutions = (resolutions ?? []).map((r) => {
    const statut = STATUT_LABELS[r.statut] ?? { label: r.statut, color: COLOR.muted };
    return `
    <tr style="border-bottom:1px solid ${COLOR.border}">
      <td style="padding:10px 12px;font-size:13px;font-weight:600;color:${COLOR.muted};white-space:nowrap">#${r.numero}</td>
      <td style="padding:10px 12px;font-size:13px;color:${COLOR.text}">${h(r.titre)}</td>
      <td style="padding:10px 12px;font-size:12px;font-weight:700;color:${statut.color};white-space:nowrap">${statut.label}</td>
      <td style="padding:10px 12px;font-size:12px;color:${COLOR.muted};white-space:nowrap">${r.voix_pour}+ / ${r.voix_contre}− / ${r.voix_abstention}=</td>
    </tr>`;
  }).join('');

  const admin = createAdminClient();
  const pdfAttachment = buildPVPdfAttachment({
    agId,
    coproprieteNom: ag.coproprietes?.nom ?? '',
    titreAg: ag.titre,
    dateAg: ag.date_ag,
    lieu: ag.lieu,
    quorumAtteint: ag.quorum_atteint,
    notes: ag.notes,
    resolutions: (resolutions ?? []).map((r) => ({
      numero: r.numero,
      titre: r.titre,
      statut: r.statut,
      voix_pour: r.voix_pour,
      voix_contre: r.voix_contre,
      voix_abstention: r.voix_abstention,
    })),
  });

  let documentStored = false;
  let documentStoreError: string | null = null;

  try {
    const dossierId = await getDossierAGDocuments(admin, user.id, ag.date_ag, ag.titre);
    const pdfBuffer = Buffer.from(pdfAttachment.content, 'base64');
    const safeName = sanitizeFileName(pdfAttachment.filename.replace(/\.pdf$/i, ''));
    const storagePath = `${ag.copropriete_id}/${Date.now()}-${safeName}.pdf`;

    const { data: uploadData, error: uploadError } = await admin.storage
      .from('documents')
      .upload(storagePath, pdfBuffer, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) throw new Error(uploadError.message);

    const { data: { publicUrl } } = admin.storage.from('documents').getPublicUrl(uploadData.path);
    const pvNom = `PV AG — ${ag.coproprietes?.nom ?? ''} — ${getParisYear(ag.date_ag) ?? new Date().getFullYear()}`;
    const { error: documentError } = await admin.from('documents').upsert({
      copropriete_id: ag.copropriete_id,
      dossier_id: dossierId,
      nom: pvNom,
      type: 'pv_ag',
      url: publicUrl,
      taille: pdfBuffer.byteLength,
      uploaded_by: user.id,
    }, { onConflict: 'nom,copropriete_id' });

    if (documentError) throw new Error(documentError.message);
    documentStored = true;
  } catch (error) {
    documentStoreError = error instanceof Error ? error.message : 'Erreur inconnue';
    console.error('[ag/envoyer-pv] archive error:', documentStoreError);
  }

  let sent = 0;
  const errors: string[] = [];

  for (const cp of coproprietaires) {
    const infoRows = infoTable(
      infoRow('Date', dateFormatted) +
      (ag.lieu ? infoRow('Lieu', h(ag.lieu)) : '') +
      infoRow('Quorum', ag.quorum_atteint ? 'Atteint' : 'Non atteint')
    );

    const content = `
<h1 style="margin:0 0 4px;font-size:22px;font-weight:700;color:${COLOR.text}">Procès-Verbal d'Assemblée Générale</h1>
<p style="margin:0 0 24px;font-size:13px;color:${COLOR.muted}">${h(ag.coproprietes?.nom ?? '')}</p>

<p style="margin:0 0 16px;font-size:14px;color:${COLOR.text};line-height:1.6">
  Bonjour <strong>${h(cp.prenom)} ${h(cp.nom)}</strong>,<br/>
  veuillez trouver ci-dessous le procès-verbal de l'assemblée générale.
</p>

${infoRows}

<h2 style="margin:24px 0 12px;font-size:15px;font-weight:700;color:${COLOR.text}">Résolutions votées</h2>
<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${COLOR.border};border-radius:8px;border-collapse:separate;border-spacing:0;overflow:hidden">
  <thead>
    <tr style="background:#f9fafb">
      <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:600;color:${COLOR.muted};letter-spacing:.05em">N°</th>
      <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:600;color:${COLOR.muted};letter-spacing:.05em">Résolution</th>
      <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:600;color:${COLOR.muted};letter-spacing:.05em">Résultat</th>
      <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:600;color:${COLOR.muted};letter-spacing:.05em">Votes</th>
    </tr>
  </thead>
  <tbody>${tableauResolutions}</tbody>
</table>

${ag.notes ? alertBanner(h(ag.notes), COLOR.amber, '#fffbeb') : ''}
`;

    const html = wrapEmail(content, COLOR.green);

    const subject = `PV AG — ${ag.coproprietes?.nom} — ${dateFormatted}`;
    const result = await resend.emails.send({
      from: FROM,
      to: cp.email,
      subject,
      html,
      attachments: [pdfAttachment],
    });

    if (result.error) {
      errors.push(`${cp.email}: ${result.error.message}`);
      await trackEmailDelivery({
        templateKey: 'ag_pv',
        status: 'failed',
        recipientEmail: cp.email,
        recipientUserId: cp.user_id,
        coproprieteId: ag.copropriete_id,
        agId,
        subject,
        legalEventType: 'pv_ag',
        legalReference: agId,
        payload: { agTitle: ag.titre, dateAg: ag.date_ag },
        lastError: result.error.message,
      });
    } else {
      sent++;
      await trackEmailDelivery({
        providerMessageId: result.data?.id,
        templateKey: 'ag_pv',
        status: 'sent',
        recipientEmail: cp.email,
        recipientUserId: cp.user_id,
        coproprieteId: ag.copropriete_id,
        agId,
        subject,
        legalEventType: 'pv_ag',
        legalReference: agId,
        payload: { agTitle: ag.titre, dateAg: ag.date_ag },
      });
    }
  }

  // Marquer la date du dernier envoi (côté serveur — le client fait la même chose en parallèle)
  if (sent > 0) {
    await supabase
      .from('assemblees_generales')
      .update({ pv_envoye_le: new Date().toISOString() } as Record<string, unknown>)
      .eq('id', agId);

    await pushNotification({
      userId: user.id,
      coproprieteId: ag.copropriete_id,
      type: 'ag',
      severity: 'info',
      title: 'PV AG envoye',
        body: `${sent} PV envoye(s) par e-mail`,
      href: '/assemblees',
      actionLabel: 'Ouvrir',
      metadata: { agId, sent, failed: errors.length },
    });
  }

  const wasAlreadySent = !!(ag as Record<string, unknown>).pv_envoye_le;

  const failed = errors.length;

  const archiveMessage = documentStored
    ? ' Le PDF a bien été archivé dans Documents.'
    : documentStoreError
      ? ' Attention : le PV a été envoyé mais son archivage dans Documents a échoué.'
      : '';

  return NextResponse.json({
    message: (failed
      ? `${sent} PV envoyé(s), ${failed} échec(s).`
      : `PV envoyé à ${sent} copropriétaire(s) avec succès.`) + archiveMessage,
    sent,
    failed,
    errors,
    documentStored,
    documentStoreError,
    alreadySentAt: wasAlreadySent ? (ag as Record<string, unknown>).pv_envoye_le : null,
  }, { status: sent === 0 && failed > 0 ? 500 : 200 });
}
