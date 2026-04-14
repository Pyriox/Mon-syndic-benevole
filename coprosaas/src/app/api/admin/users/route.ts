// ============================================================
// API Admin — gestion des utilisateurs
// Toutes les actions requièrent d'être authentifié en tant qu'admin
//
// DELETE /api/admin/users?userId=xxx         → supprimer un utilisateur
// POST   /api/admin/users  { action, ... }   → actions : resend_confirmation
// PATCH  /api/admin/users  { userId, email?, fullName? } → modifier email/nom
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAdminUser } from '@/lib/admin-config';
import { logAdminAction } from '@/lib/actions/log-user-event';

async function checkAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createAdminClient();
  return (await isAdminUser(user.id, admin)) ? user : null;
}

// ── DELETE : supprimer un utilisateur ────────────────────────
export async function DELETE(request: NextRequest) {
  const requester = await checkAdmin();
  if (!requester) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const userId = request.nextUrl.searchParams.get('userId');
  if (!userId) {
    return NextResponse.json({ error: 'userId requis' }, { status: 400 });
  }

  if (userId === requester.id) {
    return NextResponse.json({ error: 'Suppression de votre propre compte interdite' }, { status: 400 });
  }

  const admin = createAdminClient();

  const [{ data: targetAdmin }, { count: adminCount }] = await Promise.all([
    admin.from('admin_users').select('user_id').eq('user_id', userId).maybeSingle(),
    admin.from('admin_users').select('user_id', { count: 'exact', head: true }),
  ]);

  if (targetAdmin && (adminCount ?? 0) <= 1) {
    return NextResponse.json({ error: 'Impossible de supprimer le dernier administrateur' }, { status: 400 });
  }

  // Délier les fiches coproprietaires avant suppression
  await admin.from('coproprietaires').update({ user_id: null }).eq('user_id', userId);

  if (targetAdmin) {
    await admin.from('admin_users').delete().eq('user_id', userId);
  }

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  void logAdminAction({
    adminEmail: requester.email ?? '',
    eventType: 'admin_user_deleted',
    label: `Compte supprimé — ${userId}`,
    severity: 'warning',
    metadata: { targetUserId: userId, targetWasAdmin: !!targetAdmin },
  });

  return NextResponse.json({ success: true });
}

// ── POST : actions sur un utilisateur ────────────────────────
export async function POST(request: NextRequest) {
  const requester = await checkAdmin();
  if (!requester) {
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
    void logAdminAction({
      adminEmail: requester.email ?? '',
      eventType: 'admin_resend_confirmation',
      label: `Email de confirmation renvoyé — ${email}`,
      metadata: { targetEmail: email.toLowerCase() },
    });
    return NextResponse.json({ success: true });
  }

  // Forcer la vérification d'un compte sans envoyer d'email
  if (action === 'force_confirm') {
    if (!userId) return NextResponse.json({ error: 'userId requis' }, { status: 400 });
    const { error } = await admin.auth.admin.updateUserById(userId, { email_confirm: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    void logAdminAction({
      adminEmail: requester.email ?? '',
      eventType: 'admin_force_confirm',
      label: `Compte vérifié manuellement — ${userId}`,
      metadata: { targetUserId: userId },
    });
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
    void logAdminAction({
      adminEmail: requester.email ?? '',
      eventType: 'admin_invitation_cancelled',
      label: `Invitation annulée — ${userId}`,
      metadata: { invitationId: userId },
    });
    return NextResponse.json({ success: true });
  }

  // Accorder / retirer le rôle admin
  if (action === 'toggle_admin') {
    if (!userId) return NextResponse.json({ error: 'userId requis' }, { status: 400 });

    if (userId === requester.id) {
      return NextResponse.json({ error: 'Modification de votre propre rôle admin interdite' }, { status: 400 });
    }

    const { data: existing } = await admin
      .from('admin_users')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      const { count: adminCount } = await admin.from('admin_users').select('user_id', { count: 'exact', head: true });
      if ((adminCount ?? 0) <= 1) {
        return NextResponse.json({ error: 'Impossible de retirer le dernier administrateur' }, { status: 400 });
      }
      const { error } = await admin.from('admin_users').delete().eq('user_id', userId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      void logAdminAction({
        adminEmail: requester.email ?? '',
        eventType: 'admin_role_revoked',
        label: `Droits admin retirés — ${userId}`,
        severity: 'warning',
        metadata: { targetUserId: userId },
      });
      return NextResponse.json({ success: true, isAdmin: false });
    } else {
      const { error } = await admin.from('admin_users').insert({ user_id: userId });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      void logAdminAction({
        adminEmail: requester.email ?? '',
        eventType: 'admin_role_granted',
        label: `Droits admin accordés — ${userId}`,
        metadata: { targetUserId: userId },
      });
      return NextResponse.json({ success: true, isAdmin: true });
    }
  }

  // ── Suspendre / réactiver un compte ─────────────────────────
  if (action === 'toggle_suspend') {
    if (!userId) return NextResponse.json({ error: 'userId requis' }, { status: 400 });
    if (userId === requester.id) {
      return NextResponse.json({ error: 'Suspension de votre propre compte interdite' }, { status: 400 });
    }
    // Vérifier l'état actuel
    const { data: profile } = await admin
      .from('profiles')
      .select('suspended_at')
      .eq('id', userId)
      .maybeSingle();
    const isSuspended = !!(profile as { suspended_at?: string | null } | null)?.suspended_at;
    const newSuspendedAt = isSuspended ? null : new Date().toISOString();
    // Mettre à jour profiles
    await admin.from('profiles').update({ suspended_at: newSuspendedAt }).eq('id', userId);
    // Bloquer / débloquer la session via ban_duration Supabase Auth
    await admin.auth.admin.updateUserById(userId, {
      ban_duration: isSuspended ? 'none' : '876600h',
    });
    void logAdminAction({
      adminEmail: requester.email ?? '',
      eventType: isSuspended ? 'admin_account_unsuspended' : 'admin_account_suspended',
      label: isSuspended ? `Compte réactivé — ${userId}` : `Compte suspendu — ${userId}`,
      severity: 'warning',
      metadata: { targetUserId: userId },
    });
    return NextResponse.json({ success: true, suspended: !isSuspended });
  }

  return NextResponse.json({ error: 'Action inconnue' }, { status: 400 });
}

// ── PATCH : modifier email et/ou nom d’un utilisateur ────────────────────
export async function PATCH(request: NextRequest) {
  const requester = await checkAdmin();
  if (!requester) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const body = await request.json() as { userId?: string; email?: string; fullName?: string };
  const { userId, email, fullName } = body;

  if (!userId?.trim()) {
    return NextResponse.json({ error: 'userId requis' }, { status: 400 });
  }

  const admin = createAdminClient();

  // Mettre à jour l'email dans auth.users si fourni
  if (email?.trim()) {
    const { error } = await admin.auth.admin.updateUserById(userId.trim(), {
      email: email.trim().toLowerCase(),
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Mettre à jour le full_name dans profiles
  if (fullName !== undefined) {
    await admin.from('profiles').upsert({
      id: userId.trim(),
      full_name: fullName.trim() || null,
    }, { onConflict: 'id' });
  }

  void logAdminAction({
    adminEmail: requester.email ?? '',
    eventType: 'admin_user_updated',
    label: `Utilisateur modifié — ${userId.trim()}`,
    metadata: {
      targetUserId: userId.trim(),
      emailUpdated: !!email?.trim(),
      fullNameUpdated: fullName !== undefined,
    },
  });

  return NextResponse.json({ success: true });
}
