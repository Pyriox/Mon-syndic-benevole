// POST /api/stripe/portal
// Crée une session Stripe Billing Portal pour une copropriété donnée
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';
import Stripe from 'stripe';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { coproprieteid } = await req.json().catch(() => ({})) as { coproprieteid?: string };
  if (!coproprieteid) return NextResponse.json({ error: 'Copropriété manquante.' }, { status: 400 });

  // Lire le stripe_customer_id depuis la copropriété (vérification appartenance)
  const { data: copro, error } = await supabase
    .from('coproprietes')
    .select('stripe_customer_id')
    .eq('id', coproprieteid)
    .eq('syndic_id', user.id)
    .single();

  if (error || !copro?.stripe_customer_id) {
    return NextResponse.json({ error: 'Aucun abonnement Stripe trouvé pour cette copropriété.' }, { status: 404 });
  }

  const origin = req.headers.get('origin') ?? 'https://www.mon-syndic-benevole.fr';

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: copro.stripe_customer_id,
      return_url: `${origin}/abonnement`,
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    if (err instanceof Stripe.errors.StripeInvalidRequestError && err.code === 'resource_missing') {
      return NextResponse.json({ error: 'Le client Stripe associé à cette copropriété est introuvable. Veuillez contacter le support.' }, { status: 404 });
    }
    throw err;
  }
}
