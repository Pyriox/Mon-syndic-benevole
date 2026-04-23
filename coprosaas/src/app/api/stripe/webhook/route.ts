// POST /api/stripe/webhook
// Reçoit les événements Stripe et met à jour la table coproprietes en conséquence.
// UN abonnement Stripe = UNE copropriété.
import { NextRequest, NextResponse } from 'next/server';
import { extractStripeSubscriptionSnapshot, mapStripeSubscriptionStatus, stripe, type StripeSubscriptionSnapshot } from '@/lib/stripe';
import { syncCoproAddonsFromSnapshot } from '@/lib/stripe-addon-management';
import { createAdminClient } from '@/lib/supabase/admin';
import Stripe from 'stripe';
import { Resend } from 'resend';
import {
  buildTrialStartedEmail, buildTrialStartedSubject,
  buildSubscriptionCreatedEmail, buildSubscriptionCreatedSubject,
  buildTrialToPaidEmail, buildTrialToPaidSubject,
  buildRenewalEmail, buildRenewalSubject,
  buildPaymentFailedEmail, buildPaymentFailedSubject,
  buildCancelledEmail, buildCancelledSubject,
  type SubscriptionEmailParams,
} from '@/lib/emails/subscription';
import { trackResendSendResult } from '@/lib/email-delivery';
import { getCanonicalSiteUrl } from '@/lib/site-url';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = `Mon Syndic Bénévole <${process.env.EMAIL_FROM ?? 'noreply@mon-syndic-benevole.fr'}>`;
const SITE_URL = getCanonicalSiteUrl();

function getPlanLabel(planId: string | null | undefined): string {
  if (planId === 'illimite') return 'Illimité';
  if (planId === 'confort') return 'Confort';
  return 'Essentiel';
}

async function getSyndicInfoByCoproId(
  supabase: ReturnType<typeof createAdminClient>,
  coproId: string,
): Promise<{ email: string | null; prenom: string | null; coproNom: string | null; userId: string | null }> {
  const { data: copro } = await supabase
    .from('coproprietes')
    .select('syndic_id, nom')
    .eq('id', coproId)
    .maybeSingle();
  if (!copro?.syndic_id) return { email: null, prenom: null, coproNom: copro?.nom ?? null, userId: null };
  const { data: { user } } = await supabase.auth.admin.getUserById(copro.syndic_id);
  const prenom = (user?.user_metadata?.full_name as string | undefined)?.split(' ')[0] ?? null;
  return { email: user?.email ?? null, prenom, coproNom: copro.nom, userId: copro.syndic_id };
}

/** Enregistre un événement dans user_events (non bloquant). */
async function logUserEvent(
  adminClient: ReturnType<typeof createAdminClient>,
  email: string,
  event_type: string,
  label: string,
  userId?: string | null,
): Promise<void> {
  if (!email) return;
  await Promise.resolve(
    adminClient
      .from('user_events')
      .insert({ user_id: userId ?? null, user_email: email.toLowerCase(), event_type, label }),
  ).catch((e: Error) => console.warn('[logUserEvent]', e?.message));
}

async function sendStripeEmail(params: {
  to: string;
  subject: string;
  html: string;
  context: string;
  templateKey: string;
  coproprieteId?: string | null;
  recipientUserId?: string | null;
  legalEventType?: string | null;
  legalReference?: string | null;
  payload?: Record<string, unknown>;
}): Promise<void> {
  const result = await resend.emails.send({
    from: FROM,
    to: params.to,
    subject: params.subject,
    html: params.html,
  });

  const tracked = await trackResendSendResult(result, {
    templateKey: params.templateKey,
    recipientEmail: params.to,
    recipientUserId: params.recipientUserId ?? null,
    coproprieteId: params.coproprieteId ?? null,
    subject: params.subject,
    legalEventType: params.legalEventType ?? params.context,
    legalReference: params.legalReference ?? null,
    payload: params.payload ?? { context: params.context },
  });

  if (!tracked.ok) {
    throw new Error(`[${params.context}] ${tracked.errorMessage}`);
  }
}

