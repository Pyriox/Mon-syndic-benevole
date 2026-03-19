// ============================================================
// API Invitations
// POST  /api/invitations            → crée une invitation
// GET   /api/invitations?token=xxx  → valide un token
// PATCH /api/invitations            → lie le compte créé à la fiche copropriétaire existante
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';
import { Resend } from 'resend';
import { buildInvitationEmail, buildInvitationEmailSubject } from '@/lib/emails/invitation';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? 'onboarding@resend.dev';

function makeSupabase(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() {},
      },
    }
  );
}

// ---- POST : créer une invitation --------------------------------
export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = makeSupabase(cookieStore);

  // Seul un utilisateur connecté (syndic) peut créer une invitation
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const body = await request.json();
  const { email, copropriete_id, lot_id } = body;

  if (!email || !copropriete_id) {
    return NextResponse.json({ error: 'Email et copropriété requis' }, { status: 400 });
  }

  // Vérifier que la copropriété appartient bien au syndic connecté
  const { data: copro } = await supabase
    .from('coproprietes')
    .select('id, nom')
    .eq('id', copropriete_id)
    .eq('syndic_id', user.id)
    .single();

  if (!copro) {
    return NextResponse.json({ error: 'Copropriété introuvable ou accès refusé' }, { status: 403 });
  }

  // Vérifier s'il n'y a pas déjà une invitation en attente pour cet email
  const { data: existing } = await supabase
    .from('invitations')
    .select('token, statut, expires_at')
    .eq('email', email.toLowerCase().trim())
    .eq('copropriete_id', copropriete_id)
    .eq('statut', 'en_attente')
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  let token: string;

  if (existing) {
    // Réutiliser l'invitation existante
    token = existing.token;
  } else {
    // Créer une nouvelle invitation (expire dans 7 jours)
    const { data, error } = await supabase
      .from('invitations')
      .insert({
        email: email.toLowerCase().trim(),
        copropriete_id,
        lot_id: lot_id || null,
        created_by: user.id,
      })
      .select('token')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    token = data.token;
  }

  // Récupérer le prénom du syndic pour personnaliser l'email
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single();
  const syndicPrenom = (profile?.full_name ?? '').split(' ')[0] || 'Le syndic';

  // Construire le lien d'invitation
  const origin = request.headers.get('origin') ?? 'http://localhost:3001';
  const link = `${origin}/register?token=${token}`;

  // Envoyer l'email d'invitation via Resend
  const { error: emailError } = await resend.emails.send({
    from: FROM,
    to: [email.toLowerCase().trim()],
    subject: buildInvitationEmailSubject(copro.nom),
    html: buildInvitationEmail({ coproprieteNom: copro.nom, syndicPrenom, inviteLink: link }),
  });

  if (emailError) {
    console.error('[invitations] Resend error:', emailError);
    // On retourne quand même le lien — l'invitation est créée, seul l'email a échoué
    return NextResponse.json({ link, token, copropriete: copro.nom, emailWarning: "L'email n'a pas pu être envoyé. Utilisez le lien ci-dessous." });
  }

  return NextResponse.json({ link, token, copropriete: copro.nom, emailSent: true });
}

// ---- GET : valider un token ----------------------------------
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  if (!token) {
    return NextResponse.json({ error: 'Token manquant' }, { status: 400 });
  }

  const cookieStore = await cookies();
  const supabase = makeSupabase(cookieStore);

  const { data, error } = await supabase
    .from('invitations')
    .select('email, statut, expires_at, copropriete_id, coproprietes(nom)')
    .eq('token', token)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Lien d'invitation introuvable ou invalide" }, { status: 404 });
  }

  if (data.statut === 'acceptee') {
    return NextResponse.json({ error: 'Ce lien a déjà été utilisé' }, { status: 410 });
  }

  if (new Date(data.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Ce lien a expiré (valable 7 jours)' }, { status: 410 });
  }

  const coproprietes = data.coproprietes as unknown as { nom: string } | { nom: string }[] | null;
  const coproprieteNom = Array.isArray(coproprietes) ? coproprietes[0]?.nom : coproprietes?.nom;

  return NextResponse.json({
    email: data.email,
    copropriete: coproprieteNom ?? '',
  });
}

// ---- PATCH : lier le compte nouvellement créé à la fiche copropriétaire ----
// Appelé juste après supabase.auth.signUp() côté client
// { token, user_id, full_name } → met à jour coproprietaires.user_id
export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { token, user_id, full_name } = body as { token: string; user_id: string; full_name?: string };

  if (!token || !user_id) {
    return NextResponse.json({ error: 'token et user_id requis' }, { status: 400 });
  }

  const admin = createAdminClient();

  // Récupérer les détails de l'invitation
  const { data: invitation, error: invErr } = await admin
    .from('invitations')
    .select('email, copropriete_id, lot_id, statut, expires_at')
    .eq('token', token)
    .single();

  if (invErr || !invitation) {
    return NextResponse.json({ error: 'Invitation introuvable' }, { status: 404 });
  }

  if (invitation.statut === 'acceptee') {
    // Déjà traitée (double appel) — on renvoie OK silencieusement
    return NextResponse.json({ success: true, linked: false });
  }

  if (new Date(invitation.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Invitation expirée' }, { status: 410 });
  }

  // Chercher une fiche copropriétaire existante avec le même email dans la même copropriété
  const { data: existing } = await admin
    .from('coproprietaires')
    .select('id')
    .eq('email', invitation.email)
    .eq('copropriete_id', invitation.copropriete_id)
    .is('user_id', null)
    .maybeSingle();

  if (existing) {
    // Lier le compte à la fiche existante
    await admin
      .from('coproprietaires')
      .update({ user_id })
      .eq('id', existing.id);
  } else {
    // Aucune fiche manuelle — créer automatiquement une fiche minimale
    const nameParts = (full_name ?? '').trim().split(' ');
    const prenom = nameParts[0] ?? '';
    const nom = nameParts.slice(1).join(' ') || prenom; // fallback si un seul mot

    await admin.from('coproprietaires').insert({
      copropriete_id: invitation.copropriete_id,
      lot_id: invitation.lot_id ?? null,
      email: invitation.email,
      prenom,
      nom,
      user_id,
      solde: 0,
    });
  }

  // Marquer l'invitation comme acceptée
  await admin
    .from('invitations')
    .update({ statut: 'acceptee' })
    .eq('token', token);

  return NextResponse.json({ success: true, linked: Boolean(existing) });
}
