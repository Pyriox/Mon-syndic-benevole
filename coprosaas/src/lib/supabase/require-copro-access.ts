// ============================================================
// Utilitaire de contrôle d'accès à une copropriété
//
// Vérifie que l'utilisateur connecté a bien accès à la
// copropriété contenue dans le cookie selected_copro_id.
// Si le cookie est absent (premier rendu), on retombe sur la première
// copropriété accessible, y compris via une fiche copropriétaire encore
// liée uniquement par email.
// Si le cookie est présent et que l'utilisateur n'a pas accès → redirect('/dashboard').
//
// Usage :
//   const { user, selectedCoproId, role, copro } = await requireCoproAccess();
//   // role: 'syndic' | 'copropriétaire' | null  (null si aucun cookie)
//
// Usage (syndic uniquement, redirige si coproprietaire) :
//   await requireCoproAccess(['syndic']);
// ============================================================
import { cache } from 'react';
import { getAuthUser } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { normalizeDashboardViewMode, resolveDashboardRole } from '@/lib/dashboard-view-mode';

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

async function resolveFirstAccessibleCopro({
  admin,
  userId,
  normalizedEmail,
  preferredViewMode,
}: {
  admin: ReturnType<typeof createAdminClient>;
  userId: string;
  normalizedEmail: string;
  preferredViewMode: ReturnType<typeof normalizeDashboardViewMode>;
}): Promise<Omit<CoproAccess, 'user'>> {
  const [{ data: firstSyndic }, { data: firstCopro }, { data: firstCoproByEmail }] = await Promise.all([
    admin
      .from('coproprietes')
      .select('id, nom, syndic_id, plan, plan_id')
      .eq('syndic_id', userId)
      .order('nom')
      .limit(1)
      .maybeSingle(),
    admin
      .from('coproprietaires')
      .select('coproprietes(id, nom, syndic_id, plan, plan_id)')
      .eq('user_id', userId)
      .order('copropriete_id')
      .limit(1)
      .maybeSingle(),
    normalizedEmail
      ? admin
          .from('coproprietaires')
          .select('coproprietes(id, nom, syndic_id, plan, plan_id)')
          .eq('email', normalizedEmail)
          .is('user_id', null)
          .order('copropriete_id')
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const firstCoproRelation = firstCopro?.coproprietes ?? firstCoproByEmail?.coproprietes ?? null;
  const firstCoproData = (Array.isArray(firstCoproRelation) ? firstCoproRelation[0] : firstCoproRelation) as CoproInfo | null;
  const resolvedRole = resolveDashboardRole({
    preferredMode: preferredViewMode,
    hasSyndicAccess: Boolean(firstSyndic),
    hasCoproAccess: Boolean(firstCoproData),
    defaultRole: 'syndic',
  });

  if (resolvedRole === 'syndic' && firstSyndic) {
    return { selectedCoproId: firstSyndic.id, role: 'syndic', copro: firstSyndic };
  }

  if (resolvedRole === 'copropriétaire' && firstCoproData) {
    return { selectedCoproId: firstCoproData.id, role: 'copropriétaire', copro: firstCoproData };
  }

  return { selectedCoproId: null, role: null, copro: null };
}

export const requireCoproAccess = cache(async function requireCoproAccess(allowedRoles?: CoproRole[]): Promise<CoproAccess> {
  // getAuthUser() est React.cache → résultat partagé avec le layout, 0 appel réseau supplémentaire
  const user = await getAuthUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const cookieStore = await cookies();
  const selectedCoproId = cookieStore.get('selected_copro_id')?.value ?? null;
  const preferredViewMode = normalizeDashboardViewMode(cookieStore.get('dashboard_view_mode')?.value ?? null);
  const normalizedEmail = user.email?.trim().toLowerCase() ?? '';

  // Pas de cookie : fallback sur la première copropriété accessible
  // (même logique que le layout — évite une vue vide avant que CoproSelector pose le cookie)
  if (!selectedCoproId) {
    const fallbackAccess = await resolveFirstAccessibleCopro({
      admin,
      userId: user.id,
      normalizedEmail,
      preferredViewMode,
    });

    if (fallbackAccess.role && allowedRoles && !allowedRoles.includes(fallbackAccess.role)) {
      redirect('/dashboard');
    }

    if (!fallbackAccess.role && allowedRoles) redirect('/dashboard');
    return { user, ...fallbackAccess };
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
    normalizedEmail
      ? admin
          .from('coproprietaires')
          .select('coproprietes(id, nom, syndic_id, plan, plan_id)')
          .eq('copropriete_id', selectedCoproId)
          .eq('email', normalizedEmail)
          .is('user_id', null)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const coproRelation = asCopro?.coproprietes ?? asCoproByEmail?.coproprietes ?? null;
  const coproData = (Array.isArray(coproRelation) ? coproRelation[0] : coproRelation) as CoproInfo | null;
  const resolvedRole = resolveDashboardRole({
    preferredMode: preferredViewMode,
    hasSyndicAccess: Boolean(asSyndic),
    hasCoproAccess: Boolean(coproData),
    defaultRole: 'syndic',
  });

  if (resolvedRole === 'syndic' && asSyndic) {
    if (allowedRoles && !allowedRoles.includes('syndic')) redirect('/dashboard');
    return { user, selectedCoproId: asSyndic.id, role: 'syndic', copro: asSyndic };
  }

  if (resolvedRole === 'copropriétaire' && coproData) {
    if (allowedRoles && !allowedRoles.includes('copropriétaire')) redirect('/dashboard');
    return { user, selectedCoproId: coproData.id, role: 'copropriétaire', copro: coproData };
  }

  const fallbackAccess = await resolveFirstAccessibleCopro({
    admin,
    userId: user.id,
    normalizedEmail,
    preferredViewMode,
  });

  if (fallbackAccess.role) {
    if (allowedRoles && !allowedRoles.includes(fallbackAccess.role)) redirect('/dashboard');
    return { user, ...fallbackAccess };
  }

  // Cookie présent mais aucun accès
  if (allowedRoles) redirect('/dashboard');
  return { user, selectedCoproId: null, role: null, copro: null };
});
