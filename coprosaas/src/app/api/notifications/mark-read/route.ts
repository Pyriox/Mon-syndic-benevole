import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type MarkReadBody = {
  ids?: string[];
  all?: boolean;
};

async function pruneReadNotifications(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<void> {
  const { data: readRows, error } = await supabase
    .from('app_notifications')
    .select('id')
    .eq('user_id', userId)
    .eq('is_read', true)
    .order('read_at', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(200);

  if (error || !readRows || readRows.length <= 3) return;

  const idsToDelete = readRows.slice(3).map((row) => row.id);
  if (idsToDelete.length === 0) return;

  await supabase
    .from('app_notifications')
    .delete()
    .eq('user_id', userId)
    .in('id', idsToDelete);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ message: 'Non autorise' }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as MarkReadBody;
  const nowIso = new Date().toISOString();

  if (body.all) {
    const { error } = await supabase
      .from('app_notifications')
      .update({ is_read: true, read_at: nowIso })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (error) return NextResponse.json({ message: error.message }, { status: 500 });
    await pruneReadNotifications(supabase, user.id);
    return NextResponse.json({ ok: true });
  }

  const ids = (body.ids ?? []).filter(Boolean);
  if (ids.length === 0) {
    return NextResponse.json({ message: 'Aucune notification ciblee.' }, { status: 400 });
  }

  const { error } = await supabase
    .from('app_notifications')
    .update({ is_read: true, read_at: nowIso })
    .eq('user_id', user.id)
    .in('id', ids);

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  await pruneReadNotifications(supabase, user.id);
  return NextResponse.json({ ok: true });
}