// ⚠️ Ne pas parser le body en JSON — Stripe exige le raw body pour vérifier la signature.
export const runtime = 'nodejs';

type StripeWebhookStatus = 'processing' | 'processed' | 'failed';

async function reserveStripeWebhookEvent(event: Stripe.Event): Promise<'reserved' | 'duplicate'> {
  const supabase = createAdminClient();
  const { error } = await supabase.from('stripe_webhook_events').insert({
    stripe_event_id: event.id,
    event_type: event.type,
    status: 'processing' satisfies StripeWebhookStatus,
  });

  if (!error) return 'reserved';
  if (error.code === '23505') return 'duplicate';

  throw new Error(`[stripe_webhook_events] ${error.message}`);
}

async function markStripeWebhookEvent(
  eventId: string,
  status: StripeWebhookStatus,
  failureReason?: string,
): Promise<void> {
  const supabase = createAdminClient();
  const updates: Record<string, unknown> = {
    status,
    processed_at: new Date().toISOString(),
  };

  if (failureReason) {
    updates.failure_reason = failureReason.slice(0, 1000);
  }

  await supabase
    .from('stripe_webhook_events')
    .update(updates)
    .eq('stripe_event_id', eventId);
}

/** Met à jour les champs d'abonnement sur la table coproprietes. */
async function updateCoproSubscription(coproId: string, data: {
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  plan_id?: string | null;
  plan?: 'actif' | 'inactif' | 'passe_du' | 'essai' | 'resilie';
  plan_period_end?: string | null;
  plan_cancel_at_period_end?: boolean;
}) {
  const supabase = createAdminClient();
  const update: Record<string, unknown> = {
    stripe_subscription_id: data.stripe_subscription_id,
    plan_id:                data.plan_id,
    plan:                   data.plan ?? 'inactif',
    plan_period_end:        data.plan_period_end,
    plan_cancel_at_period_end: data.plan_cancel_at_period_end ?? false,
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

async function syncCoproAddons(coproId: string, snapshot: StripeSubscriptionSnapshot | null) {
  await syncCoproAddonsFromSnapshot(coproId, snapshot);
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
    const reservation = await reserveStripeWebhookEvent(event);
    if (reservation === 'duplicate') {
      return NextResponse.json({ received: true, duplicate: true });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur idempotence';
    console.error('[Stripe webhook] Erreur reserve event:', message);
    return NextResponse.json({ error: 'Erreur interne webhook.' }, { status: 500 });
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
        let subscriptionSnapshot: StripeSubscriptionSnapshot | null = null;
        if (session.subscription) {
          const sub = await stripe.subscriptions.retrieve(session.subscription as string);
          subscriptionSnapshot = extractStripeSubscriptionSnapshot(sub);
          subId = subscriptionSnapshot.subscriptionId ?? undefined;
          periodEnd = subscriptionSnapshot.currentPeriodEnd;
          subPlan = mapStripeSubscriptionStatus(subscriptionSnapshot.status) === 'essai' ? 'essai' : 'actif';
        }

        await updateCoproSubscription(coproId, {
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: subId,
          plan_id: subscriptionSnapshot?.planId ?? session.metadata?.plan_id ?? null,
          plan: subPlan,
          plan_period_end: periodEnd,
        });
        await syncCoproAddons(coproId, subscriptionSnapshot);

        // Marquer l'essai comme utilisé + envoyer email de confirmation
        const userId = session.metadata?.supabase_user_id;
        if (userId) {
          const adminClient = createAdminClient();
          await adminClient.from('profiles').update({ trial_used: true }).eq('id', userId);

          // Email de confirmation souscription
          try {
            const [{ data: coproData }, { data: { user: syndicUser } }] = await Promise.all([
              adminClient.from('coproprietes').select('nom').eq('id', coproId).maybeSingle(),
              adminClient.auth.admin.getUserById(userId),
            ]);
            const userEmail = syndicUser?.email;
            if (userEmail && coproData) {
              const prenom = (syndicUser?.user_metadata?.full_name as string | undefined)?.split(' ')[0] ?? null;
              const emailParams: SubscriptionEmailParams = {
                prenom,
                coproprieteNom: coproData.nom,
                planLabel: getPlanLabel(session.metadata?.plan_id),
                periodEnd,
                dashboardUrl: `${SITE_URL}/dashboard`,
              };
              const [subject, html] = subPlan === 'essai'
                ? [buildTrialStartedSubject(coproData.nom), buildTrialStartedEmail(emailParams)]
                : [buildSubscriptionCreatedSubject(coproData.nom), buildSubscriptionCreatedEmail(emailParams)];
              await sendStripeEmail({
                to: userEmail,
                subject,
                html,
                context: 'checkout.session.completed',
                templateKey: subPlan === 'essai' ? 'subscription_trial_started' : 'subscription_created',
                coproprieteId: coproId,
                recipientUserId: userId,
                legalEventType: subPlan === 'essai' ? 'trial_started' : 'subscription_created',
                legalReference: subId ?? coproId,
                payload: { planId: session.metadata?.plan_id ?? null, planState: subPlan },
              });
              await logUserEvent(
                adminClient,
                userEmail,
                subPlan === 'essai' ? 'trial_started' : 'subscription_created',
                subPlan === 'essai'
                  ? `Essai démarré — ${coproData.nom}`
                  : `Abonnement activé — ${coproData.nom} (${getPlanLabel(session.metadata?.plan_id)})`,
                userId,
              );
            }
          } catch (e) {
            console.error('[Stripe webhook] Erreur email checkout:', e);
          }
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
        const subscriptionSnapshot = extractStripeSubscriptionSnapshot(sub);
        const plan = mapStripeSubscriptionStatus(subStatus);
        const periodEnd = subscriptionSnapshot.currentPeriodEnd;

        await updateCoproSubscription(coproId, {
          stripe_customer_id: sub['customer'] as string,
          stripe_subscription_id: sub['id'] as string,
          plan_id: subscriptionSnapshot.planId ?? subMeta?.plan_id ?? null,
          plan: plan as 'actif' | 'inactif' | 'passe_du' | 'essai' | 'resilie',
          plan_period_end: periodEnd,
          plan_cancel_at_period_end: subscriptionSnapshot.cancelAtPeriodEnd,
        });
        await syncCoproAddons(coproId, subscriptionSnapshot);

        // Email : essai → payant ou renouvellement
        const prev = (event.data.previous_attributes ?? {}) as Record<string, unknown>;
        const isTrialToPaid = prev['status'] === 'trialing' && plan === 'actif';
        const isRenewal = prev['current_period_end'] !== undefined && plan === 'actif' && !isTrialToPaid;
        if (isTrialToPaid || isRenewal) {
          try {
            const adminClient = createAdminClient();
            const { email, prenom, coproNom } = await getSyndicInfoByCoproId(adminClient, coproId);
            if (email && coproNom) {
              const emailParams: SubscriptionEmailParams = {
                prenom,
                coproprieteNom: coproNom,
                planLabel: getPlanLabel(subMeta?.plan_id),
                periodEnd,
                dashboardUrl: `${SITE_URL}/dashboard`,
              };
              const [subject, html] = isTrialToPaid
                ? [buildTrialToPaidSubject(coproNom), buildTrialToPaidEmail(emailParams)]
                : [buildRenewalSubject(coproNom), buildRenewalEmail(emailParams)];
              await sendStripeEmail({
                to: email,
                subject,
                html,
                context: 'customer.subscription.updated',
                templateKey: isTrialToPaid ? 'subscription_trial_to_paid' : 'subscription_renewal',
                coproprieteId: coproId,
                legalEventType: isTrialToPaid ? 'subscription_trial_to_paid' : 'subscription_renewal',
                legalReference: sub['id'] as string,
                payload: { planId: subMeta?.plan_id ?? null, status: subStatus },
              });
            }
          } catch (e) {
            console.error('[Stripe webhook] Erreur email subscription update:', e);
          }
        }
        break;
      }

      // ── Abonnement résilié ────────────────────────────────────────────────
      // Stripe déclenche cet événement quand la période d'accès est terminée
      // (annulation immédiate ou en fin de période). On passe à 'resilie' pour
      // distinguer d'un compte qui n'a jamais souscrit ('inactif').
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
          stripe_customer_id: sub.customer as string,
          stripe_subscription_id: null,
          plan_id: null,
          plan: 'resilie',
          plan_period_end: null,
          plan_cancel_at_period_end: false,
        });
        await syncCoproAddons(coproId, null);

        // Email : abonnement résilié
        try {
          const adminClient = createAdminClient();
          const { email, prenom, coproNom, userId } = await getSyndicInfoByCoproId(adminClient, coproId);
          if (email && coproNom) {
            const emailParams: SubscriptionEmailParams = {
              prenom,
              coproprieteNom: coproNom,
              planLabel: getPlanLabel(sub.metadata?.plan_id),
              periodEnd: null,
              dashboardUrl: `${SITE_URL}/abonnement`,
            };
            await sendStripeEmail({
              to: email,
              subject: buildCancelledSubject(coproNom),
              html: buildCancelledEmail(emailParams),
              context: 'customer.subscription.deleted',
              templateKey: 'subscription_cancelled',
              coproprieteId: coproId,
              legalEventType: 'subscription_cancelled',
              legalReference: sub.id,
              payload: { planId: sub.metadata?.plan_id ?? null },
            });
            await logUserEvent(
              adminClient,
              email,
              'subscription_cancelled',
              `Abonnement résilié — ${coproNom}`,
              userId,
            );
          }
        } catch (e) {
          console.error('[Stripe webhook] Erreur email cancelled:', e);
        }
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
          stripe_customer_id: undefined,
          stripe_subscription_id: null,
          plan_id: null,
          plan: 'inactif',
          plan_period_end: null,
        });
        await syncCoproAddons(copro.id, null);
        // Effacer le stripe_customer_id (updateCoproSubscription ne le met pas à null)
        await supabase
          .from('coproprietes')
          .update({ stripe_customer_id: null })
          .eq('id', copro.id);
        break;
      }

      // ── Paiement échoué ───────────────────────────────────────────────────
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const supabase = createAdminClient();
        const { data: copro } = await supabase
          .from('coproprietes')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .maybeSingle();
        if (!copro) break;

        try {
          const adminClient = createAdminClient();
          const { email, coproNom, userId } = await getSyndicInfoByCoproId(adminClient, copro.id);
          if (email && coproNom) {
            await logUserEvent(adminClient, email, 'payment_succeeded', `Paiement réussi — ${coproNom}`, userId);
          }
        } catch (e) {
          console.error('[Stripe webhook] Erreur log payment_succeeded:', e);
        }
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

        // Email : paiement échoué
        try {
          const adminClient = createAdminClient();
          const { email, prenom, coproNom, userId } = await getSyndicInfoByCoproId(adminClient, copro.id);
          if (email && coproNom) {
            const emailParams: SubscriptionEmailParams = {
              prenom,
              coproprieteNom: coproNom,
              planLabel: getPlanLabel(null),
              periodEnd: null,
              dashboardUrl: `${SITE_URL}/abonnement`,
            };
            await sendStripeEmail({
              to: email,
              subject: buildPaymentFailedSubject(coproNom),
              html: buildPaymentFailedEmail(emailParams),
              context: 'invoice.payment_failed',
              templateKey: 'subscription_payment_failed',
              coproprieteId: copro.id,
              legalEventType: 'payment_failed',
              legalReference: invoice.id,
              payload: { customerId },
            });
            await logUserEvent(adminClient, email, 'payment_failed', `Paiement échoué — ${coproNom}`, userId);
          }
        } catch (e) {
          console.error('[Stripe webhook] Erreur email payment_failed:', e);
        }
        break;
      }
    }
    await markStripeWebhookEvent(event.id, 'processed');
    return NextResponse.json({ received: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Erreur traitement inconnue';
    console.error('[Stripe webhook] Erreur traitement:', e);

    try {
      await markStripeWebhookEvent(event.id, 'failed', message);
    } catch (markError) {
      console.error('[Stripe webhook] Erreur marquage failed:', markError);
    }

    return NextResponse.json({ error: 'Traitement webhook échoué.' }, { status: 500 });
  }
}
