// ============================================================
// API Admin — gestion des copropriétaires
//
// PATCH /api/admin/coproprietaires  { coproprietaireId, nom?, prenom?, raison_sociale?,
//                                     telephone?, email?, adresse?, complement_adresse?,
//                                     code_postal?, ville?, solde? }
//   → modifier les informations d'un copropriétaire
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAdminUser } from '@/lib/admin-config';

async function checkAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createAdminClient();
  return (await isAdminUser(user.id, admin)) ? user : null;
}

// ── PATCH : modifier un copropriétaire ────────────────────────
export async function PATCH(request: NextRequest) {
  if (!await checkAdmin()) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const body = await request.json() as {
    coproprietaireId?: string;
    nom?: string;
    prenom?: string;
    raison_sociale?: string;
    telephone?: string;
    email?: string;
    adresse?: string;
    complement_adresse?: string;
    code_postal?: string;
    ville?: string;
    solde?: number;
  };

  const { coproprietaireId, ...fields } = body;
  if (!coproprietaireId?.trim()) {
    return NextResponse.json({ error: 'coproprietaireId requis' }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  const trimOrNull = (v?: string) => (v !== undefined ? v.trim() || null : undefined);

  if (fields.nom                !== undefined) updates.nom                 = trimOrNull(fields.nom);
  if (fields.prenom             !== undefined) updates.prenom              = trimOrNull(fields.prenom);
  if (fields.raison_sociale     !== undefined) updates.raison_sociale      = trimOrNull(fields.raison_sociale);
  if (fields.telephone          !== undefined) updates.telephone           = trimOrNull(fields.telephone);
  if (fields.email              !== undefined) updates.email               = trimOrNull(fields.email);
  if (fields.adresse            !== undefined) updates.adresse             = trimOrNull(fields.adresse);
  if (fields.complement_adresse !== undefined) updates.complement_adresse  = trimOrNull(fields.complement_adresse);
  if (fields.code_postal        !== undefined) updates.code_postal         = trimOrNull(fields.code_postal);
  if (fields.ville              !== undefined) updates.ville               = trimOrNull(fields.ville);
  if (fields.solde              !== undefined) updates.solde               = Number(fields.solde);

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Aucun champ à mettre à jour' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from('coproprietaires')
    .update(updates)
    .eq('id', coproprietaireId.trim());

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
