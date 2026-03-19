import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Resend } from 'resend';
import { wrapEmail, infoTable, infoRow, alertBanner, h, COLOR } from '@/lib/emails/base';
import { createClient } from '@/lib/supabase/server';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? 'noreply@mon-syndic-benevole.fr';

const STATUT_LABELS: Record<string, { label: string; color: string }> = {
  approuvee: { label: 'Approuvée', color: COLOR.green },
  refusee:   { label: 'Refusée',   color: COLOR.red },
  reportee:  { label: 'Reportée',  color: COLOR.amber },
  en_attente:{ label: 'En attente',color: COLOR.muted },
};

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
    .select('*, coproprietes(nom, adresse, ville, code_postal, syndic_id)')
    .eq('id', agId)
    .single();

  if (!ag) return NextResponse.json({ message: 'AG introuvable' }, { status: 404 });

  // Vérification que l'utilisateur est bien le syndic de cette copropriété
  const copros = ag.coproprietes as { syndic_id: string } | null;
  if (copros?.syndic_id !== user.id) {
    return NextResponse.json({ message: 'Accès refusé' }, { status: 403 });
  }

  const { data: resolutions } = await supabase
    .from('resolutions')
    .select('numero, titre, statut, voix_pour, voix_contre, voix_abstention')
    .eq('ag_id', agId)
    .order('numero');

  const { data: coproprietaires } = await supabase
    .from('coproprietaires')
    .select('nom, prenom, email')
    .eq('copropriete_id', ag.copropriete_id)
    .not('email', 'is', null);

  if (!coproprietaires?.length) {
    return NextResponse.json({ message: 'Aucun copropriétaire avec email trouvé.' }, { status: 422 });
  }

  const dateFormatted = new Date(ag.date_ag).toLocaleDateString('fr-FR', {
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

  // Sauvegarde dans les documents de la copropriété
  const pvNom = `PV AG — ${ag.titre} — ${new Date(ag.date_ag).getFullYear()}`;
  const { data: dossier } = await supabase
    .from('document_dossiers')
    .select('id')
    .eq('nom', 'PV Assemblées Générales')
    .eq('syndic_id', ag.coproprietes?.syndic_id ?? '')
    .maybeSingle();

  if (dossier) {
    await supabase.from('documents').upsert({
      copropriete_id: ag.copropriete_id,
      dossier_id: dossier.id,
      nom: pvNom,
      type: 'pv_ag',
      url: `/assemblees/${agId}`,
      taille: 0,
    }, { onConflict: 'nom,copropriete_id' });
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

    const { error } = await resend.emails.send({
      from: FROM,
      to: cp.email,
      subject: `PV AG — ${ag.coproprietes?.nom} — ${dateFormatted}`,
      html,
    });

    if (error) errors.push(`${cp.email}: ${error.message}`);
    else sent++;
  }

  return NextResponse.json({
    message: errors.length
      ? `${sent} email(s) envoyé(s), ${errors.length} échec(s) : ${errors.join('; ')}`
      : `PV envoyé à ${sent} copropriétaire(s) avec succès.`,
  });
}
