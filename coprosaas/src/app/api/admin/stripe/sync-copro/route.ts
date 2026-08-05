// ============================================================
// POST /api/admin/stripe/sync-copro
// Force la resynchronisation d'une copropriété depuis Stripe.
// Utile quand un webhook Stripe n'a pas été reçu.
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAdminUser } from '@/lib/admin-config';
import {
  getStripe,
  extractStripeSubscriptionSnapshot,
  mapStripeSubscriptionStatus,
} from '@/lib/stripe';
import { syncCoproAddonsFromSnapshot } from '@/lib/stripe-addon-management';

export async function POST(req: NextRequest) {
  // Auth admin
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const admin = createAdminClient();
  if (!user || !(await isAdminUser(user.id, admin))) {
    return NextResponse.json({ message: 'Non autorisé' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const coproId: string | undefined = body.coproId;
  if (!coproId) {
    return NextResponse.json({ message: 'coproId requis' }, { status: 400 });
  }

  // Récupérer la copropriété
  const { data: copro, error: coproError } = await admin
    .from('coproprietes')
    .select('id, nom, stripe_subscription_id, stripe_customer_id, plan')
    .eq('id', coproId)
    .maybeSingle();

  if (coproError || !copro) {
    return NextResponse.json({ message: 'Copropriété introuvable' }, { status: 404 });
  }

  const stripeClient = getStripe();

  // Cas 1 : on a un stripe_subscription_id → sync directe
  if (copro.stripe_subscription_id) {
    try {
      const sub = await stripeClient.subscriptions.retrieve(copro.stripe_subscription_id, {
        expand: ['items.data.price.product'],
      });
      const snapshot = extractStripeSubscriptionSnapshot(sub);
      const newPlan = mapStripeSubscriptionStatus(snapshot.status, snapshot.currentPeriodEnd);

      await admin
        .from('coproprietes')
        .update({
          plan: newPlan,
          plan_id: snapshot.planId,
          plan_period_end: snapshot.currentPeriodEnd,
          plan_cancel_at_period_end: snapshot.cancelAtPeriodEnd,
        })
        .eq('id', coproId);

      await syncCoproAddonsFromSnapshot(coproId, snapshot);

      return NextResponse.json({
        ok: true,
        coproNom: copro.nom,
        before: copro.plan,
        after: newPlan,
        periodEnd: snapshot.currentPeriodEnd,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // Abonnement supprimé côté Stripe
      if (msg.includes('No such subscription')) {
        await admin
          .from('coproprietes')
          .update({ plan: 'inactif', plan_cancel_at_period_end: false })
          .eq('id', coproId);
        return NextResponse.json({ ok: true, coproNom: copro.nom, before: copro.plan, after: 'inactif', note: 'Abonnement Stripe introuvable' });
      }
      return NextResponse.json({ message: `Erreur Stripe : ${msg}` }, { status: 502 });
    }
  }

  // Cas 2 : pas de subscription_id mais on a un customer_id → chercher l'abonnement actif
  if (copro.stripe_customer_id) {
    try {
      const subs = await stripeClient.subscriptions.list({
        customer: copro.stripe_customer_id,
        status: 'all',
        limit: 5,
      });
      const activeSub = subs.data.find((s) =>
        ['active', 'past_due', 'trialing'].includes(s.status)
      ) ?? subs.data[0];

      if (!activeSub) {
        return NextResponse.json({ ok: false, message: 'Aucun abonnement Stripe trouvé pour ce client' }, { status: 404 });
      }

      // Retrieve pour avoir les items expandés (max 4 niveaux : items.data.price.product)
      const fullSub = await stripeClient.subscriptions.retrieve(activeSub.id, {
        expand: ['items.data.price.product'],
      });
      const snapshot = extractStripeSubscriptionSnapshot(fullSub);
      const newPlan = mapStripeSubscriptionStatus(fullSub.status, snapshot.currentPeriodEnd);

      await admin
        .from('coproprietes')
        .update({
          stripe_subscription_id: activeSub.id,
          plan: newPlan,
          plan_id: snapshot.planId,
          plan_period_end: snapshot.currentPeriodEnd,
          plan_cancel_at_period_end: snapshot.cancelAtPeriodEnd,
        })
        .eq('id', coproId);

      await syncCoproAddonsFromSnapshot(coproId, snapshot);

      return NextResponse.json({
        ok: true,
        coproNom: copro.nom,
        before: copro.plan,
        after: newPlan,
        periodEnd: snapshot.currentPeriodEnd,
        note: 'Abonnement retrouvé via customer_id',
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return NextResponse.json({ message: `Erreur Stripe : ${msg}` }, { status: 502 });
    }
  }

  return NextResponse.json({ ok: false, message: 'Aucun identifiant Stripe associé à cette copropriété' }, { status: 422 });
}
