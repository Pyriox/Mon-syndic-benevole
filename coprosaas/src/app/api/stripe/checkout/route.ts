// POST /api/stripe/checkout
// Crée une Checkout Session Stripe et retourne l'URL de paiement
// Un abonnement Stripe = une copropriété (pas un utilisateur)
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
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

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.mon-syndic-benevole.fr';

    // Créer ou récupérer le customer Stripe propre à cette copropriété
    let customerId: string;
    let needsPersist = !copro.stripe_customer_id;

    const createFreshCustomer = async () => {
      // Essaie d'abord de trouver un customer Stripe existant par métadonnée
      const existing = await stripe.customers.search({
        query: `metadata['copropriete_id']:'${coproprieteid}'`,
        limit: 1,
      });
      if (existing.data.length > 0) return existing.data[0].id;
      const customer = await stripe.customers.create({
        email: user.email,
        name: copro.nom,
        metadata: {
          supabase_user_id: user.id,
          copropriete_id: coproprieteid,
        },
      });
      return customer.id;
    };

    if (copro.stripe_customer_id) {
      // Vérifier que le customer existe toujours dans Stripe
      try {
        const existing = await stripe.customers.retrieve(copro.stripe_customer_id);
        if ((existing as { deleted?: boolean }).deleted) throw new Error('deleted');
        customerId = existing.id;
      } catch {
        // Customer supprimé ou introuvable → en recréer un
        customerId = await createFreshCustomer();
        needsPersist = true;
      }
    } else {
      customerId = await createFreshCustomer();
    }

    // Persister immédiatement le stripe_customer_id en base pour que doStripeSync
    // puisse le retrouver directement (sans passer par la recherche Stripe qui a un délai)
    if (needsPersist) {
      const adminClient = createAdminClient();
      await adminClient
        .from('coproprietes')
        .update({ stripe_customer_id: customerId })
        .eq('id', coproprieteid);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card', 'sepa_debit'],
      payment_method_collection: 'if_required',
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: {
        supabase_user_id: user.id,
        copropriete_id: coproprieteid,
        plan_id: planId,
      },
      client_reference_id: user.id,
      success_url: `${siteUrl}/abonnement?success=1&coproId=${coproprieteid}`,
      cancel_url:  `${siteUrl}/abonnement?canceled=1`,
      locale: 'fr',
      allow_promotion_codes: true,
      payment_method_options: {
        sepa_debit: {
          mandate_options: {},
        },
      },
      subscription_data: {
        trial_period_days: 30,
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
