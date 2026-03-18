// POST /api/stripe/webhook
// Reçoit les événements Stripe et met à jour la table coproprietes en conséquence.
// UN abonnement Stripe = UNE copropriété.
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import Stripe from 'stripe';

// ⚠️ Ne pas parser le body en JSON — Stripe exige le raw body pour vérifier la signature.
export const runtime = 'nodejs';

/** Met à jour les champs d'abonnement sur la table coproprietes. */
async function updateCoproSubscription(coproId: string, data: {
  stripe_customer_id?: string;
  stripe_subscription_id?: string | null;
  plan_id?: string | null;
  plan?: 'actif' | 'inactif' | 'passe_du' | 'essai';
  plan_period_end?: string | null;
}) {
  const supabase = createAdminClient();
  await supabase
    .from('coproprietes')
    .update({
      stripe_customer_id:     data.stripe_customer_id,
      stripe_subscription_id: data.stripe_subscription_id,
      plan_id:                data.plan_id,
      plan:                   data.plan ?? 'essai',
      plan_period_end:        data.plan_period_end,
    })
    .eq('id', coproId);
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const sig = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: 'Signature ou secret manquant.' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Signature invalide';
    return NextResponse.json({ error: `Webhook error: ${msg}` }, { status: 400 });
  }

  try {
    switch (event.type) {

      // ── Abonnement créé après un checkout réussi ──────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const coproId = session.metadata?.copropriete_id;
        if (!coproId) break;

        let periodEnd: string | null = null;
        let subId: string | undefined;
        if (session.subscription) {
          const sub = await stripe.subscriptions.retrieve(
            session.subscription as string,
          ) as unknown as {
            id: string; current_period_end: number; metadata: Record<string, string>;
          };
          subId = sub.id;
          periodEnd = new Date(sub.current_period_end * 1000).toISOString();
        }

        await updateCoproSubscription(coproId, {
          stripe_customer_id:     session.customer as string,
          stripe_subscription_id: subId,
          plan_id:                session.metadata?.plan_id,
          plan:                   'actif',
          plan_period_end:        periodEnd,
        });
        break;
      }

      // ── Abonnement mis à jour (upgrade / downgrade / renouvellement) ──────
      case 'customer.subscription.updated': {
        const sub = event.data.object as unknown as {
          id: string; status: string; customer: string;
          current_period_end: number; metadata: Record<string, string>;
        };
        const coproId = sub.metadata?.copropriete_id;
        if (!coproId) break;

        const plan = sub.status === 'active'   ? 'actif'
          : sub.status === 'past_due'  ? 'passe_du'
          : sub.status === 'trialing'  ? 'essai'
          : 'inactif';

        await updateCoproSubscription(coproId, {
          stripe_customer_id:     sub.customer as string,
          stripe_subscription_id: sub.id,
          plan_id:                sub.metadata?.plan_id,
          plan:                   plan as 'actif' | 'inactif' | 'passe_du' | 'essai',
          plan_period_end:        new Date(sub.current_period_end * 1000).toISOString(),
        });
        break;
      }

      // ── Abonnement résilié ────────────────────────────────────────────────
      case 'customer.subscription.deleted': {
        const sub = event.data.object as unknown as {
          id: string; customer: string; metadata: Record<string, string>;
        };
        const coproId = sub.metadata?.copropriete_id;
        if (!coproId) break;

        await updateCoproSubscription(coproId, {
          stripe_customer_id:     sub.customer as string,
          stripe_subscription_id: null,
          plan_id:                null,
          plan:                   'inactif',
          plan_period_end:        null,
        });
        break;
      }

      // ── Paiement échoué ───────────────────────────────────────────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const supabase = createAdminClient();
        const { data: copro } = await supabase
          .from('coproprietes')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();
        if (!copro) break;
        await updateCoproSubscription(copro.id, { plan: 'passe_du' });
        break;
      }
    }
  } catch (e) {
    console.error('[Stripe webhook] Erreur traitement:', e);
  }

  return NextResponse.json({ received: true });
}
