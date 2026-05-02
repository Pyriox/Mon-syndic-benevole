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
import { logEventForEmail } from '@/lib/actions/log-user-event';
import { isSubscribed } from '@/lib/subscription';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { hasMagicBytes } from '@/lib/utils-file';
import { buildCoproStorageDownloadHref } from '@/lib/storage-path';

export async function POST(req: NextRequest) {
  // 1. Vérification de l'authentification
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  // 1b. Rate limiting : 10 uploads/minute par utilisateur
  const ip = getClientIp(req);
  const allowed = await rateLimit(`upload:${user.id}:${ip}`, 10, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: 'Trop de requêtes. Veuillez patienter.' }, { status: 429 });
  }

  // 2. Lecture du FormData
  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const copropriete_id = formData.get('copropriete_id') as string | null;
  const nom = formData.get('nom') as string | null;
  const type = formData.get('type') as string | null;
  const dossier_id = formData.get('dossier_id') as string | null;

  const coproprietaire_id = formData.get('coproprietaire_id') as string | null;

  if (!file || !copropriete_id || !nom || !type) {
    return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
  }

  // 2b. Validation du type et de la taille du fichier
  const ALLOWED_TYPES = [
    'application/pdf',
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain', 'text/csv',
  ];
  const MAX_SIZE = 20 * 1024 * 1024; // 20 Mo
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Type de fichier non autorisé' }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Fichier trop volumineux (max 20 Mo)' }, { status: 413 });
  }

  // 3. Vérification que l'utilisateur possède bien cette copropriété
  const { data: copro } = await supabase
    .from('coproprietes')
    .select('id, plan')
    .eq('id', copropriete_id)
    .eq('syndic_id', user.id)
    .maybeSingle();

  if (!copro) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  const admin = createAdminClient();

  if (dossier_id) {
    const { data: dossier } = await admin
      .from('document_dossiers')
      .select('id')
      .eq('id', dossier_id)
      .eq('syndic_id', user.id)
      .maybeSingle();

    if (!dossier) {
      return NextResponse.json({ error: 'Dossier invalide pour cette copropriété.' }, { status: 400 });
    }
  }

  if (coproprietaire_id) {
    const { data: coproprietaire } = await admin
      .from('coproprietaires')
      .select('id')
      .eq('id', coproprietaire_id)
      .eq('copropriete_id', copropriete_id)
      .maybeSingle();

    if (!coproprietaire) {
      return NextResponse.json({ error: 'Copropriétaire invalide pour ce document.' }, { status: 400 });
    }
  }

  // 3b. Vérification de l'abonnement actif
  if (!isSubscribed((copro as { id: string; plan: string | null }).plan)) {
    return NextResponse.json({ error: 'Abonnement requis pour uploader des documents' }, { status: 403 });
  }

  // 4. Upload via le client admin (bypasse la RLS du storage)
  // Extension issue du MIME type (pas du nom de fichier) pour éviter le spoofing
  const MIME_TO_EXT: Record<string, string> = {
    'application/pdf': 'pdf',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'text/plain': 'txt',
    'text/csv': 'csv',
  };
  const fileExt = MIME_TO_EXT[file.type] ?? 'bin';
  const safeName = (nom
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9-_]/g, '')
    || 'document');
  const fileName = `${copropriete_id}/${Date.now()}-${safeName}.${fileExt}`;
  const arrayBuffer = await file.arrayBuffer();

  // 4b. Validation des magic bytes (contenu réel vs type déclaré)
  if (!hasMagicBytes(arrayBuffer, file.type)) {
    return NextResponse.json({ error: 'Le contenu du fichier ne correspond pas au type déclaré' }, { status: 400 });
  }

  const { data: uploadData, error: uploadError } = await admin.storage
    .from('documents')
    .upload(fileName, arrayBuffer, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    console.error('[upload-document] Storage error:', uploadError.message);
    return NextResponse.json({ error: "Erreur lors de l'upload du fichier." }, { status: 500 });
  }

  // 5. Enregistrement en base via le client admin
  const { error: dbError } = await admin.from('documents').insert({
    copropriete_id,
    dossier_id: dossier_id || null,
    nom: nom.trim(),
    type,
    url: uploadData.path,
    taille: file.size,
    uploaded_by: user.id,
    ...(coproprietaire_id ? { coproprietaire_id } : {}),
  });

  if (dbError) {
    console.error('[upload-document] DB error:', dbError.message);
    await admin.storage.from('documents').remove([uploadData.path]).catch((cleanupError) => {
      console.error('[upload-document] cleanup error:', cleanupError);
    });
    return NextResponse.json({ error: "Erreur lors de l'enregistrement du document." }, { status: 500 });
  }

  if (user.email) {
    await logEventForEmail({
      email: user.email,
      userId: user.id,
      eventType: 'document_added',
      label: `Document ajouté : ${nom.trim()}`,
      coproprieteId: copropriete_id,
      metadata: {
        copropriete_id,
        dossier_id: dossier_id || null,
        coproprietaire_id: coproprietaire_id || null,
        storagePath: uploadData.path,
        taille: file.size,
      },
    });
  }

  return NextResponse.json({
    url: buildCoproStorageDownloadHref(copropriete_id, uploadData.path),
    storagePath: uploadData.path,
  });
}

