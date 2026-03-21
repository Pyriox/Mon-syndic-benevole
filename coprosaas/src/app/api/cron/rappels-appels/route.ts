// ============================================================
// Route : GET /api/cron/rappels-appels
// Cron quotidien (08h00) — rappels automatiques appels de fonds
//
//  J-7  : rappel pré-échéance aux copropriétaires impayés
//  J+15 : mise en demeure post-échéance aux copropriétaires impayés
//
// Appelé par Vercel Cron (vercel.json) avec header Authorization
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { Resend } from 'resend';
import { buildAppelEmail, buildAppelEmailSubject, type AppelEmailType } from '@/lib/emails/appel-de-fonds';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM   = process.env.EMAIL_FROM ?? 'noreply@mon-syndic-benevole.fr';

function addDays(base: Date, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  // Protection par secret partagé (Vercel ajoute Authorization: Bearer <CRON_SECRET>)
  const auth = req.headers.get('authorization');
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dateJ7  = addDays(today, 7);   // appels avec échéance dans 7 jours
  const dateJ15 = addDays(today, -15); // appels avec échéance il y a 15 jours

  // Appels à rappeler (J-7)
  const { data: j7Appels } = await supabase
    .from('appels_de_fonds')
    .select('id, titre, montant_total, date_echeance, coproprietes(nom)')
    .eq('statut', 'publie')
    .eq('date_echeance', dateJ7)
    .is('rappel_j7_at', null);

  // Appels en mise en demeure (J+15)
  const { data: j15Appels } = await supabase
    .from('appels_de_fonds')
    .select('id, titre, montant_total, date_echeance, coproprietes(nom)')
    .eq('statut', 'publie')
    .eq('date_echeance', dateJ15)
    .is('rappel_j15_at', null);

  let totalSent = 0;

  // Traitement J-7
  for (const appel of j7Appels ?? []) {
    const sent = await sendRappelEmails(supabase, appel as unknown as AppelRow, 'rappel');
    if (sent >= 0) {
      await supabase.from('appels_de_fonds')
        .update({ rappel_j7_at: new Date().toISOString() })
        .eq('id', appel.id);
    }
    totalSent += sent;
  }

  // Traitement J+15
  for (const appel of j15Appels ?? []) {
    const sent = await sendRappelEmails(supabase, appel as unknown as AppelRow, 'mise_en_demeure');
    if (sent >= 0) {
      await supabase.from('appels_de_fonds')
        .update({ rappel_j15_at: new Date().toISOString() })
        .eq('id', appel.id);
    }
    totalSent += sent;
  }

  return NextResponse.json({
    ok: true,
    date: today.toISOString().slice(0, 10),
    j7_appels:  j7Appels?.length  ?? 0,
    j15_appels: j15Appels?.length ?? 0,
    sent: totalSent,
  });
}

// ---- Types locaux ----
interface AppelRow {
  id: string;
  titre: string;
  date_echeance: string;
  coproprietes: { nom: string } | null;
}

type CopRow = { nom: string; prenom: string; email: string; user_id: string | null };
type LigneRow = { montant_du: number; coproprietaires: CopRow | CopRow[] | null };

// ---- Envoi des rappels pour un appel donné ----
async function sendRappelEmails(
  supabase: ReturnType<typeof createServerClient>,
  appel: AppelRow,
  type: AppelEmailType
): Promise<number> {
  // Récupérer uniquement les lignes impayées
  const { data: lignes } = await supabase
    .from('lignes_appels_de_fonds')
    .select('montant_du, coproprietaires(nom, prenom, email, user_id)')
    .eq('appel_de_fonds_id', appel.id)
    .eq('paye', false);

  if (!lignes?.length) return 0;

  const coproprieteNom = appel.coproprietes?.nom ?? '';

  // Collecte des copropriétaires à notifier
  const rows = (lignes as LigneRow[]).map((l) => {
    const c = Array.isArray(l.coproprietaires) ? l.coproprietaires[0] : l.coproprietaires;
    return {
      cop: c as CopRow | null,
      montant_du: l.montant_du,
    };
  }).filter((r): r is { cop: CopRow; montant_du: number } => r.cop !== null);

  // Résolution des emails manquants en parallèle (batch, pas de N+1)
  const userIdsToResolve: string[] = [...new Set<string>(
    rows.filter((r) => !r.cop.email && r.cop.user_id).map((r) => r.cop.user_id as string)
  )];

  const emailByUserId = new Map<string, string>();
  if (userIdsToResolve.length > 0) {
    const results = await Promise.all(
      userIdsToResolve.map((uid) => supabase.auth.admin.getUserById(uid))
    );
    userIdsToResolve.forEach((uid, i) => {
      const email = results[i].data?.user?.email ?? '';
      if (email) emailByUserId.set(uid, email);
    });
  }

  // Envoi des emails
  let sent = 0;
  await Promise.all(rows.map(async ({ cop, montant_du }) => {
    const email = cop.email || (cop.user_id ? emailByUserId.get(cop.user_id) ?? '' : '');
    if (!email) return;

    const { error } = await resend.emails.send({
      from: FROM,
      to: email,
      subject: buildAppelEmailSubject({ type, coproprieteNom, dateEcheance: appel.date_echeance }),
      html: buildAppelEmail({
        type,
        prenom:         cop.prenom,
        nom:            cop.nom,
        coproprieteNom,
        titre:          appel.titre,
        montantDu:      montant_du,
        dateEcheance:   appel.date_echeance,
      }),
    });
    if (!error) sent++;
  }));

  return sent;
}
