import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Resend } from 'resend';
import { wrapEmail, infoTable, infoRow, alertBanner, h, COLOR } from '@/lib/emails/base';
import { createClient } from '@/lib/supabase/server';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? 'noreply@mon-syndic-benevole.fr';

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

  // Récupération de l'AG et ses résolutions
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
    .select('numero, titre, description')
    .eq('ag_id', agId)
    .order('numero');

  // Récupération des copropriétaires de la copropriété
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
  const heureFormatted = new Date(ag.date_ag).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

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

<h2 style="margin:24px 0 12px;font-size:15px;font-weight:700;color:${COLOR.text}">Ordre du jour</h2>
<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${COLOR.border};border-radius:8px;border-collapse:separate;border-spacing:0;overflow:hidden">
  <tbody>${ordreduJour}</tbody>
</table>

${ag.notes ? alertBanner(h(ag.notes), COLOR.amber, '#fffbeb') : ''}
`;

    const html = wrapEmail(content, COLOR.blue);

    const { error } = await resend.emails.send({
      from: FROM,
      to: cp.email,
      subject: `Convocation AG — ${h(ag.coproprietes?.nom ?? '')} — ${dateFormatted}`,
      html,
    });

    if (error) errors.push(`${cp.email}: ${error.message}`);
    else sent++;
  }

  return NextResponse.json({
    message: errors.length
      ? `${sent} email(s) envoyé(s), ${errors.length} échec(s) : ${errors.join('; ')}`
      : `${sent} convocation(s) envoyée(s) avec succès.`,
  });
}
