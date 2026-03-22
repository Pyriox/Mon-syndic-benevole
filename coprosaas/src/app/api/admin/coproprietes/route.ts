// ============================================================
// API Admin — gestion des abonnements des copropriétés
//
// POST /api/admin/coproprietes  { action, coproId }
//   → reset_subscription : remet le plan à 'essai', efface les champs Stripe
//   → stripe_sync        : lit l'abonnement réel depuis Stripe et met à jour Supabase
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { stripe } from '@/lib/stripe';
import { ADMIN_EMAIL } from '@/lib/admin-config';

async function checkAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.email?.trim().toLowerCase() === ADMIN_EMAIL ? user : null;
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

  if (action === 'stripe_sync') {
    const { data: copro, error: coproError } = await admin
      .from('coproprietes')
      .select('stripe_customer_id, stripe_subscription_id')
      .eq('id', coproId)
      .single();

    if (!copro || coproError) {
      return NextResponse.json({ error: 'Copropriété introuvable' }, { status: 404 });
    }
    if (!copro.stripe_customer_id && !copro.stripe_subscription_id) {
      return NextResponse.json({ error: 'Aucun identifiant Stripe sur cette copropriété' }, { status: 400 });
    }

    // 1. Récupérer l'abonnement directement par son ID si disponible
    let sub: Record<string, unknown> | null = null;
    if (copro.stripe_subscription_id) {
      try {
        sub = await stripe.subscriptions.retrieve(copro.stripe_subscription_id) as unknown as Record<string, unknown>;
      } catch { sub = null; }
    }
    // 2. Fallback : lister les abonnements du customer
    if (!sub && copro.stripe_customer_id) {
      try {
        const list = await stripe.subscriptions.list({ customer: copro.stripe_customer_id, limit: 5, status: 'all' });
        // Prefer active/trialing/past_due over canceled
        const best = list.data.find((s) => !['canceled', 'incomplete_expired'].includes(s.status))
          ?? list.data[0]
          ?? null;
        sub = best as unknown as Record<string, unknown> | null;
      } catch {
        // Customer deleted on Stripe → clear customer ID too
        await admin.from('coproprietes').update({
          plan: 'inactif', plan_id: null,
          stripe_subscription_id: null, stripe_customer_id: null, plan_period_end: null,
        }).eq('id', coproId);
        return NextResponse.json({ success: true, plan: 'inactif', note: 'customer_deleted' });
      }
    }

    if (!sub) {
      await admin.from('coproprietes').update({
        plan: 'inactif', plan_id: null, stripe_subscription_id: null, plan_period_end: null,
      }).eq('id', coproId);
      return NextResponse.json({ success: true, plan: 'inactif' });
    }

    const status = sub['status'] as string;
    const plan = status === 'active' ? 'actif'
      : status === 'past_due' ? 'passe_du'
      : status === 'trialing' ? 'actif'
      : 'inactif';
    const subMeta = (sub['metadata'] as Record<string, string>) ?? {};
    const planId = subMeta?.plan_id ?? null;
    const ts = sub['current_period_end'] as number | undefined;
    const periodEnd = ts && ts > 0 ? new Date(ts * 1000).toISOString() : null;

    const { error: syncError } = await admin.from('coproprietes').update({
      plan: plan as 'actif' | 'inactif' | 'passe_du' | 'essai',
      plan_id: planId,
      stripe_subscription_id: sub['id'] as string,
      stripe_customer_id: sub['customer'] as string,
      plan_period_end: periodEnd,
    }).eq('id', coproId);

    if (syncError) return NextResponse.json({ error: syncError.message }, { status: 500 });
    return NextResponse.json({ success: true, plan, planId });
  }

  return NextResponse.json({ error: 'Action inconnue' }, { status: 400 });
}
