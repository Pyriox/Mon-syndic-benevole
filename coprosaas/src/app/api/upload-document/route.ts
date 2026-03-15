// ============================================================
// API Route : Upload de document vers Supabase Storage
// Utilise le client admin (service role) pour contourner la RLS
// du bucket storage tout en vérifiant l'authentification.
// POST /api/upload-document
// Body: FormData { file, copropriete_id, nom, type, dossier_id? }
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  // 1. Vérification de l'authentification
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  // 2. Lecture du FormData
  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const copropriete_id = formData.get('copropriete_id') as string | null;
  const nom = formData.get('nom') as string | null;
  const type = formData.get('type') as string | null;
  const dossier_id = formData.get('dossier_id') as string | null;

  if (!file || !copropriete_id || !nom || !type) {
    return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
  }

  // 3. Vérification que l'utilisateur possède bien cette copropriété
  const { data: copro } = await supabase
    .from('coproprietes')
    .select('id')
    .eq('id', copropriete_id)
    .eq('syndic_id', user.id)
    .maybeSingle();

  if (!copro) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  // 4. Upload via le client admin (bypasse la RLS du storage)
  const admin = createAdminClient();
  const fileExt = file.name.split('.').pop();
  const safeName = nom.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-_]/g, '');
  const fileName = `${copropriete_id}/${Date.now()}-${safeName}.${fileExt}`;
  const arrayBuffer = await file.arrayBuffer();

  const { data: uploadData, error: uploadError } = await admin.storage
    .from('documents')
    .upload(fileName, arrayBuffer, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: { publicUrl } } = admin.storage.from('documents').getPublicUrl(uploadData.path);

  // 5. Enregistrement en base via le client admin
  const { error: dbError } = await admin.from('documents').insert({
    copropriete_id,
    dossier_id: dossier_id || null,
    nom: nom.trim(),
    type,
    url: publicUrl,
    taille: file.size,
    uploaded_by: user.id,
  });

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ url: publicUrl });
}
