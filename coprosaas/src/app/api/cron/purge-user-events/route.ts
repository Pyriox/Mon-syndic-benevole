import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCronAuthState } from '@/lib/cron-auth';

/**
 * Cron mensuel — purge les user_events opérationnels de plus de 12 mois.
 * Conserve à vie les événements billing, account et admin.
 * Planifié le 1er de chaque mois à 2h00 UTC.
 */
export async function GET(req: NextRequest) {
  const cronAuth = getCronAuthState(req);
  if (!cronAuth.ok) {
    return NextResponse.json({ message: 'Unauthorized', ...cronAuth.debug }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data, error } = await admin.rpc('purge_old_activity_events');

  if (error) {
    console.error('[purge-user-events] Erreur:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log(`[purge-user-events] ${data as number} événement(s) supprimé(s)`);
  return NextResponse.json({ deleted: data });
}
