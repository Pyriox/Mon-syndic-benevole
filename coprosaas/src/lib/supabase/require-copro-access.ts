// ============================================================
// Utilitaire de contrôle d'accès à une copropriété
//
// Vérifie que l'utilisateur connecté a bien accès à la
// copropriété contenue dans le cookie selected_copro_id.
// Si le cookie est absent (premier rendu), aucune vérification n'est nécessaire
// car toutes les requêtes utiliseront 'none' comme identifiant → résultats vides.
// Si le cookie est présent et que l'utilisateur n'a pas accès → redirect('/dashboard').
//
// Usage :
//   const { user, selectedCoproId, role, copro } = await requireCoproAccess();
//   // role: 'syndic' | 'copropriétaire' | null  (null si aucun cookie)
//
// Usage (syndic uniquement, redirige si coproprietaire) :
//   await requireCoproAccess(['syndic']);
// ============================================================
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

export type CoproRole = 'syndic' | 'copropriétaire';

export type CoproInfo = {
  id: string;
  nom: string;
  syndic_id: string;
  plan: string | null;
  plan_id: string | null;
};

export interface CoproAccess {
  user: User;
  selectedCoproId: string | null;
  role: CoproRole | null;
  copro: CoproInfo | null;
}

export async function requireCoproAccess(allowedRoles?: CoproRole[]): Promise<CoproAccess> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const cookieStore = await cookies();
  const selectedCoproId = cookieStore.get('selected_copro_id')?.value ?? null;

  // Pas de cookie : fallback sur la première copropriété accessible
  // (même logique que le layout — évite une vue vide avant que CoproSelector pose le cookie)
  if (!selectedCoproId) {
    const [{ data: firstSyndic }, { data: firstCopro }] = await Promise.all([
      admin
        .from('coproprietes')
        .select('id, nom, syndic_id, plan, plan_id')
        .eq('syndic_id', user.id)
        .order('nom')
        .limit(1)
        .maybeSingle(),
      admin
        .from('coproprietaires')
        .select('coproprietes(id, nom, syndic_id, plan, plan_id)')
        .eq('user_id', user.id)
        .order('copropriete_id')
        .limit(1)
        .maybeSingle(),
    ]);

    if (firstSyndic) {
      if (allowedRoles && !allowedRoles.includes('syndic')) redirect('/dashboard');
      return { user, selectedCoproId: firstSyndic.id, role: 'syndic', copro: firstSyndic };
    }
    if (firstCopro?.coproprietes) {
      const copro = firstCopro.coproprietes as unknown as CoproInfo;
      if (allowedRoles && !allowedRoles.includes('copropriétaire')) redirect('/dashboard');
      return { user, selectedCoproId: copro.id, role: 'copropriétaire', copro };
    }

    // Aucune copropriété accessible
    if (allowedRoles) redirect('/dashboard');
    return { user, selectedCoproId: null, role: null, copro: null };
  }

  // Cookie présent : utilise le client admin pour bypasser la RLS sur coproprietes
  const [{ data: asSyndic }, { data: asCopro }, { data: asCoproByEmail }] = await Promise.all([
    admin
      .from('coproprietes')
      .select('id, nom, syndic_id, plan, plan_id')
      .eq('id', selectedCoproId)
      .eq('syndic_id', user.id)
      .maybeSingle(),
    admin
      .from('coproprietaires')
      .select('coproprietes(id, nom, syndic_id, plan, plan_id)')
      .eq('copropriete_id', selectedCoproId)
      .eq('user_id', user.id)
      .maybeSingle(),
    admin
      .from('coproprietaires')
      .select('coproprietes(id, nom, syndic_id, plan, plan_id)')
      .eq('copropriete_id', selectedCoproId)
      .eq('email', user.email ?? '')
      .is('user_id', null)
      .maybeSingle(),
  ]);

  if (asSyndic) {
    if (allowedRoles && !allowedRoles.includes('syndic')) redirect('/dashboard');
    return { user, selectedCoproId, role: 'syndic', copro: asSyndic };
  }

  if (asCopro?.coproprietes) {
    const copro = asCopro.coproprietes as unknown as CoproInfo;
    if (allowedRoles && !allowedRoles.includes('copropriétaire')) redirect('/dashboard');
    return { user, selectedCoproId, role: 'copropriétaire', copro };
  }

  if (asCoproByEmail?.coproprietes) {
    const copro = asCoproByEmail.coproprietes as unknown as CoproInfo;
    if (allowedRoles && !allowedRoles.includes('copropriétaire')) redirect('/dashboard');
    return { user, selectedCoproId, role: 'copropriétaire', copro };
  }

  // Cookie présent mais aucun accès
  if (allowedRoles) redirect('/dashboard');
  return { user, selectedCoproId: null, role: null, copro: null };
}
