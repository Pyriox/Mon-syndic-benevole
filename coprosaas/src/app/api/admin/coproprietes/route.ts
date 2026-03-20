// ============================================================
// API Admin — gestion des abonnements des copropriétés
//
// POST /api/admin/coproprietes  { action, coproId }
//   → reset_subscription : remet le plan à 'essai', efface les champs Stripe
//     À utiliser uniquement quand Stripe est désynchronisé (suppression manuelle)
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'tpn.fabien@gmail.com';

async function checkAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.email === ADMIN_EMAIL ? user : null;
}

export async function POST(request: NextRequest) {
  if (!await checkAdmin()) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const body = await request.json() as { action: string; coproId?: string };
  const { action, coproId } = body;

  if (!coproId) {
    return NextResponse.json({ error: 'coproId requis' }, { status: 400 });
  }

  const admin = createAdminClient();

  if (action === 'reset_subscription') {
    const { error } = await admin
      .from('coproprietes')
      .update({
        plan: 'essai',
        plan_id: null,
        stripe_subscription_id: null,
        stripe_customer_id: null,
        plan_period_end: null,
      })
      .eq('id', coproId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Action inconnue' }, { status: 400 });
}
