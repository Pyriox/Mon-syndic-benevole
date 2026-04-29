// ============================================================
// Route : POST /api/log-activity
// Enregistre un événement d'activité depuis un composant client.
// Appelé avec fetch(..., { keepalive: true }) pour que la requête
// survive aux navigations immédiates.
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return NextResponse.json({ ok: false }, { status: 401 });

    const body = await req.json() as {
      eventType: string;
      label?: string;
      severity?: 'info' | 'warning' | 'error';
      metadata?: Record<string, unknown>;
      coproprieteId?: string | null;
    };

    if (!body.eventType?.trim()) return NextResponse.json({ ok: false }, { status: 400 });

    const admin = createAdminClient();
    await admin.from('user_events').insert({
      user_id: user.id,
      user_email: user.email.trim().toLowerCase(),
      event_type: body.eventType.trim(),
      label: (body.label ?? '').trim(),
      severity: body.severity ?? 'info',
      metadata: body.metadata ?? null,
      copropriete_id: body.coproprieteId ?? null,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
