// ============================================================
// POST /api/invitations/register
// Crée un compte copropriétaire depuis un lien d'invitation
// sans envoyer d'email de confirmation (email déjà vérifié
// par le fait même d'avoir cliqué sur l'invitation).
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  const body = await request.json() as {
    token?: string;
    password?: string;
    prenom?: string;
    nom?: string;
  };

  const { token, password, prenom, nom } = body;

  if (!token || !password) {
    return NextResponse.json({ error: 'token et password requis' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Le mot de passe doit contenir au moins 8 caractères.' }, { status: 400 });
  }

  const admin = createAdminClient();

  // Valider le token
  const { data: invitation, error: invErr } = await admin
    .from('invitations')
    .select('email, copropriete_id, lot_id, statut, expires_at')
    .eq('token', token)
    .single();

  if (invErr || !invitation) {
    return NextResponse.json({ error: "Lien d'invitation introuvable ou invalide" }, { status: 404 });
  }
  if (invitation.statut === 'acceptee') {
    return NextResponse.json({ error: 'Ce lien a déjà été utilisé' }, { status: 410 });
  }
  if (new Date(invitation.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Ce lien est invalide ou a expiré.' }, { status: 410 });
  }

  const fullName = `${prenom ?? ''} ${nom ?? ''}`.trim();

  // Créer le compte avec email déjà confirmé (pas d'email Supabase envoyé)
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: invitation.email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      prenom: prenom ?? '',
      nom: nom ?? '',
      role: 'copropriétaire',
    },
  });

  if (createError) {
    // Email déjà utilisé ou autre erreur
    const msg = createError.message.toLowerCase().includes('already')
      ? 'Cette adresse email est déjà utilisée. Essayez de vous connecter.'
      : createError.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const userId = created.user.id;

  // Lier le compte à la fiche copropriétaire existante
  const { data: fiche } = await admin
    .from('coproprietaires')
    .select('id')
    .eq('email', invitation.email)
    .eq('copropriete_id', invitation.copropriete_id)
    .is('user_id', null)
    .maybeSingle();

  if (fiche) {
    await admin.from('coproprietaires').update({ user_id: userId }).eq('id', fiche.id);
  } else {
    // Aucune fiche manuelle — créer automatiquement
    const prenomVal = prenom?.trim() || fullName.split(' ')[0] || '';
    const nomVal = nom?.trim() || fullName.split(' ').slice(1).join(' ') || prenomVal;
    await admin.from('coproprietaires').insert({
      copropriete_id: invitation.copropriete_id,
      lot_id: invitation.lot_id ?? null,
      email: invitation.email,
      prenom: prenomVal,
      nom: nomVal,
      user_id: userId,
      solde: 0,
    });
  }

  // Marquer l'invitation comme acceptée
  await admin.from('invitations').update({ statut: 'acceptee' }).eq('token', token);

  await Promise.resolve(
    admin.from('user_events').insert({
      user_email: invitation.email.toLowerCase(),
      event_type: 'user_registered',
      label: 'Inscription via invitation',
      severity: 'info',
      metadata: {
        source: 'invitation',
        copropriete_id: invitation.copropriete_id,
      },
    }),
  ).catch(() => undefined);

  return NextResponse.json({ email: invitation.email });
}
