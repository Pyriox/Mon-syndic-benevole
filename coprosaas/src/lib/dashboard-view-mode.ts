import type { Role } from '@/types';

export type DashboardViewMode = 'syndic' | 'coproprietaire';

export function normalizeDashboardViewMode(value: string | null | undefined): DashboardViewMode | null {
  if (!value) return null;

  const normalized = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

  if (normalized === 'syndic') return 'syndic';
  if (normalized === 'coproprietaire') return 'coproprietaire';
  return null;
}

export function getAvailableDashboardRoles({
  hasSyndicAccess,
  hasCoproAccess,
}: {
  hasSyndicAccess: boolean;
  hasCoproAccess: boolean;
}): Role[] {
  const roles: Role[] = [];

  if (hasSyndicAccess) roles.push('syndic');
  if (hasCoproAccess) roles.push('copropriétaire');

  return roles;
}

export function resolveDashboardRole({
  preferredMode,
  hasSyndicAccess,
  hasCoproAccess,
  defaultRole = 'syndic',
}: {
  preferredMode?: DashboardViewMode | null;
  hasSyndicAccess: boolean;
  hasCoproAccess: boolean;
  defaultRole?: Role;
}): Role | null {
  if (preferredMode === 'coproprietaire' && hasCoproAccess) return 'copropriétaire';
  if (preferredMode === 'syndic' && hasSyndicAccess) return 'syndic';

  if (defaultRole === 'syndic' && hasSyndicAccess) return 'syndic';
  if (defaultRole === 'copropriétaire' && hasCoproAccess) return 'copropriétaire';

  if (hasSyndicAccess) return 'syndic';
  if (hasCoproAccess) return 'copropriétaire';

  return null;
}

export function hasDualDashboardView(roles: Role[]): boolean {
  return roles.includes('syndic') && roles.includes('copropriétaire');
}

export function toDashboardViewMode(role: Role): DashboardViewMode {
  return role === 'copropriétaire' ? 'coproprietaire' : 'syndic';
}
