// POST /api/stripe/webhook
// Reçoit les événements Stripe et met à jour Supabase en conséquence
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import Stripe from 'stripe';

// ⚠️ Ne pas parser le body en JSON — Stripe exige le raw body pour vérifier la signature
export const runtime = 'nodejs';

async function updateUserSubscription(supabaseUserId: string, data: {
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  plan_id?: string;
  plan_status?: 'actif' | 'inactif' | 'passe_du' | 'essai';
  plan_period_end?: string | null;
}) {
  const supabase = createAdminClient();
  await supabase.auth.admin.updateUserById(supabaseUserId, {
    user_metadata: {
      plan:                   data.plan_status ?? 'essai',
      plan_id:                data.plan_id,
      plan_status:            data.plan_status,
      stripe_customer_id:     data.stripe_customer_id,
      stripe_subscription_id: data.stripe_subscription_id,
      plan_period_end:        data.plan_period_end,
    },
  });
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

      // ── Abonnement créé après un checkout réussi ──────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = (session.metadata?.supabase_user_id ?? session.client_reference_id) as string | null;
        if (!userId) break;

        // Récupérer les détails de l'abonnement
        let periodEnd: string | null = null;
        let subId: string | undefined;
        if (session.subscription) {
          const sub = await stripe.subscriptions.retrieve(session.subscription as string) as unknown as { id: string; current_period_end: number; metadata: Record<string, string> };
          subId = sub.id;
          periodEnd = new Date(sub.current_period_end * 1000).toISOString();
        }

        await updateUserSubscription(userId, {
          stripe_customer_id:     session.customer as string,
          stripe_subscription_id: subId,
          plan_id:                session.metadata?.plan_id,
          plan_status:            'actif',
          plan_period_end:        periodEnd,
        });
        break;
      }

      // ── Abonnement mis à jour (upgrade/downgrade/renouvellement) ──
      case 'customer.subscription.updated': {
        const sub = event.data.object as unknown as { id: string; status: string; customer: string; current_period_end: number; metadata: Record<string, string> };
        const userId = sub.metadata?.supabase_user_id as string | undefined;
        if (!userId) break;

        const status = sub.status === 'active' ? 'actif'
          : sub.status === 'past_due' ? 'passe_du'
          : sub.status === 'trialing' ? 'essai'
          : 'inactif';

        await updateUserSubscription(userId, {
          stripe_customer_id:     sub.customer as string,
          stripe_subscription_id: sub.id,
          plan_id:                sub.metadata?.plan_id,
          plan_status:            status as 'actif' | 'inactif' | 'passe_du' | 'essai',
          plan_period_end:        new Date(sub.current_period_end * 1000).toISOString(),
        });
        break;
      }

      // ── Abonnement résilié ────────────────────────────────────────
      case 'customer.subscription.deleted': {
        const sub = event.data.object as unknown as { id: string; customer: string; metadata: Record<string, string> };
        const userId = sub.metadata?.supabase_user_id as string | undefined;
        if (!userId) break;

        await updateUserSubscription(userId, {
          stripe_customer_id:     sub.customer as string,
          stripe_subscription_id: sub.id,
          plan_id:                sub.metadata?.plan_id,
          plan_status:            'inactif',
          plan_period_end:        null,
        });
        break;
      }

      // ── Paiement échoué ───────────────────────────────────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
        const userId = customer.metadata?.supabase_user_id;
        if (!userId) break;
        await updateUserSubscription(userId, { plan_status: 'passe_du' });
        break;
      }
    }
  } catch (e) {
    console.error('[Stripe webhook] Erreur traitement:', e);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
