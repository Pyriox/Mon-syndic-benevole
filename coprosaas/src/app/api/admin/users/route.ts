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

  const [{ data: targetAdmin }, { count: adminCount }, { data: linkedCoproprietaires, error: linkedCoproprietairesError }] = await Promise.all([
    admin.from('admin_users').select('user_id').eq('user_id', userId).maybeSingle(),
    admin.from('admin_users').select('user_id', { count: 'exact', head: true }),
    admin.from('coproprietaires').select('id').eq('user_id', userId),
  ]);

  if (linkedCoproprietairesError) {
    return NextResponse.json({ error: linkedCoproprietairesError.message }, { status: 500 });
  }

  if (targetAdmin && (adminCount ?? 0) <= 1) {
    return NextResponse.json({ error: 'Impossible de supprimer le dernier administrateur' }, { status: 400 });
  }

  const linkedCoproprietaireIds = (linkedCoproprietaires ?? []).map((row) => row.id as string);

  // Délier les fiches coproprietaires avant suppression
  if (linkedCoproprietaireIds.length > 0) {
    const { error: unlinkError } = await admin
      .from('coproprietaires')
      .update({ user_id: null })
      .eq('user_id', userId);

    if (unlinkError) {
      return NextResponse.json({ error: unlinkError.message }, { status: 500 });
    }
  }

  let removedAdminRole = false;
  if (targetAdmin) {
    const { error: removeAdminError } = await admin.from('admin_users').delete().eq('user_id', userId);
    if (removeAdminError) {
      if (linkedCoproprietaireIds.length > 0) {
        await admin.from('coproprietaires').update({ user_id: userId }).in('id', linkedCoproprietaireIds);
      }
      return NextResponse.json({ error: removeAdminError.message }, { status: 500 });
    }
    removedAdminRole = true;
  }

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) {
    if (removedAdminRole) {
      const { error: restoreAdminError } = await admin.from('admin_users').insert({ user_id: userId });
      if (restoreAdminError) {
        console.error('[admin/users] restore admin role error:', restoreAdminError.message);
      }
    }

    if (linkedCoproprietaireIds.length > 0) {
      const { error: relinkError } = await admin
        .from('coproprietaires')
        .update({ user_id: userId })
        .in('id', linkedCoproprietaireIds);
      if (relinkError) {
        console.error('[admin/users] restore coproprietaires link error:', relinkError.message);
      }
    }

    return NextResponse.json({ error: 'Suppression incomplète, restauration automatique appliquée.' }, { status: 500 });
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

  // Envoyer un email de réinitialisation de mot de passe
  if (action === 'reset_password') {
    if (!email) return NextResponse.json({ error: 'email requis' }, { status: 400 });
    const { error } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    void logAdminAction({
      adminEmail: requester.email ?? '',
      eventType: 'admin_reset_password',
      label: `Email de réinitialisation de mot de passe envoyé — ${email}`,
      metadata: { targetEmail: email.toLowerCase() },
    });
    return NextResponse.json({ success: true });
  }

  // Basculer le rôle syndic ↔ membre (user_metadata.role)
  if (action === 'toggle_role') {
    if (!userId) return NextResponse.json({ error: 'userId requis' }, { status: 400 });
    const { data: authUser, error: fetchError } = await admin.auth.admin.getUserById(userId);
    if (fetchError || !authUser) return NextResponse.json({ error: fetchError?.message ?? 'Utilisateur introuvable' }, { status: 500 });
    const currentMeta = (authUser.user.user_metadata ?? {}) as Record<string, unknown>;
    const isMembre = currentMeta.role === 'copropriétaire';
    const newRole = isMembre ? null : 'copropriétaire';
    const { error } = await admin.auth.admin.updateUserById(userId, {
      user_metadata: { ...currentMeta, role: newRole },
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    void logAdminAction({
      adminEmail: requester.email ?? '',
      eventType: 'admin_role_changed',
      label: `Rôle changé ${isMembre ? 'membre → syndic' : 'syndic → membre'} — ${userId}`,
      severity: 'warning',
      metadata: { targetUserId: userId, from: isMembre ? 'membre' : 'syndic', to: isMembre ? 'syndic' : 'membre' },
    });
    return NextResponse.json({ success: true, newRole: isMembre ? 'syndic' : 'membre' });
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
    const nextBanDuration = isSuspended ? 'none' : '876600h';
    const rollbackBanDuration = isSuspended ? '876600h' : 'none';

    // Bloquer / débloquer d'abord la session via Supabase Auth
    const { error: authSuspendError } = await admin.auth.admin.updateUserById(userId, {
      ban_duration: nextBanDuration,
    });

    if (authSuspendError) {
      return NextResponse.json({ error: authSuspendError.message }, { status: 500 });
    }

    // Puis persister la trace applicative. En cas d'échec, rollback de l'état Auth.
    const { error: profileError } = await admin
      .from('profiles')
      .upsert({ id: userId, suspended_at: newSuspendedAt }, { onConflict: 'id' });

    if (profileError) {
      const { error: rollbackError } = await admin.auth.admin.updateUserById(userId, {
        ban_duration: rollbackBanDuration,
      });
      if (rollbackError) {
        console.error('[admin/users] rollback suspend auth error:', rollbackError.message);
      }
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

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
