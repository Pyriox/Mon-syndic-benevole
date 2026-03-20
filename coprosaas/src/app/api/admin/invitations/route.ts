// DELETE /api/admin/invitations  { invitationId }
// Supprime une invitation (admin uniquement)
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'tpn.fabien@gmail.com';

async function checkAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.email === ADMIN_EMAIL ? user : null;
}

export async function DELETE(request: NextRequest) {
  if (!await checkAdmin()) {
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
  return NextResponse.json({ success: true });
}
