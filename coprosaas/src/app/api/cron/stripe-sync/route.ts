import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  getStripe,
  extractStripeSubscriptionSnapshot,
  mapStripeSubscriptionStatus,
} from '@/lib/stripe';
import { syncCoproAddonsFromSnapshot } from '@/lib/stripe-addon-management';
import { getCronAuthState } from '@/lib/cron-auth';

/**
 * Cron hebdomadaire — synchronise les abonnements Stripe avec la base de données.
 * Détecte les dérives (webhooks ratés) en comparant stripe_subscription_id / plan / plan_period_end.
 * Planifié le lundi à 3h00 UTC.
 */
export async function GET(req: NextRequest) {
  const cronAuth = getCronAuthState(req);
  if (!cronAuth.ok) {
    return NextResponse.json({ message: 'Unauthorized', ...cronAuth.debug }, { status: 401 });
  }

  const admin = createAdminClient();
  const stripeClient = getStripe();

  // Récupère toutes les copropriétés ayant un abonnement Stripe actif en DB
  const { data: copros, error } = await admin
    .from('coproprietes')
    .select('id, plan, plan_id, plan_period_end, plan_cancel_at_period_end, stripe_subscription_id, stripe_customer_id')
    .not('stripe_subscription_id', 'is', null);

  if (error) {
    console.error('[stripe-sync] Erreur lecture coproprietes:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let synced = 0;
  let skipped = 0;
  let errors = 0;

  for (const copro of copros ?? []) {
    const subId = copro.stripe_subscription_id as string;

    try {
      const subscription = await stripeClient.subscriptions.retrieve(subId, {
        expand: ['items.data.price.product'],
      });

      const snapshot = extractStripeSubscriptionSnapshot(subscription);
      const newPlan = mapStripeSubscriptionStatus(snapshot.status);
      const newPeriodEnd = snapshot.currentPeriodEnd;
      const newCancelAtPeriodEnd = snapshot.cancelAtPeriodEnd;
      const newPlanId = snapshot.planId;

      // Comparer avec les valeurs en base
      const periodEndChanged = newPeriodEnd !== copro.plan_period_end;
      const planChanged = newPlan !== copro.plan;
      const cancelChanged = newCancelAtPeriodEnd !== copro.plan_cancel_at_period_end;
      const planIdChanged = newPlanId !== copro.plan_id;

      if (!periodEndChanged && !planChanged && !cancelChanged && !planIdChanged) {
        skipped++;
        continue;
      }

      // Mise à jour DB
      const { error: updateError } = await admin
        .from('coproprietes')
        .update({
          plan: newPlan,
          plan_id: newPlanId,
          plan_period_end: newPeriodEnd,
          plan_cancel_at_period_end: newCancelAtPeriodEnd,
        })
        .eq('id', copro.id);

      if (updateError) {
        console.error(`[stripe-sync] Erreur update copro ${copro.id}:`, updateError.message);
        errors++;
        continue;
      }

      // Synchronise les addons
      await syncCoproAddonsFromSnapshot(copro.id, snapshot);

      console.log(`[stripe-sync] Synced copro ${copro.id}: plan=${newPlan}, cancel=${newCancelAtPeriodEnd}`);
      synced++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // Abonnement supprimé côté Stripe → marquer inactif
      if (msg.includes('No such subscription')) {
        await admin
          .from('coproprietes')
          .update({ plan: 'inactif', plan_cancel_at_period_end: false })
          .eq('id', copro.id);
        console.warn(`[stripe-sync] Abonnement introuvable pour copro ${copro.id}, marqué inactif`);
        synced++;
      } else {
        console.error(`[stripe-sync] Erreur Stripe pour copro ${copro.id}:`, msg);
        errors++;
      }
    }
  }

  return NextResponse.json({
    ok: true,
    total: (copros ?? []).length,
    synced,
    skipped,
    errors,
  });
}
