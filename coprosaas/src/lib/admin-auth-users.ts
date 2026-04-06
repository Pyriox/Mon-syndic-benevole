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
  maxPages = 50,
): Promise<AdminAuthUsersResult> {
  const users: AdminAuthUser[] = [];
  let page = 1;
  let total = 0;
  let truncated = false;

  while (page <= Math.max(1, maxPages)) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const batch = data.users ?? [];
    const meta = data as { total?: number };
    if (typeof meta.total === 'number') total = meta.total;
    users.push(...batch);

    if (batch.length < perPage) {
      break;
    }

    if (page === maxPages) {
      truncated = true;
      break;
    }

    page += 1;
  }

  return {
    users,
    total: total || users.length,
    truncated,
    pagesFetched: page,
  };
}
