// ============================================================
// API Admin — gestion des copropriétaires
//
// PATCH /api/admin/coproprietaires  { coproprietaireId, nom?, prenom?, raison_sociale?,
//                                     telephone?, email?, adresse?, complement_adresse?,
//                                     code_postal?, ville?, solde? }
//   → modifier les informations d'un copropriétaire
//   → si user_id renseigné : synchronise aussi auth.users (email, full_name)
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

// ── PATCH : modifier un copropriétaire ────────────────────────
export async function PATCH(request: NextRequest) {
  const requester = await checkAdmin();
  if (!requester) {
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

  const admin = createAdminClient();

  // Récupérer la fiche pour connaître le user_id lié
  const { data: existing, error: fetchErr } = await admin
    .from('coproprietaires')
    .select('user_id, nom, prenom, raison_sociale')
    .eq('id', coproprietaireId.trim())
    .single();
  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });

  const trimOrNull = (v?: string) => (v !== undefined ? v.trim() || null : undefined);

  const updates: Record<string, unknown> = {};
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

  // Mise à jour de la fiche coproprietaire
  const { error } = await admin
    .from('coproprietaires')
    .update(updates)
    .eq('id', coproprietaireId.trim());
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // ── Synchronisation du compte utilisateur lié ─────────────
  const linkedUserId = existing?.user_id as string | null;
  if (linkedUserId) {
    // Email → auth.users.email
    if (fields.email?.trim()) {
      await admin.auth.admin.updateUserById(linkedUserId, {
        email: fields.email.trim().toLowerCase(),
      });
    }

    // Nom → auth.users.user_metadata.full_name (même logique que le profil)
    const nomChanged     = fields.nom             !== undefined;
    const prenomChanged  = fields.prenom          !== undefined;
    const raisonChanged  = fields.raison_sociale  !== undefined;
    if (nomChanged || prenomChanged || raisonChanged) {
      const raisonSociale = (fields.raison_sociale ?? existing?.raison_sociale ?? '').trim();
      const prenom = (fields.prenom ?? existing?.prenom ?? '').trim();
      const nom = (fields.nom ?? existing?.nom ?? '').trim();
      const newFullName = raisonSociale
        ? raisonSociale
        : `${prenom} ${nom}`.trim();
      if (newFullName) {
        const { data: authUser } = await admin.auth.admin.getUserById(linkedUserId);
        const existingMetadata = (authUser.user?.user_metadata ?? {}) as Record<string, unknown>;
        await admin.auth.admin.updateUserById(linkedUserId, {
          user_metadata: { ...existingMetadata, full_name: newFullName },
        });
        // Mettre à jour également la table profiles
        await admin.from('profiles').upsert(
          { id: linkedUserId, full_name: newFullName },
          { onConflict: 'id' },
        );
      }
    }
  }

  void logAdminAction({
    adminEmail: requester.email ?? '',
    eventType: 'admin_coproprietaire_updated',
    label: `Copropriétaire modifié — ${coproprietaireId.trim()}`,
    metadata: {
      coproprietaireId: coproprietaireId.trim(),
      linkedUserId,
      updatedFields: Object.keys(updates),
    },
  });

  return NextResponse.json({ success: true });
}
