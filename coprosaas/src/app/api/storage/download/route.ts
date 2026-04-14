import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { extractStoragePath } from '@/lib/storage-path';

const STORAGE_BUCKET = 'documents';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const coproId = request.nextUrl.searchParams.get('coproId')?.trim();
  const rawPath = request.nextUrl.searchParams.get('path')?.trim();

  if (!coproId || !rawPath) {
    return NextResponse.json({ error: 'coproId et path requis' }, { status: 400 });
  }

  const storagePath = extractStoragePath(rawPath);
  if (!storagePath || storagePath.includes('..') || storagePath.startsWith('/')) {
    return NextResponse.json({ error: 'Chemin invalide' }, { status: 400 });
  }

  const admin = createAdminClient();
  const [{ data: asSyndic }, { data: asOwner }] = await Promise.all([
    admin.from('coproprietes').select('id').eq('id', coproId).eq('syndic_id', user.id).maybeSingle(),
    admin.from('coproprietaires').select('id').eq('copropriete_id', coproId).eq('user_id', user.id).maybeSingle(),
  ]);

  if (!asSyndic && !asOwner) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  const { data: signed, error } = await admin.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(storagePath, 3600);

  if (error || !signed?.signedUrl) {
    return NextResponse.json({ error: 'Impossible de générer un lien sécurisé.' }, { status: 500 });
  }

  return NextResponse.redirect(signed.signedUrl);
}