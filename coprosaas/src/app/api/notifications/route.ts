import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ message: 'Non autorise' }, { status: 401 });

  const search = req.nextUrl.searchParams;
  const limit = Math.min(Math.max(parseInt(search.get('limit') ?? '30', 10), 1), 200);
  const unreadOnly = search.get('unread') === '1';

  let query = supabase
    .from('app_notifications')
    .select('id, type, severity, title, body, href, action_label, is_read, created_at, metadata', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (unreadOnly) query = query.eq('is_read', false);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });

  const { count: unreadCount } = await supabase
    .from('app_notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false);

  return NextResponse.json({
    notifications: data ?? [],
    total: count ?? 0,
    unread: unreadCount ?? 0,
  });
}
