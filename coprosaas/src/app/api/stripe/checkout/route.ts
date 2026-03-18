// POST /api/stripe/checkout
// Crée une Checkout Session Stripe et retourne l'URL de paiement
// Un abonnement Stripe = une copropriété (pas un utilisateur)
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe, STRIPE_PRICES } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

    const { planId, coproprieteid } = await req.json() as {
      planId: 'essentiel' | 'confort' | 'illimite';
      coproprieteid: string;
    };

    if (!coproprieteid) {
      return NextResponse.json({ error: 'Copropriété manquante.' }, { status: 400 });
    }

    const priceId = STRIPE_PRICES[planId];
    if (!priceId || priceId.startsWith('price_REMPLACER') || priceId === '') {
      return NextResponse.json({ error: 'Plan invalide ou Stripe non configuré.' }, { status: 400 });
    }

    // Vérifier que la copropriété appartient bien à cet utilisateur
    const { data: copro, error: coproError } = await supabase
      .from('coproprietes')
      .select('id, nom, stripe_customer_id, stripe_subscription_id')
      .eq('id', coproprieteid)
      .eq('syndic_id', user.id)
      .single();

    if (!copro || coproError) {
      return NextResponse.json({ error: 'Copropriété introuvable.' }, { status: 404 });
    }

    // Vérifier qu'il n'y a pas déjà un abonnement actif pour cette copropriété
    if (copro.stripe_subscription_id) {
      return NextResponse.json({ error: 'Cette copropriété possède déjà un abonnement. Utilisez le portail pour le modifier.' }, { status: 409 });
    }

    const origin = req.headers.get('origin') ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.mon-syndic-benevole.fr';

    // Créer ou récupérer le customer Stripe propre à cette copropriété
    let customerId: string;
    if (copro.stripe_customer_id) {
      customerId = copro.stripe_customer_id;
    } else {
      // Chercher un customer Stripe déjà existant pour cette copropriété
      const existing = await stripe.customers.search({
        query: `metadata['copropriete_id']:'${coproprieteid}'`,
        limit: 1,
      });
      if (existing.data.length > 0) {
        customerId = existing.data[0].id;
      } else {
        const customer = await stripe.customers.create({
          email: user.email,
          name: copro.nom,
          metadata: {
            supabase_user_id: user.id,
            copropriete_id: coproprieteid,
          },
        });
        customerId = customer.id;
      }
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card', 'sepa_debit'],
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: {
        supabase_user_id: user.id,
        copropriete_id: coproprieteid,
        plan_id: planId,
      },
      client_reference_id: user.id,
      success_url: `${origin}/abonnement?success=1&coproId=${coproprieteid}`,
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
          copropriete_id: coproprieteid,
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
