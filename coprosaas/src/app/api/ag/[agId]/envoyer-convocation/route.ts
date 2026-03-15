import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? 'noreply@syndic-benevole.eu';

export async function POST(req: NextRequest, { params }: { params: Promise<{ agId: string }> }) {
  const { agId } = await params;
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );

  // Récupération de l'AG et ses résolutions
  const { data: ag } = await supabase
    .from('assemblees_generales')
    .select('*, coproprietes(nom, adresse, ville, code_postal)')
    .eq('id', agId)
    .single();

  if (!ag) return NextResponse.json({ message: 'AG introuvable' }, { status: 404 });

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
    .map((r) => `<li><strong>Résolution ${r.numero} :</strong> ${r.titre}${r.description ? `<br><small style="color:#6b7280">${r.description}</small>` : ''}</li>`)
    .join('');

  let sent = 0;
  const errors: string[] = [];

  for (const cp of coproprietaires) {
    const html = `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1f2937">
  <div style="background:#2563eb;padding:24px 32px;border-radius:12px 12px 0 0">
    <h1 style="color:#fff;margin:0;font-size:20px">Convocation à l'Assemblée Générale</h1>
    <p style="color:#bfdbfe;margin:6px 0 0">${ag.coproprietes?.nom}</p>
  </div>
  <div style="background:#fff;padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
    <p>Bonjour <strong>${cp.prenom} ${cp.nom}</strong>,</p>
    <p>Vous êtes convoqué(e) à l'assemblée générale de la copropriété <strong>${ag.coproprietes?.nom}</strong> :</p>
    <div style="background:#f8fafc;border-left:4px solid #2563eb;padding:16px;border-radius:0 8px 8px 0;margin:20px 0">
      <p style="margin:0"><strong>📅 Date :</strong> ${dateFormatted} à ${heureFormatted}</p>
      ${ag.lieu ? `<p style="margin:8px 0 0"><strong>📍 Lieu :</strong> ${ag.lieu}</p>` : ''}
    </div>
    <h3 style="font-size:15px;color:#1f2937;border-bottom:2px solid #e5e7eb;padding-bottom:8px">Ordre du jour</h3>
    <ol style="padding-left:20px;line-height:1.8">${ordreduJour}</ol>
    ${ag.notes ? `<p style="background:#fef9c3;padding:12px;border-radius:8px;font-size:13px"><strong>Notes :</strong> ${ag.notes}</p>` : ''}
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
    <p style="font-size:12px;color:#9ca3af">Le Syndic bénévole — <a href="https://syndic-benevole.eu" style="color:#2563eb">Syndic-Bénévole.eu</a></p>
  </div>
</div>`;

    const { error } = await resend.emails.send({
      from: FROM,
      to: cp.email,
      subject: `Convocation AG — ${ag.coproprietes?.nom} — ${dateFormatted}`,
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
