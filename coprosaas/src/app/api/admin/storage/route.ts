// ============================================================
// API Admin — Explorateur Supabase Storage (bucket : documents)
//
// GET  /api/admin/storage?coproId=xxx         → liste les fichiers
// DELETE /api/admin/storage?coproId=xxx&path=x → supprime un fichier
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

// ── GET : lister les fichiers d'une copropriété ───────────────
export async function GET(request: NextRequest) {
  const requester = await checkAdmin();
  if (!requester) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const coproId = request.nextUrl.searchParams.get('coproId');
  if (!coproId?.trim()) {
    return NextResponse.json({ error: 'coproId requis' }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data, error } = await admin.storage
    .from('documents')
    .list(coproId.trim(), { limit: 200, sortBy: { column: 'created_at', order: 'desc' } });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const files = await Promise.all((data ?? []).map(async (file) => {
    const filePath = `${coproId.trim()}/${file.name}`;
    const { data: signed, error: signedError } = await admin.storage
      .from('documents')
      .createSignedUrl(filePath, 3600);

    if (signedError || !signed?.signedUrl) {
      throw new Error(signedError?.message ?? 'Signed URL manquante');
    }

    return {
      name: file.name,
      path: filePath,
      size: file.metadata?.size ?? null,
      created_at: file.created_at ?? null,
      downloadUrl: signed.signedUrl,
    };
  }));

  return NextResponse.json({ files });
}

// ── DELETE : supprimer un fichier ─────────────────────────────
export async function DELETE(request: NextRequest) {
  const requester = await checkAdmin();
  if (!requester) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const filePath = request.nextUrl.searchParams.get('path');
  if (!filePath?.trim()) {
    return NextResponse.json({ error: 'path requis' }, { status: 400 });
  }

  // Validation : le chemin ne doit pas contenir de traversal
  const safePath = filePath.trim();
  if (safePath.includes('..') || safePath.startsWith('/')) {
    return NextResponse.json({ error: 'Chemin invalide' }, { status: 400 });
  }

  const admin = createAdminClient();

  const { error } = await admin.storage.from('documents').remove([safePath]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  void logAdminAction({
    adminEmail: requester.email ?? '',
    eventType: 'admin_document_deleted',
    label: `Document supprimé du Storage — ${safePath}`,
    severity: 'warning',
    metadata: { filePath: safePath },
  });

  return NextResponse.json({ success: true });
}
