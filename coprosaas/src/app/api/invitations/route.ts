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
import { getClientIp, rateLimit } from '@/lib/rate-limit';
import { trackResendSendResult } from '@/lib/email-delivery';
import { getCanonicalSiteUrl } from '@/lib/site-url';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = `Mon Syndic Bénévole <${process.env.EMAIL_FROM ?? 'noreply@mon-syndic-benevole.fr'}>`;

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

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

  // Rate limiting volontairement permissif pour l'onboarding :
  // un nouveau syndic peut inviter 10 à 15 copropriétaires en quelques minutes.
  if (!await rateLimit(`invite-create:${user.id}`, 20, 600_000)) {
    return NextResponse.json({ error: "Trop d'invitations envoyées. Réessayez dans 10 minutes." }, { status: 429 });
  }

  const body = await request.json();
  let { email, copropriete_id, lot_id } = body as { email?: string; copropriete_id?: string; lot_id?: string };
  const { coproprietaire_id } = body as { coproprietaire_id?: string };

  // Invitation depuis une fiche existante : on retrouve email + copropriete_id automatiquement
  if (coproprietaire_id) {
    const { data: cpFiche } = await supabase
      .from('coproprietaires')
      .select('email, copropriete_id, lot_id')
      .eq('id', coproprietaire_id)
      .single();
    if (!cpFiche) {
      return NextResponse.json({ error: 'Copropriétaire introuvable' }, { status: 404 });
    }
    email = cpFiche.email;
    copropriete_id = cpFiche.copropriete_id;
    lot_id = lot_id ?? cpFiche.lot_id ?? undefined;
  }

  if (!email || !copropriete_id) {
    return NextResponse.json({ error: 'Email et copropriété requis' }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!isValidEmail(normalizedEmail)) {
    return NextResponse.json({ error: 'Adresse email invalide' }, { status: 400 });
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
    .eq('email', normalizedEmail)
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
        email: normalizedEmail,
        copropriete_id,
        lot_id: lot_id || null,
        created_by: user.id,
      })
      .select('token')
      .single();

    if (error) {
      console.error('[invitations] DB error:', error.message);
      return NextResponse.json({ error: "Erreur lors de la création de l'invitation." }, { status: 500 });
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

  // Construire le lien d'invitation (utiliser la variable d'environnement plutôt que l'en-tête Origin)
  const siteUrl = getCanonicalSiteUrl();
  const link = `${siteUrl}/register?token=${token}`;

  const subject = buildInvitationEmailSubject(copro.nom);

  // Envoyer l'email d'invitation via Resend
  const result = await resend.emails.send({
    from: FROM,
    to: [normalizedEmail],
    subject,
    html: buildInvitationEmail({ coproprieteNom: copro.nom, syndicPrenom, inviteLink: link }),
  });

  const tracked = await trackResendSendResult(result, {
    templateKey: 'invitation',
    recipientEmail: normalizedEmail,
    coproprieteId: copropriete_id,
    subject,
    legalEventType: 'copro_invitation',
    legalReference: token,
    payload: { lotId: lot_id ?? null, invitedBy: user.id },
  });

  if (!tracked.ok) {
    console.error('[invitations] Resend error:', tracked.errorMessage);
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

  const ip = getClientIp(request);
  if (!await rateLimit(`invite-lookup:${ip}`, 60, 600_000)) {
    return NextResponse.json({ error: 'Trop de tentatives. Réessayez dans quelques minutes.' }, { status: 429 });
  }

  // Utilise l'admin client : le visiteur n'est pas connecté, les RLS bloquent les jointures
  const admin = createAdminClient();

  const { data, error } = await admin
    .from('invitations')
    .select('email, statut, expires_at, copropriete_id')
    .eq('token', token)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Lien d'invitation introuvable ou invalide" }, { status: 404 });
  }

  if (data.statut === 'acceptee') {
    return NextResponse.json({ error: 'Ce lien a déjà été utilisé' }, { status: 410 });
  }

  if (new Date(data.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Ce lien est invalide ou a expiré.' }, { status: 410 });
  }

  // Nom de la copropriété
  const { data: copro } = await admin
    .from('coproprietes')
    .select('nom')
    .eq('id', data.copropriete_id)
    .single();

  // Pré-remplir prénom/nom depuis la fiche copropriétaire (non encore liée)
  const { data: fiche } = await admin
    .from('coproprietaires')
    .select('prenom, nom')
    .eq('email', data.email)
    .eq('copropriete_id', data.copropriete_id)
    .is('user_id', null)
    .maybeSingle();

  return NextResponse.json({
    email: data.email,
    copropriete: copro?.nom ?? '',
    prenom: fiche?.prenom ?? null,
    nom: fiche?.nom ?? null,
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

  // Vérifier que user_id appartient bien à l'email de l'invitation (protection contre l'usurpation d'identité)
  const { data: authUser } = await admin.auth.admin.getUserById(user_id);
  if (!authUser?.user || authUser.user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
    return NextResponse.json({ error: 'Association non autorisée' }, { status: 403 });
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
