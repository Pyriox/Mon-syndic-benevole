// ============================================================
// GET /api/documents/[docId]/download
// Génère une signed URL Supabase Storage valide 1h et redirige.
// Vérifie que l'utilisateur connecté a bien accès à la copropriété
// propriétaire du document avant de servir le fichier.
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const STORAGE_BUCKET = 'documents';
// URL publique Supabase Storage → extrait le chemin dans le bucket
const PUBLIC_PATH_MARKER = `/storage/v1/object/public/${STORAGE_BUCKET}/`;
const SIGNED_PATH_MARKER  = `/storage/v1/object/sign/${STORAGE_BUCKET}/`;

/** Extrait le chemin dans le bucket depuis une URL Supabase Storage ou retourne l'entrée telle quelle. */
function extractStoragePath(url: string): string {
  for (const marker of [PUBLIC_PATH_MARKER, SIGNED_PATH_MARKER]) {
    const idx = url.indexOf(marker);
    if (idx !== -1) {
      // Enlève les query params (token= pour signed URLs)
      return url.slice(idx + marker.length).split('?')[0];
    }
  }
  // Hypothèse : l'URL est déjà un chemin relatif dans le bucket
  return url.split('?')[0];
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ docId: string }> }
) {
  const { docId } = await params;

  // 1. Authentification
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  // 2. Récupération du document et vérification d'accès
  const { data: doc } = await supabase
    .from('documents')
    .select('id, url, copropriete_id, nom')
    .eq('id', docId)
    .maybeSingle();

  if (!doc) {
    return NextResponse.json({ error: 'Document introuvable' }, { status: 404 });
  }

  // 3. Vérification que l'utilisateur a accès à cette copropriété
  const admin = createAdminClient();
  const [{ data: asSyndic }, { data: asOwner }] = await Promise.all([
    admin.from('coproprietes').select('id').eq('id', doc.copropriete_id).eq('syndic_id', user.id).maybeSingle(),
    admin.from('coproprietaires').select('id').eq('copropriete_id', doc.copropriete_id).eq('user_id', user.id).maybeSingle(),
  ]);

  if (!asSyndic && !asOwner) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  // 4. Génération de la signed URL (1 heure)
  const storagePath = extractStoragePath(doc.url);
  const { data: signed, error: signError } = await admin.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(storagePath, 3600);

  if (signError || !signed?.signedUrl) {
    // Fallback : si le bucket est public, rediriger vers l'URL originale
    return NextResponse.redirect(doc.url);
  }

  return NextResponse.redirect(signed.signedUrl);
}
