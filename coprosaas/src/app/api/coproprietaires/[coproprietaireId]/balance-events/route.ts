import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ coproprietaireId: string }> },
) {
  const { coproprietaireId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: 'Non autorisé.' }, { status: 401 });
  }

  const admin = createAdminClient();
  const normalizedEmail = user.email?.trim().toLowerCase() ?? '';
  const requestedLimit = Number.parseInt(request.nextUrl.searchParams.get('limit') ?? '150', 10);
  const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 200) : 150;

  const { data: coproprietaire } = await admin
    .from('coproprietaires')
    .select('id, copropriete_id, user_id, email, coproprietes(syndic_id)')
    .eq('id', coproprietaireId)
    .maybeSingle();

  if (!coproprietaire) {
    return NextResponse.json({ message: 'Copropriétaire introuvable.' }, { status: 404 });
  }

  const copro = (Array.isArray(coproprietaire.coproprietes)
    ? coproprietaire.coproprietes[0]
    : coproprietaire.coproprietes) as { syndic_id: string } | null;

  const isSyndic = copro?.syndic_id === user.id;
  const isOwner = coproprietaire.user_id === user.id;
  const hasEmailFallback = Boolean(normalizedEmail) && !coproprietaire.user_id && (coproprietaire.email ?? '').trim().toLowerCase() === normalizedEmail;

  if (!isSyndic && !isOwner && !hasEmailFallback) {
    return NextResponse.json({ message: 'Accès refusé.' }, { status: 403 });
  }

  const { data: events, error } = await admin
    .from('coproprietaire_balance_events')
    .select('id, event_date, source_type, account_type, label, reason, amount, balance_after, created_at')
    .eq('coproprietaire_id', coproprietaireId)
    .order('event_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ events: events ?? [] });
}
