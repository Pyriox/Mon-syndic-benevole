import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type MarkReadBody = {
  ids?: string[];
  all?: boolean;
};

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
  return NextResponse.json({ ok: true });
}
