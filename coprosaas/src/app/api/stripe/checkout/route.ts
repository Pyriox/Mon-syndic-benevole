// POST /api/stripe/checkout
// Crée une Checkout Session Stripe et retourne l'URL de paiement
// Un abonnement Stripe = une copropriété (pas un utilisateur)
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { stripe, STRIPE_PRICES } from '@/lib/stripe';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

    // Rate limiting : 10 tentatives de checkout par utilisateur par minute
    if (!await rateLimit(user.id, 10, 60_000)) {
      return NextResponse.json({ error: 'Trop de tentatives. Réessayez dans une minute.' }, { status: 429 });
    }

    const { planId, coproprieteid } = await req.json() as {
      planId: 'essentiel' | 'confort' | 'illimite';
      coproprieteid: string;
    };

    // Validation runtime du planId
    const VALID_PLANS = ['essentiel', 'confort', 'illimite'] as const;
    if (!planId || !VALID_PLANS.includes(planId as typeof VALID_PLANS[number])) {
      return NextResponse.json({ error: 'Plan invalide.' }, { status: 400 });
    }

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

    // Vérifier si l'utilisateur a déjà bénéficié d'un essai gratuit
    const adminForProfile = createAdminClient();
    const { data: profile } = await adminForProfile
      .from('profiles')
      .select('trial_used')
      .eq('id', user.id)
      .maybeSingle();
    const trialAlreadyUsed = profile?.trial_used === true;

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.mon-syndic-benevole.fr';

    // Créer ou récupérer le customer Stripe propre à cette copropriété
    let customerId: string;
    let needsPersist = !copro.stripe_customer_id;

    const createBrandNewCustomer = async () => {
      const customer = await stripe.customers.create({
        email: user.email,
        name: copro.nom,
        preferred_locales: ['fr'],
        metadata: { supabase_user_id: user.id, copropriete_id: coproprieteid },
      });
      return customer.id;
    };

    const createFreshCustomer = async () => {
      // Essaie de trouver un customer Stripe existant et vérifiable par métadonnée
      const searched = await stripe.customers.search({
        query: `metadata['copropriete_id']:'${coproprieteid}'`,
        limit: 5,
      });
      for (const candidate of searched.data) {
        if (candidate.deleted) continue;
        // Vérifier qu'il est bien récupérable dans l'environnement actuel
        try {
          const verified = await stripe.customers.retrieve(candidate.id);
          if (!(verified as { deleted?: boolean }).deleted) return verified.id;
        } catch { continue; }
      }
      return createBrandNewCustomer();
    };

    if (copro.stripe_customer_id) {
      // Vérifier que le customer existe toujours dans Stripe
      try {
        const existing = await stripe.customers.retrieve(copro.stripe_customer_id);
        if ((existing as { deleted?: boolean }).deleted) throw new Error('deleted');
        customerId = existing.id;
      } catch {
        // Customer supprimé ou introuvable → effacer de la DB et en recréer un propre
        needsPersist = true;
        customerId = await createBrandNewCustomer();
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
      // 'always' : exige la saisie d'un moyen de paiement même pendant l'essai gratuit (facture 0€)
      payment_method_collection: 'always',
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
      billing_address_collection: 'required',
      customer_update: {
        address: 'auto',
        name: 'auto',
      },
      allow_promotion_codes: true,
      payment_method_options: {
        sepa_debit: {
          mandate_options: {},
        },
      },
      subscription_data: {
        // Pas d'essai si l'utilisateur en a déjà bénéficié (anti-abus recréation de copropriété)
        ...(trialAlreadyUsed ? {} : { trial_period_days: 14 }),
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
