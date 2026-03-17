// POST /api/stripe/portal
// Crée une session Stripe Billing Portal (gestion abonnement, factures, CB)
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const customerId = user.user_metadata?.stripe_customer_id as string | undefined;
  if (!customerId) return NextResponse.json({ error: 'Aucun abonnement Stripe trouvé.' }, { status: 404 });

  const origin = req.headers.get('origin') ?? 'https://www.mon-syndic-benevole.fr';
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${origin}/abonnement`,
  });

  return NextResponse.json({ url: session.url });
}
