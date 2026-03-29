// DELETE /api/admin/invitations  { invitationId }
// Supprime une invitation (admin uniquement)
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

export async function DELETE(request: NextRequest) {
  const requester = await checkAdmin();
  if (!requester) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const { invitationId } = await request.json() as { invitationId?: string };
  if (!invitationId) {
    return NextResponse.json({ error: 'invitationId requis' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from('invitations')
    .delete()
    .eq('id', invitationId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  void logAdminAction({
    adminEmail: requester.email ?? '',
    eventType: 'admin_invitation_deleted',
    label: `Invitation supprimée — ${invitationId}`,
    severity: 'warning',
    metadata: { invitationId },
  });
  return NextResponse.json({ success: true });
}
