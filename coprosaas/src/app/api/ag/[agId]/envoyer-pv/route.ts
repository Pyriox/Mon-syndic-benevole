import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? 'noreply@mon-syndic-benevole.fr';

const STATUT_LABELS: Record<string, string> = {
  approuvee: 'APPROUVÉE ✅',
  refusee: 'REFUSÉE ❌',
  reportee: 'REPORTÉE ⏸',
  en_attente: 'EN ATTENTE',
};

export async function POST(req: NextRequest, { params }: { params: Promise<{ agId: string }> }) {
  const { agId } = await params;
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );

  const { data: ag } = await supabase
    .from('assemblees_generales')
    .select('*, coproprietes(nom, adresse, ville, code_postal)')
    .eq('id', agId)
    .single();

  if (!ag) return NextResponse.json({ message: 'AG introuvable' }, { status: 404 });

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

  const tableauResolutions = (resolutions ?? []).map((r) => `
    <tr style="border-bottom:1px solid #e5e7eb">
      <td style="padding:10px 12px;font-size:13px"><strong>#${r.numero}</strong></td>
      <td style="padding:10px 12px;font-size:13px">${r.titre}</td>
      <td style="padding:10px 12px;font-size:13px;font-weight:bold">${STATUT_LABELS[r.statut] ?? r.statut}</td>
      <td style="padding:10px 12px;font-size:12px;color:#6b7280">${r.voix_pour}✓ / ${r.voix_contre}✗ / ${r.voix_abstention}○</td>
    </tr>`).join('');

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
    const html = `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1f2937">
  <div style="background:#16a34a;padding:24px 32px;border-radius:12px 12px 0 0">
    <h1 style="color:#fff;margin:0;font-size:20px">Procès-Verbal d'Assemblée Générale</h1>
    <p style="color:#bbf7d0;margin:6px 0 0">${ag.coproprietes?.nom}</p>
  </div>
  <div style="background:#fff;padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
    <p>Bonjour <strong>${cp.prenom} ${cp.nom}</strong>,</p>
    <p>Veuillez trouver ci-dessous le procès-verbal de l'assemblée générale du <strong>${dateFormatted}</strong>
    ${ag.lieu ? ` tenue à <strong>${ag.lieu}</strong>` : ''}.</p>
    <p>Quorum : <strong>${ag.quorum_atteint ? 'Atteint ✅' : 'Non atteint ❌'}</strong></p>
    <h3 style="font-size:15px;color:#1f2937;border-bottom:2px solid #e5e7eb;padding-bottom:8px">Résolutions votées</h3>
    <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px">
      <thead style="background:#f3f4f6">
        <tr>
          <th style="padding:10px 12px;text-align:left;font-size:12px;color:#6b7280">N°</th>
          <th style="padding:10px 12px;text-align:left;font-size:12px;color:#6b7280">Résolution</th>
          <th style="padding:10px 12px;text-align:left;font-size:12px;color:#6b7280">Résultat</th>
          <th style="padding:10px 12px;text-align:left;font-size:12px;color:#6b7280">Votes</th>
        </tr>
      </thead>
      <tbody>${tableauResolutions}</tbody>
    </table>
    ${ag.notes ? `<p style="background:#fef9c3;padding:12px;border-radius:8px;font-size:13px;margin-top:20px"><strong>Notes :</strong> ${ag.notes}</p>` : ''}
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
    <p style="font-size:12px;color:#9ca3af">Mon Syndic Bénévole — <a href="https://www.mon-syndic-benevole.fr" style="color:#16a34a">mon-syndic-benevole.fr</a></p>
  </div>
</div>`;

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
