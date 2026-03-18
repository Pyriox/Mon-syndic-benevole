// Route de diagnostic — À SUPPRIMER avant la mise en production
// Accès : /api/debug-sync?coproId=VOTRE_COPRO_ID
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  const coproId = req.nextUrl.searchParams.get('coproId');

  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const admin = createAdminClient();
  const result: Record<string, unknown> = { userId: user.id, coproId };

  // 1. Lire la ligne copropriété (toutes colonnes disponibles)
  const { data: copro, error: coproErr } = await admin
    .from('coproprietes')
    .select('*')
    .eq('id', coproId ?? '')
    .eq('syndic_id', user.id)
    .single();

  result.supabase_row = copro ?? null;
  result.supabase_error = coproErr?.message ?? null;

  if (!copro) {
    return NextResponse.json({ ...result, step: 'STOPPED: copropriété introuvable' });
  }

  result.columns_present = {
    plan: 'plan' in copro,
    plan_id: 'plan_id' in copro,
    stripe_customer_id: 'stripe_customer_id' in copro,
    stripe_subscription_id: 'stripe_subscription_id' in copro,
    plan_period_end: 'plan_period_end' in copro,
  };

  // 2. Stripe — chercher le customer
  const { getStripe } = await import('@/lib/stripe');
  const stripe = getStripe();

  const customerId: string | null = copro.stripe_customer_id ?? null;
  result.stripe_customer_id_in_db = customerId;

  if (!customerId) {
    result.stripe_search = 'stripe_customer_id absent de la DB, tentative de recherche Stripe...';
    try {
      const found = await stripe.customers.search({
        query: `metadata['copropriete_id']:'${coproId}'`,
        limit: 1,
      });
      result.stripe_search_result = found.data.map((c) => ({ id: c.id, email: c.email, metadata: c.metadata }));
    } catch (e) {
      result.stripe_search_error = String(e);
    }
    return NextResponse.json({ ...result, step: 'STOPPED: pas de customer ID' });
  }

  // 3. Stripe — lister les abonnements
  try {
    const subs = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all' as 'active',
      limit: 10,
    });
    result.stripe_subscriptions = subs.data.map((s) => {
      const raw = s as unknown as Record<string, unknown>;
      const ts = raw['current_period_end'] as number | undefined;
      let periodEnd: string | null = null;
      try { periodEnd = ts && ts > 0 ? new Date(ts * 1000).toISOString() : null; } catch { periodEnd = `INVALID(${ts})`; }
      return {
        id: s.id,
        status: s.status,
        created: new Date(s.created * 1000).toISOString(),
        current_period_end_raw: ts,
        current_period_end: periodEnd,
        all_fields: Object.keys(raw),
        metadata: s.metadata,
        price_id: (raw['items'] as { data: { price: { id: string } }[] } | undefined)?.data[0]?.price.id,
      };
    });
  } catch (e) {
    result.stripe_error = String(e);
  }

  // 4. Test UPDATE (dry-run avec les mêmes données qu'un sync réel)
  const { error: updateErr } = await admin
    .from('coproprietes')
    .update({ plan: copro.plan ?? 'essai' }) // UPDATE no-op pour tester si la colonne existe
    .eq('id', coproId ?? '');
  result.update_test_error = updateErr?.message ?? null;
  result.update_test_ok = !updateErr;

  return NextResponse.json(result, { status: 200 });
}
