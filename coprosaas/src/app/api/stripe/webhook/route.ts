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
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  plan_id?: string | null;
  plan?: 'actif' | 'inactif' | 'passe_du' | 'essai';
  plan_period_end?: string | null;
}) {
  const supabase = createAdminClient();
  const update: Record<string, unknown> = {
    stripe_subscription_id: data.stripe_subscription_id,
    plan_id:                data.plan_id,
    plan:                   data.plan ?? 'essai',
    plan_period_end:        data.plan_period_end,
  };
  // N'écraser stripe_customer_id que si explicitement fourni
  if (data.stripe_customer_id !== undefined) {
    update.stripe_customer_id = data.stripe_customer_id;
  }
  await supabase
    .from('coproprietes')
    .update(update)
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
        let subPlan: 'actif' | 'essai' = 'actif';
        if (session.subscription) {
          const sub = await stripe.subscriptions.retrieve(
            session.subscription as string,
          ) as unknown as Record<string, unknown>;
          subId = sub['id'] as string;
          const ts = sub['current_period_end'] as number | undefined;
          periodEnd = ts && ts > 0 ? (() => { try { return new Date(ts * 1000).toISOString(); } catch { return null; } })() : null;
          // trialing = essai (14j) ; active = abonnement payé
          subPlan = (sub['status'] as string) === 'trialing' ? 'essai' : 'actif';
        }

        await updateCoproSubscription(coproId, {
          stripe_customer_id:     session.customer as string,
          stripe_subscription_id: subId,
          plan_id:                session.metadata?.plan_id,
          plan:                   subPlan,
          plan_period_end:        periodEnd,
        });

        // Marquer l'essai comme utilisé pour cet utilisateur (anti-abus recréation de copropriété)
        const userId = session.metadata?.supabase_user_id;
        if (userId) {
          const supabase = createAdminClient();
          await supabase.from('profiles').update({ trial_used: true }).eq('id', userId);
        }
        break;
      }

      // ── Abonnement mis à jour (upgrade / downgrade / renouvellement) ──────
      case 'customer.subscription.updated': {
        const sub = event.data.object as unknown as Record<string, unknown>;
        const subMeta = (sub['metadata'] as Record<string, string>) ?? {};
        let coproId = subMeta?.copropriete_id;

        // Fallback : retrouver la copropriété via stripe_customer_id
        if (!coproId && sub['customer']) {
          const supabase = createAdminClient();
          const { data } = await supabase
            .from('coproprietes')
            .select('id')
            .eq('stripe_customer_id', sub['customer'] as string)
            .maybeSingle();
          if (data) coproId = data.id;
        }
        if (!coproId) break;

        const subStatus = sub['status'] as string;
        const plan = subStatus === 'active'   ? 'actif'
          : subStatus === 'past_due' ? 'passe_du'
          : subStatus === 'trialing' ? 'essai'   // période d'essai (14j après saisie CB)
          : 'inactif';

        const ts = (sub['current_period_end'] as number | undefined) || 0;
        const periodEnd = ts > 0 ? (() => { try { return new Date(ts * 1000).toISOString(); } catch { return null; } })() : null;

        await updateCoproSubscription(coproId, {
          stripe_customer_id:     sub['customer'] as string,
          stripe_subscription_id: sub['id'] as string,
          plan_id:                subMeta?.plan_id ?? null,
          plan:                   plan as 'actif' | 'inactif' | 'passe_du' | 'essai',
          plan_period_end:        periodEnd,
        });
        break;
      }

      // ── Abonnement résilié ────────────────────────────────────────────────
      case 'customer.subscription.deleted': {
        const sub = event.data.object as unknown as {
          id: string; customer: string; metadata: Record<string, string>;
        };
        let coproId = sub.metadata?.copropriete_id;

        // Fallback : retrouver la copropriété via stripe_customer_id
        // (abonnements sans copropriete_id dans les métadonnées)
        if (!coproId && sub.customer) {
          const supabase = createAdminClient();
          const { data } = await supabase
            .from('coproprietes')
            .select('id')
            .eq('stripe_customer_id', sub.customer)
            .maybeSingle();
          if (data) coproId = data.id;
        }
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

      // ── Client Stripe supprimé manuellement ──────────────────────────────
      case 'customer.deleted': {
        const customer = event.data.object as Stripe.Customer;
        const supabase = createAdminClient();
        const { data: copro } = await supabase
          .from('coproprietes')
          .select('id')
          .eq('stripe_customer_id', customer.id)
          .maybeSingle();
        if (!copro) break;

        await updateCoproSubscription(copro.id, {
          stripe_customer_id:     undefined,
          stripe_subscription_id: null,
          plan_id:                null,
          plan:                   'inactif',
          plan_period_end:        null,
        });
        // Effacer le stripe_customer_id (updateCoproSubscription ne le met pas à null)
        await supabase
          .from('coproprietes')
          .update({ stripe_customer_id: null })
          .eq('id', copro.id);
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
          .maybeSingle();
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
