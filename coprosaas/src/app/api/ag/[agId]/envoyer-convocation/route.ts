import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { wrapEmail, infoTable, infoRow, alertBanner, ctaButton, h, COLOR, SITE_URL } from '@/lib/emails/base';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSubscribed } from '@/lib/subscription';
import { trackEmailDelivery } from '@/lib/email-delivery';
import { pushNotification } from '@/lib/notification-center';
import { formatDate, formatTime, getParisYear } from '@/lib/utils';
import { buildConvocationPdfAttachment } from '@/lib/ag-email-pdf';
import { buildConvocationPdfDisplayName } from '@/lib/pdf-filenames';

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

export async function POST(req: NextRequest, { params }: { params: Promise<{ agId: string }> }) {
  const { agId } = await params;

  // Vérification de l'authentification
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });

  const supabase = authClient;

  // Récupération de l'AG et ses résolutions
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
    return NextResponse.json({ message: 'Abonnement requis pour envoyer des convocations' }, { status: 403 });
  }

  if (ag.statut === 'annulee') {
    return NextResponse.json({ message: 'Cette AG est annulée. Envoi de convocation impossible.' }, { status: 409 });
  }

  if (ag.statut !== 'planifiee') {
    return NextResponse.json({ message: 'La convocation ne peut être envoyée que pour une AG planifiée.' }, { status: 409 });
  }

  const { data: resolutions } = await supabase
    .from('resolutions')
    .select('numero, titre, description')
    .eq('ag_id', agId)
    .order('numero');

  // Récupération des copropriétaires de la copropriété
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
  const heureFormatted = formatTime(ag.date_ag);

  const ordreduJour = (resolutions ?? [])
    .map((r) => `
      <tr>
        <td style="padding:10px 12px;font-size:13px;font-weight:600;color:${COLOR.muted};width:24px;vertical-align:top">${r.numero}.</td>
        <td style="padding:10px 12px;font-size:13px;color:${COLOR.text};line-height:1.5">
          ${h(r.titre)}
          ${r.description ? `<div style="margin-top:4px;font-size:12px;color:${COLOR.muted}">${h(r.description)}</div>` : ''}
        </td>
      </tr>`)
    .join('');

  const documentsUrl = `${SITE_URL}/documents`;

  // Archivage de la convocation dans les Documents (best-effort, non bloquant)
  try {
    const admin = createAdminClient();
    const pdfAttachment = buildConvocationPdfAttachment({
      agId,
      coproprieteNom: ag.coproprietes?.nom ?? '',
      titreAg: ag.titre,
      dateAg: ag.date_ag,
      lieu: ag.lieu ?? null,
      notes: ag.notes ?? null,
      resolutions: (resolutions ?? []).map((r) => ({
        numero: r.numero,
        titre: r.titre,
        description: r.description,
      })),
    });

    const rootFolderId = await getOrCreateSubDossier(admin, 'Assemblées Générales', null, user.id);
    if (rootFolderId) {
      const year = String(getParisYear(ag.date_ag) ?? new Date().getFullYear());
      const yearFolderId = await getOrCreateSubDossier(admin, year, rootFolderId, user.id);
      if (yearFolderId) {
        const dateFr = formatDate(ag.date_ag, { day: 'numeric', month: 'long', year: 'numeric' });
        const agFolderName = `${ag.titre} — ${dateFr}`;
        const agFolderId = await getOrCreateSubDossier(admin, agFolderName, yearFolderId, user.id);
        if (agFolderId) {
          const pdfBuffer = Buffer.from(pdfAttachment.content, 'base64');
          const safeName = pdfAttachment.filename.replace(/\.pdf$/i, '')
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9-_]+/g, '-')
            .replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'convocation-ag';
          const storagePath = `${ag.copropriete_id}/${Date.now()}-${safeName}.pdf`;

          const { data: uploadData, error: uploadError } = await admin.storage
            .from('documents')
            .upload(storagePath, pdfBuffer, { contentType: 'application/pdf', cacheControl: '3600', upsert: false });

          if (!uploadError && uploadData) {
            const convNom = buildConvocationPdfDisplayName({
              coproprieteNom: ag.coproprietes?.nom,
              titreAg: ag.titre,
              dateAg: ag.date_ag,
            });
            await admin.from('documents').insert({
              copropriete_id: ag.copropriete_id,
              dossier_id: agFolderId,
              nom: convNom,
              type: 'convocation_ag',
              url: uploadData.path,
              taille: pdfBuffer.byteLength,
              uploaded_by: user.id,
            });
          }
        }
      }
    }
  } catch (e) {
    console.error('[ag/envoyer-convocation] Archivage PDF échoué:', e);
  }

  let sent = 0;
  const errors: string[] = [];

  for (const cp of coproprietaires) {
    const infoRows = infoTable(
      infoRow('Date', `${dateFormatted} à ${heureFormatted}`) +
      (ag.lieu ? infoRow('Lieu', h(ag.lieu)) : '') +
      infoRow('Copropriété', h(ag.coproprietes?.nom ?? ''))
    );

    const content = `
<h1 style="margin:0 0 4px;font-size:22px;font-weight:700;color:${COLOR.text}">Convocation à l'Assemblée Générale</h1>
<p style="margin:0 0 24px;font-size:13px;color:${COLOR.muted}">${h(ag.coproprietes?.nom ?? '')}</p>

<p style="margin:0 0 16px;font-size:14px;color:${COLOR.text};line-height:1.6">
  Bonjour <strong>${h(cp.prenom)} ${h(cp.nom)}</strong>,<br/>
  vous êtes convoqué(e) à l'assemblée générale de votre copropriété.
</p>

${infoRows}

<p style="margin:16px 0 0;font-size:14px;color:${COLOR.text};line-height:1.6">
  Le PDF officiel de convocation est disponible dans votre espace membre, rubrique <strong>Documents</strong>.
</p>

${ctaButton('Consulter mes documents →', documentsUrl, COLOR.blue)}

<h2 style="margin:24px 0 12px;font-size:15px;font-weight:700;color:${COLOR.text}">Ordre du jour</h2>
<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${COLOR.border};border-radius:8px;border-collapse:separate;border-spacing:0;overflow:hidden">
  <tbody>${ordreduJour}</tbody>
</table>

${ag.notes ? alertBanner(h(ag.notes), COLOR.amber, '#fffbeb') : ''}
`;

    const html = wrapEmail(content, COLOR.blue);

    const subject = `Convocation AG — ${h(ag.coproprietes?.nom ?? '')} — ${dateFormatted}`;
    const result = await resend.emails.send({
      from: FROM,
      to: cp.email,
      subject,
      html,
    });

    if (result.error) {
      errors.push(`${cp.email}: ${result.error.message}`);
      await trackEmailDelivery({
        templateKey: 'ag_convocation',
        status: 'failed',
        recipientEmail: cp.email,
        recipientUserId: cp.user_id,
        coproprieteId: ag.copropriete_id,
        agId,
        subject,
        legalEventType: 'convocation_ag',
        legalReference: agId,
        payload: { agTitle: ag.titre, dateAg: ag.date_ag },
        lastError: result.error.message,
      });
    } else {
      sent++;
      await trackEmailDelivery({
        providerMessageId: result.data?.id,
        templateKey: 'ag_convocation',
        status: 'sent',
        recipientEmail: cp.email,
        recipientUserId: cp.user_id,
        coproprieteId: ag.copropriete_id,
        agId,
        subject,
        legalEventType: 'convocation_ag',
        legalReference: agId,
        payload: { agTitle: ag.titre, dateAg: ag.date_ag },
      });
    }
  }

  // Marquer la date du dernier envoi (côté serveur — le client fait la même chose en parallèle)
  if (sent > 0) {
    await supabase
      .from('assemblees_generales')
      .update({ convocation_envoyee_le: new Date().toISOString() } as Record<string, unknown>)
      .eq('id', agId);

    await pushNotification({
      userId: user.id,
      coproprieteId: ag.copropriete_id,
      type: 'ag',
      severity: 'info',
      title: 'Convocations AG envoyees',
        body: `${sent} convocation(s) envoyee(s) par e-mail`,
      href: '/assemblees',
      actionLabel: 'Ouvrir',
      metadata: { agId, sent, failed: errors.length },
    });
  }

  const wasAlreadySent = !!(ag as Record<string, unknown>).convocation_envoyee_le;

  const failed = errors.length;

  return NextResponse.json({
    message: failed
      ? `${sent} convocation(s) envoyée(s), ${failed} échec(s).`
      : `${sent} convocation(s) envoyée(s) avec succès.`,
    sent,
    failed,
    errors,
    alreadySentAt: wasAlreadySent ? (ag as Record<string, unknown>).convocation_envoyee_le : null,
  }, { status: sent === 0 && failed > 0 ? 500 : 200 });
}
