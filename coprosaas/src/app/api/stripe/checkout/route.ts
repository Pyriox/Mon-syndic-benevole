// POST /api/stripe/checkout
// Crée une Checkout Session Stripe et retourne l'URL de paiement
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe, STRIPE_PRICES } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

    const { planId } = await req.json() as { planId: 'essentiel' | 'confort' | 'illimite' };
    const priceId = STRIPE_PRICES[planId];
    if (!priceId || priceId.startsWith('price_REMPLACER') || priceId === '') {
      return NextResponse.json({ error: 'Plan invalide ou Stripe non configuré.' }, { status: 400 });
    }

    const origin = req.headers.get('origin') ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.mon-syndic-benevole.fr';

    // Créer ou retrouver le customer Stripe
    let customerId: string | undefined;
    const existing = await stripe.customers.search({
      query: `metadata['supabase_user_id']:'${user.id}'`,
      limit: 1,
    });
    if (existing.data.length > 0) {
      customerId = existing.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        name: (user.user_metadata?.full_name as string | undefined) ?? user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card', 'sepa_debit'],
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: {
        supabase_user_id: user.id,
        plan_id: planId,
      },
      client_reference_id: user.id,
      success_url: `${origin}/abonnement?success=1`,
      cancel_url:  `${origin}/abonnement?canceled=1`,
      locale: 'fr',
      allow_promotion_codes: true,
      payment_method_options: {
        sepa_debit: {
          mandate_options: {},
        },
      },
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
          plan_id: planId,
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur interne';
    console.error('[stripe/checkout]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
