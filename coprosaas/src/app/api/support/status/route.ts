// ============================================================
// PATCH /api/support/status — Modifier le statut d'un ticket
// Réservé à l'admin
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'tpn.fabien@gmail.com';

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email?.toLowerCase() !== ADMIN_EMAIL?.toLowerCase()) {
    return NextResponse.json({ message: 'Non autorisé' }, { status: 403 });
  }

  let body: { ticketId?: string; status?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 });
  }

  const VALID = ['ouvert', 'en_cours', 'resolu'];
  const { ticketId, status } = body;

  if (!ticketId?.trim() || !status || !VALID.includes(status)) {
    return NextResponse.json({ message: 'Données invalides' }, { status: 422 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from('support_tickets')
    .update({ status })
    .eq('id', ticketId.trim());

  if (error) {
    return NextResponse.json({ message: 'Erreur base de données' }, { status: 500 });
  }

  return NextResponse.json({ message: 'Statut mis à jour' });
}
