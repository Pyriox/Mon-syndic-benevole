import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Resend } from 'resend';
import { createClient } from '@/lib/supabase/server';

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
    .select('*, coproprietes(nom, adresse, ville, code_postal, syndic_id)')
    .eq('id', appelId)
    .single();

  if (!appel) return NextResponse.json({ message: 'Appel de fonds introuvable' }, { status: 404 });

  // Vérification que l'utilisateur est bien le syndic de cette copropriété
  const copros = appel.coproprietes as { syndic_id: string } | null;
  if (copros?.syndic_id !== user.id) {
    return NextResponse.json({ message: 'Accès refusé' }, { status: 403 });
  }

  // Récupérer les lignes avec copropriétaires (email + user_id pour fallback auth)
  const { data: lignes } = await supabase
    .from('lignes_appels_de_fonds')
    .select('montant_du, paye, coproprietaires(nom, prenom, email, user_id)')
    .eq('appel_de_fonds_id', appelId);

  const destinataires: { nom: string; prenom: string; email: string; montant_du: number; paye: boolean }[] = [];
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
    destinataires.push({ nom: c.nom, prenom: c.prenom, email, montant_du: l.montant_du, paye: l.paye });
  }

  if (!destinataires.length) {
    const total = (lignes ?? []).length;
    return NextResponse.json({
      message: total === 0
        ? 'Aucune répartition générée pour cet appel. Cliquez sur « Détail » puis « Générer la répartition ».'
        : `${total} copropriétaire(s) trouvé(s) mais aucun n’a d’adresse e-mail renseignée.`,
    }, { status: 422 });
  }

  const dateEcheance = new Date(appel.date_echeance).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  const formatEuros = (n: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);

  let sent = 0;
  const errors: string[] = [];

  for (const dest of destinataires) {
    if (dest.paye) continue; // Ne pas relancer les copropriétaires ayant déjà payé

    const html = `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1f2937">
  <div style="background:#2563eb;padding:24px 32px;border-radius:12px 12px 0 0">
    <h1 style="color:#fff;margin:0;font-size:20px">Appel de fonds</h1>
    <p style="color:#bfdbfe;margin:6px 0 0">${appel.coproprietes?.nom ?? ''}</p>
  </div>
  <div style="background:#fff;padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
    <p>Bonjour <strong>${dest.prenom} ${dest.nom}</strong>,</p>
    <p>Un appel de fonds a été émis pour la copropriété <strong>${appel.coproprietes?.nom}</strong>.</p>
    <div style="background:#f0f9ff;border-left:4px solid #2563eb;padding:16px;border-radius:0 8px 8px 0;margin:20px 0">
      <p style="margin:0"><strong>📋 Objet :</strong> ${appel.titre}</p>
      <p style="margin:8px 0 0"><strong>💰 Montant dû :</strong> <span style="font-size:18px;font-weight:bold;color:#1d4ed8">${formatEuros(dest.montant_du)}</span></p>
      <p style="margin:8px 0 0"><strong>📅 Date limite de paiement :</strong> ${dateEcheance}</p>
    </div>
    <p style="font-size:13px;color:#6b7280">Veuillez effectuer votre règlement avant la date limite indiquée. Passé ce délai, votre compte sera signalé en impayé.</p>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
    <p style="font-size:12px;color:#9ca3af">Mon Syndic Bénévole — <a href="https://www.mon-syndic-benevole.fr" style="color:#2563eb">mon-syndic-benevole.fr</a></p>
  </div>
</div>`;

    const { error } = await resend.emails.send({
      from: FROM,
      to: dest.email,
      subject: `Appel de fonds — ${appel.coproprietes?.nom} — Échéance ${dateEcheance}`,
      html,
    });

    if (error) errors.push(`${dest.email}: ${error.message}`);
    else sent++;
  }

  // Enregistrer la date d'envoi (nécessite la colonne emailed_at sur appels_de_fonds)
  if (sent > 0) {
    await supabase.from('appels_de_fonds')
      .update({ emailed_at: new Date().toISOString() } as Record<string, unknown>)
      .eq('id', appelId);
  }

  return NextResponse.json({
    message: errors.length
      ? `${sent} e-mail(s) envoyé(s), ${errors.length} échec(s) : ${errors.join('; ')}`
      : `${sent} e-mail(s) envoyé(s) avec succès.`,
  });
}
