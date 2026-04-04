import { createAdminClient } from '@/lib/supabase/admin';

type AdminClient = ReturnType<typeof createAdminClient>;

export async function listAllAdminAuthUsers(admin: AdminClient, perPage = 200) {
  const users: Array<Awaited<ReturnType<AdminClient['auth']['admin']['listUsers']>>['data']['users'][number]> = [];
  let page = 1;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const batch = data.users ?? [];
    users.push(...batch);

    if (batch.length < perPage) break;
    page += 1;
  }

  return users;
}
