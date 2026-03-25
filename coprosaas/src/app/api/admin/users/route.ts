// ============================================================
// API Admin — gestion des utilisateurs
// Toutes les actions requièrent d'être authentifié en tant qu'admin
//
// DELETE /api/admin/users?userId=xxx         → supprimer un utilisateur
// POST   /api/admin/users  { action, ... }   → actions : resend_confirmation
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAdminUser } from '@/lib/admin-config';

async function checkAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createAdminClient();
  return (await isAdminUser(user.id, admin)) ? user : null;
}

// ── DELETE : supprimer un utilisateur ────────────────────────
export async function DELETE(request: NextRequest) {
  if (!await checkAdmin()) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const userId = request.nextUrl.searchParams.get('userId');
  if (!userId) {
    return NextResponse.json({ error: 'userId requis' }, { status: 400 });
  }

  const admin = createAdminClient();

  // Délier les fiches coproprietaires avant suppression
  await admin.from('coproprietaires').update({ user_id: null }).eq('user_id', userId);

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// ── POST : actions sur un utilisateur ────────────────────────
export async function POST(request: NextRequest) {
  if (!await checkAdmin()) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const body = await request.json() as { action: string; email?: string; userId?: string };
  const { action, email, userId } = body;

  const admin = createAdminClient();

  // Renvoyer l'email de confirmation (en utilisant magiclink au lieu de signup qui requiert password)
  if (action === 'resend_confirmation') {
    if (!email) return NextResponse.json({ error: 'email requis' }, { status: 400 });
    const { error } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  // Forcer la vérification d'un compte sans envoyer d'email
  if (action === 'force_confirm') {
    if (!userId) return NextResponse.json({ error: 'userId requis' }, { status: 400 });
    const { error } = await admin.auth.admin.updateUserById(userId, { email_confirm: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  // Annuler une invitation
  if (action === 'cancel_invitation') {
    if (!userId) return NextResponse.json({ error: 'userId requis' }, { status: 400 });
    const { error } = await admin
      .from('invitations')
      .update({ statut: 'annulee' })
      .eq('id', userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  // Accorder / retirer le rôle admin
  if (action === 'toggle_admin') {
    if (!userId) return NextResponse.json({ error: 'userId requis' }, { status: 400 });
    const { data: existing } = await admin
      .from('admin_users')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();
    if (existing) {
      const { error } = await admin.from('admin_users').delete().eq('user_id', userId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, isAdmin: false });
    } else {
      const { error } = await admin.from('admin_users').insert({ user_id: userId });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, isAdmin: true });
    }
  }

  return NextResponse.json({ error: 'Action inconnue' }, { status: 400 });
}
