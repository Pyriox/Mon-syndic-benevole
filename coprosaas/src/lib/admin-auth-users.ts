import { createAdminClient } from '@/lib/supabase/admin';

type AdminClient = ReturnType<typeof createAdminClient>;
type AdminListUsersResponse = Awaited<ReturnType<AdminClient['auth']['admin']['listUsers']>>;
export type AdminAuthUser = AdminListUsersResponse['data']['users'][number];

export interface AdminAuthUsersResult {
  users: AdminAuthUser[];
  total: number;
  truncated: boolean;
  pagesFetched: number;
}

export async function listAllAdminAuthUsers(
  admin: AdminClient,
  perPage = 200,
  maxPages?: number,
): Promise<AdminAuthUsersResult> {
  const users: AdminAuthUser[] = [];
  let page = 1;
  let total = 0;
  let truncated = false;
  let pagesFetched = 0;
  const safePerPage = Math.max(1, Math.trunc(perPage));
  const safeMaxPages = maxPages && maxPages > 0 ? Math.trunc(maxPages) : null;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: safePerPage });
    if (error) throw error;
    pagesFetched += 1;

    const batch = data.users ?? [];
    const meta = data as { total?: number };
    if (typeof meta.total === 'number') total = meta.total;
    users.push(...batch);

    const reachedKnownTotal = total > 0 && users.length >= total;
    const reachedLastPage = batch.length < safePerPage;

    if (reachedKnownTotal || reachedLastPage) {
      break;
    }

    if (safeMaxPages && pagesFetched >= safeMaxPages) {
      truncated = true;
      break;
    }

    page += 1;
  }

  return {
    users,
    total: total || users.length,
    truncated,
    pagesFetched,
  };
}

export async function findAdminAuthUserByEmail(
  admin: AdminClient,
  email: string,
  perPage = 200,
  maxPages?: number,
): Promise<AdminAuthUser | null> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return null;

  let page = 1;
  let total = 0;
  let pagesFetched = 0;
  const safePerPage = Math.max(1, Math.trunc(perPage));
  const safeMaxPages = maxPages && maxPages > 0 ? Math.trunc(maxPages) : null;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: safePerPage });
    if (error) throw error;
    pagesFetched += 1;

    const batch = data.users ?? [];
    const meta = data as { total?: number };
    if (typeof meta.total === 'number') total = meta.total;

    const found = batch.find((user) => user.email?.toLowerCase() === normalizedEmail);
    if (found) return found;

    const reachedKnownTotal = total > 0 && pagesFetched * safePerPage >= total;
    const reachedLastPage = batch.length < safePerPage;
    if (reachedKnownTotal || reachedLastPage || (safeMaxPages && pagesFetched >= safeMaxPages)) {
      break;
    }

    page += 1;
  }

  return null;
}
