import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 5 * 1024 * 1024; // 5 Mo

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ incidentId: string }> }
) {
  const { incidentId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const admin = createAdminClient();

  // Vérifier que l'incident existe et appartient à une copropriété du syndic
  const { data: incident } = await admin
    .from('incidents')
    .select('id, copropriete_id')
    .eq('id', incidentId)
    .maybeSingle();
  if (!incident) return NextResponse.json({ error: 'Incident introuvable' }, { status: 404 });

  const { data: copro } = await admin
    .from('coproprietes')
    .select('id')
    .eq('id', incident.copropriete_id)
    .eq('syndic_id', user.id)
    .maybeSingle();
  if (!copro) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

  // Lire la pièce jointe
  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Format non supporté. Utilisez JPEG, PNG, WebP ou GIF.' }, { status: 415 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Image trop volumineuse (max 5 Mo).' }, { status: 413 });
  }

  // Upload vers le bucket documents
  const ext = file.type === 'image/jpeg' ? 'jpg' : file.type.split('/')[1];
  const storagePath = `incidents/${incidentId}-${Date.now()}.${ext}`;
  const arrayBuffer = await file.arrayBuffer();

  const { data: upload, error: uploadError } = await admin.storage
    .from('documents')
    .upload(storagePath, arrayBuffer, { contentType: file.type, upsert: true });

  if (uploadError) {
    return NextResponse.json({ error: 'Erreur lors de l\'upload.' }, { status: 500 });
  }

  const { data: { publicUrl } } = admin.storage.from('documents').getPublicUrl(upload.path);

  // Mettre à jour l'incident
  await admin.from('incidents').update({ photo_url: publicUrl }).eq('id', incidentId);

  return NextResponse.json({ url: publicUrl });
}
