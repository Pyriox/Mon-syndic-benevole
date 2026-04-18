// ============================================================
// Page : Abonnement
// Architecture : 1 abonnement Stripe par copropriété
// ============================================================
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Abonnement' };

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireCoproAccess } from '@/lib/supabase/require-copro-access';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { extractStripeSubscriptionSnapshot, mapStripeSubscriptionStatus, STRIPE_ADDON_PRICES, stripe } from '@/lib/stripe';
import { syncCoproAddonsFromSnapshot } from '@/lib/stripe-addon-management';
import { hasChargesSpecialesAddon, type CoproAddon } from '@/lib/subscription';
import CheckoutButton from './CheckoutButton';
import SubscriptionSuccessTracker from './SubscriptionSuccessTracker';
import AddonBillingButton from './AddonBillingButton';
import { AlertCircle, CheckCircle, Clock, Lock, Settings2 } from 'lucide-react';

const FEATURES = [
  'Copropriétaires illimités',
  'Assemblées Générales & votes',
  'Appels de fonds & répartition automatique',
  'Dépenses & pièces jointes',
  'Convocations & PV par e-mail',
  'Documents & stockage',
  'Incidents & travaux',
  'Export PDF',
];

const PLANS = [
  {
    id: 'essentiel',
    name: 'Essentiel',
    desc: '10 lots inclus',
    annual: 360,
    monthlyLabel: '30 €',
    badge: 'Le plus populaire',
    highlight: true,
    maxLots: 10,
  },
  {
    id: 'confort',
    name: 'Confort',
    desc: '20 lots inclus',
    annual: 540,
    monthlyLabel: '45 €',
    badge: null,
    highlight: false,
    maxLots: 20,
  },
  {
    id: 'illimite',
    name: 'Illimité',
    desc: 'Lots illimités',
    annual: 960,
    monthlyLabel: '80 €',
    badge: null,
    highlight: false,
    maxLots: Infinity,
  },
] as const;

type PlanId = (typeof PLANS)[number]['id'];
type AddonPricingDetails = {
  headline: string;
  subline: string;
  note: string;
};

const PLAN_IDS = PLANS.map((p) => p.id) as PlanId[];

function formatMoney(amount: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatBillingDate(value?: string | null): string | null {
  if (!value) return null;

  try {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Europe/Paris',
    }).format(new Date(value));
  } catch {
    return null;
  }
}

async function getChargesSpecialesPricing(): Promise<AddonPricingDetails> {
  const fallback: AddonPricingDetails = {
    headline: 'Tarif affiché avant validation',
    subline: 'ajouté à l’abonnement principal',
    note: 'Le montant exact est rappelé au moment de la confirmation avant souscription.',
  };

  const priceId = STRIPE_ADDON_PRICES.charges_speciales;
  if (!priceId) return fallback;

  try {
    const price = await stripe.prices.retrieve(priceId);
    const unitAmount = typeof price.unit_amount === 'number' ? price.unit_amount / 100 : null;
    const currency = (price.currency ?? 'eur').toUpperCase();

    if (unitAmount === null) return fallback;

    if (price.recurring?.interval === 'year') {
      return {
        headline: `${formatMoney(unitAmount, currency)}/an`,
        subline: `soit ${formatMoney(unitAmount / 12, currency)}/mois`,
        note: 'Ajoutée à l’abonnement principal de la copropriété, avec prorata automatique sur la période restante.',
      };
    }

    if (price.recurring?.interval === 'month') {
      return {
        headline: `${formatMoney(unitAmount, currency)}/mois`,
        subline: `soit ${formatMoney(unitAmount * 12, currency)}/an`,
        note: 'Facturation mensuelle ajoutée à l’abonnement principal de la copropriété.',
      };
    }

    return {
      headline: formatMoney(unitAmount, currency),
      subline: 'facturation récurrente via Stripe',
      note: 'Ce montant sera ajouté à l’abonnement principal de la copropriété.',
    };
  } catch (error) {
    console.error('[abonnement] Impossible de récupérer le tarif de l’option Charges spéciales', error);
    return fallback;
  }
}

// ── Synchronise les données Stripe vers la table coproprietes ─────────────
async function doStripeSync(coproId: string): Promise<boolean> {
  const { getStripe } = await import('@/lib/stripe');
  const stripeClient = getStripe();
  const admin = createAdminClient();

  // Lire le stripe_customer_id depuis la DB (persisté lors du checkout)
  const { data: coproRow, error: coproErr } = await admin
    .from('coproprietes')
    .select('stripe_customer_id')
    .eq('id', coproId)
    .single();

  if (coproErr) console.error('[doStripeSync] Erreur lecture copropriété');

  let customerId: string | undefined = coproRow?.stripe_customer_id ?? undefined;
  let customerFoundViaStripe = false;

  // Fallback : chercher dans Stripe par métadonnée si absent de la DB
  if (!customerId) {
    const existing = await stripeClient.customers.search({
      query: `metadata['copropriete_id']:'${coproId}'`,
      limit: 1,
    });
    if (existing.data.length === 0) {
      return false;
    }
    customerId = existing.data[0].id;
    customerFoundViaStripe = true;
  }

  const subs = await stripeClient.subscriptions.list({
    customer: customerId,
    status: 'all' as 'active',
    limit: 5,
  });

  const validSub = subs.data
    .filter((s) => !['canceled', 'incomplete_expired'].includes(s.status))
    .sort((a, b) => b.created - a.created)[0];

  if (!validSub) {
    await syncCoproAddonsFromSnapshot(coproId, null);
    return false;
  }

  const subscriptionSnapshot = extractStripeSubscriptionSnapshot(validSub);
  const plan = mapStripeSubscriptionStatus(subscriptionSnapshot.status);

  const { error: updateErr } = await admin
    .from('coproprietes')
    .update({
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionSnapshot.subscriptionId,
      plan,
      plan_id: subscriptionSnapshot.planId,
      plan_period_end: subscriptionSnapshot.currentPeriodEnd,
    plan_cancel_at_period_end: subscriptionSnapshot.cancelAtPeriodEnd,
    })
    .eq('id', coproId);

  if (updateErr) {
    console.error('[doStripeSync] Erreur UPDATE coproprietes');
    return false;
  }

  await syncCoproAddonsFromSnapshot(coproId, subscriptionSnapshot);

  void customerFoundViaStripe; // stripe_customer_id persisté en DB si trouvé via Stripe search
  return true;
}

// ── Page principale ───────────────────────────────────────────────────────
export default async function AbonnementPage({
  searchParams,
}: {
  searchParams: Promise<{
    success?: string;
    canceled?: string;
    synced?: string;
    coproId?: string;
    error?: string;
    addon?: string;
  }>;
}) {
  const { success, canceled, synced, coproId, error: pageError, addon } = await searchParams;

  const { user, selectedCoproId, copro: selectedCopro } = await requireCoproAccess(['syndic']);

  // Sync immédiate au retour du checkout Stripe
  if (success === '1' && synced !== '1' && coproId) {
    try { await doStripeSync(coproId); } catch { /* non bloquant */ }
    return redirect(`/abonnement?success=1&synced=1&coproId=${coproId}`);
  }

  // Lecture via adminClient pour avoir les données fraîches après sync
  // On affiche uniquement la copropriété actuellement sélectionnée dans le dashboard.
  const admin = createAdminClient();
  let { data: selectedCopropriete } = await admin
    .from('coproprietes')
    .select('id, nom, stripe_customer_id, stripe_subscription_id, plan, plan_id, plan_period_end, plan_cancel_at_period_end')
    .eq('id', selectedCoproId)
    .eq('syndic_id', user.id)
    .maybeSingle();

  const nowIso = new Date().toISOString();
  const needsStripeRefresh = Boolean(
    selectedCopropriete?.stripe_customer_id
    && selectedCopropriete?.stripe_subscription_id
    && selectedCopropriete.plan
    && selectedCopropriete.plan !== 'inactif'
    && (!selectedCopropriete.plan_period_end || selectedCopropriete.plan_period_end <= nowIso)
  );

  if (selectedCopropriete?.id && needsStripeRefresh) {
    try {
      const synced = await doStripeSync(selectedCopropriete.id);
      if (synced) {
        const { data: refreshedCopropriete } = await admin
          .from('coproprietes')
          .select('id, nom, stripe_customer_id, stripe_subscription_id, plan, plan_id, plan_period_end, plan_cancel_at_period_end')
          .eq('id', selectedCopropriete.id)
          .eq('syndic_id', user.id)
          .maybeSingle();

        selectedCopropriete = refreshedCopropriete ?? selectedCopropriete;
      }
    } catch {
      // Non bloquant : on garde les données locales si Stripe n'est pas joignable.
    }
  }

  const coproprietes = selectedCopropriete ? [selectedCopropriete] : [];
  const currentCoproName = selectedCopropriete?.nom ?? selectedCopro?.nom ?? null;
  const coproIds = coproprietes.map((c) => c.id);
  const [{ data: lotsData }, { data: coproAddons }] = await Promise.all([
    admin
      .from('lots')
      .select('copropriete_id')
      .in('copropriete_id', coproIds.length ? coproIds : ['00000000-0000-0000-0000-000000000000']),
    admin
      .from('copro_addons')
      .select('copropriete_id, addon_key, status, current_period_end, cancel_at_period_end, stripe_price_id, stripe_subscription_item_id')
      .in('copropriete_id', coproIds.length ? coproIds : ['00000000-0000-0000-0000-000000000000']),
  ]);

  const lotCountByCopro: Record<string, number> = {};
  for (const lot of lotsData ?? []) {
    lotCountByCopro[lot.copropriete_id] = (lotCountByCopro[lot.copropriete_id] ?? 0) + 1;
  }

  const addonsByCopro: Record<string, CoproAddon[]> = {};
  for (const addon of coproAddons ?? []) {
    if (!addonsByCopro[addon.copropriete_id]) {
      addonsByCopro[addon.copropriete_id] = [];
    }
    addonsByCopro[addon.copropriete_id].push(addon);
  }

  // ── Actions serveur ───────────────────────────────────────────────────
  async function portalAction(formData: FormData) {
    'use server';
    const id = formData.get('coproId') as string | null;
    if (!id) return;
    const supa = await createClient();
    const {
      data: { user: u },
    } = await supa.auth.getUser();
    if (!u) return;
    const adminSupa = createAdminClient();
    const { data: copro } = await adminSupa
      .from('coproprietes')
      .select('stripe_customer_id')
      .eq('id', id)
      .eq('syndic_id', u.id)
      .single();
    if (!copro?.stripe_customer_id) redirect('/abonnement?error=no_customer');
    let portalUrl: string;
    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: copro!.stripe_customer_id!,
        return_url: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.mon-syndic-benevole.fr'}/abonnement`,
      });
      portalUrl = session.url;
    } catch (err: unknown) {
      // Si le customer Stripe n'existe plus → réinitialiser la DB et afficher le bon message
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.toLowerCase().includes('no such customer') || msg.toLowerCase().includes('customer')) {
        await adminSupa.from('coproprietes').update({
          stripe_customer_id: null,
          stripe_subscription_id: null,
          plan: 'inactif',
          plan_id: null,
          plan_period_end: null,
        }).eq('id', id).eq('syndic_id', u!.id);
        redirect('/abonnement?error=no_customer');
      }
      redirect('/abonnement?error=portal');
    }
    redirect(portalUrl!);
  }

  const syncedCopro = coproId
    ? (coproprietes ?? []).find((c) => c.id === coproId)
    : null;
  const chargesAddonPricing = await getChargesSpecialesPricing();

  return (
    <div className="min-h-full py-8 px-4">
      <div className="w-full max-w-5xl mx-auto space-y-10">

        {/* ── En-tête */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Abonnement</h1>
          <p className="text-sm text-gray-500 mt-1">
            {currentCoproName
              ? <>Vous consultez l’abonnement de <strong>{currentCoproName}</strong>. Utilisez le sélecteur de copropriété pour en changer.</>
              : 'Chaque copropriété dispose de son propre abonnement, indépendant des autres.'}
          </p>
        </div>

        {/* ── Bannières */}
        {success === '1' && (
          <SubscriptionSuccessTracker
            planId={syncedCopro?.plan_id ?? null}
            subscriptionId={syncedCopro?.stripe_subscription_id ?? null}
            coproNom={syncedCopro?.nom ?? null}
            amount={PLANS.find((p) => p.id === syncedCopro?.plan_id)?.annual ?? null}
          />
        )}
        {success === '1' && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-3">
            <CheckCircle size={16} className="text-green-600 shrink-0" />
            <p className="text-sm font-medium text-green-800">
              {syncedCopro
                ? `Abonnement activé pour « ${syncedCopro.nom} » !`
                : 'Abonnement activé avec succès.'}
            </p>
          </div>
        )}

        {canceled === '1' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
            <AlertCircle size={16} className="text-amber-600 shrink-0" />
            <p className="text-sm text-amber-700">
              Paiement annulé. Votre abonnement n&apos;a pas été modifié.
            </p>
          </div>
        )}

        {addon === 'enabled' && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-3">
            <CheckCircle size={16} className="text-green-600 shrink-0" />
            <p className="text-sm text-green-800">
              {syncedCopro
                ? `Option Charges spéciales activée pour « ${syncedCopro.nom} ».`
                : 'Option Charges spéciales activée avec succès.'}
            </p>
          </div>
        )}

        {addon === 'disabled' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
            <AlertCircle size={16} className="text-amber-600 shrink-0" />
            <p className="text-sm text-amber-800">
              {syncedCopro
                ? `La résiliation de l’option Charges spéciales est programmée pour « ${syncedCopro.nom} » à la prochaine échéance.`
                : 'La résiliation de l’option Charges spéciales est programmée à la prochaine échéance.'}
            </p>
          </div>
        )}

        {pageError === 'portal' && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-3">
            <AlertCircle size={16} className="text-red-500 shrink-0" />
            <p className="text-sm text-red-700">
              Impossible d&apos;ouvrir le portail Stripe. Vérifiez que le portail client est activé dans votre dashboard Stripe (Paramètres → Facturation → Portail client).
            </p>
          </div>
        )}

        {pageError === 'no_customer' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
            <AlertCircle size={16} className="text-amber-700 shrink-0" />
            <p className="text-sm text-amber-700">
              Votre abonnement Stripe n&apos;est plus actif (compte client supprimé ou inexistant). Vos données ont été réinitialisées — vous pouvez souscrire un nouvel abonnement ci-dessous.
            </p>
          </div>
        )}

        {/* ── Aucune copropriété */}
        {(coproprietes ?? []).length === 0 && (
          <div className="text-center py-16 text-gray-400 text-sm">
            <p className="mb-2">Vous n&apos;avez encore aucune copropriété.</p>
            <Link
              href="/coproprietes/nouvelle"
              className="text-blue-600 hover:underline font-medium"
            >
              Créer ma première copropriété
            </Link>
          </div>
        )}

        {/* ── Section par copropriété */}
        {(coproprietes ?? []).map((copro) => {
          const totalLots = lotCountByCopro[copro.id] ?? 0;
          const planActuel: string = (copro.plan as string | undefined) ?? '';
          const hasStripeCustomer = !!copro.stripe_customer_id;
          const hasStripeSubscription = !!copro.stripe_subscription_id;
          // 'essai' + stripe subscription = période d'essai 14j (CB enregistrée, paiement pas encore prélevé)
          const isTrial = planActuel === 'essai' && hasStripeSubscription;
          const isSubscribed =
            planActuel === 'actif' || isTrial;
          const isPastDue = planActuel === 'passe_du';
          const currentPlanId = PLAN_IDS.find((p) => p === copro.plan_id);
          const recommendedPlan =
            totalLots <= 10 ? 'essentiel' : totalLots <= 20 ? 'confort' : 'illimite';
          const coproAddonRows = addonsByCopro[copro.id] ?? [];
          const chargesSpecialesAddon = coproAddonRows.find((addon) => addon.addon_key === 'charges_speciales') ?? null;
          const hasChargesAddon = hasChargesSpecialesAddon(coproAddonRows);
          const renewalDateLabel = formatBillingDate(copro.plan_period_end);
          const cancelAtPeriodEnd = planActuel === 'actif' && !!(copro as { plan_cancel_at_period_end?: boolean | null }).plan_cancel_at_period_end;
          const addonPeriodEndLabel = formatBillingDate(chargesSpecialesAddon?.current_period_end ?? null);

          return (
            <section key={copro.id} className="space-y-5">

              {/* Titre de section */}
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{copro.nom}</h2>
                  <p className="text-sm text-gray-400">
                    {totalLots} lot{totalLots > 1 ? 's' : ''}
                  </p>
                </div>
                {planActuel === 'actif' && (
                  <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full shrink-0">
                    <CheckCircle size={11} /> Abonné
                  </span>
                )}
                {isTrial && (
                  <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full shrink-0">
                    <Clock size={11} /> Période d&apos;essai
                  </span>
                )}
                {isPastDue && (
                  <span className="inline-flex items-center gap-1.5 bg-red-100 text-red-700 text-xs font-semibold px-3 py-1 rounded-full shrink-0">
                    <AlertCircle size={11} /> Paiement en retard
                  </span>
                )}
                {!isSubscribed && !isPastDue && (
                  <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-500 text-xs font-semibold px-3 py-1 rounded-full shrink-0">
                    Accès limité
                  </span>
                )}
              </div>

              {/* Carte de statut (si abonné ou paiement en retard) */}
              {(isSubscribed || isPastDue) && (
                <div
                  className={`rounded-2xl p-5 ${
                    isPastDue
                      ? 'bg-red-50 border border-red-200'
                      : isTrial
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                      : cancelAtPeriodEnd
                      ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white'
                      : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <p className={`text-xs font-semibold uppercase tracking-wide ${
                        isPastDue ? 'text-red-500' : isTrial ? 'text-amber-100' : cancelAtPeriodEnd ? 'text-orange-100' : 'text-green-100'
                      }`}>
                        {isPastDue ? 'Paiement en attente' : isTrial ? 'Période d’essai' : cancelAtPeriodEnd ? 'Résiliation programmée' : 'Abonnement actif'}
                      </p>
                      <div className="flex flex-wrap gap-x-6 gap-y-1 items-baseline">
                        {currentPlanId && (
                          <p className={`text-xl font-bold ${isPastDue ? 'text-red-900' : 'text-white'}`}>
                            Plan {PLANS.find((p) => p.id === currentPlanId)?.name ?? currentPlanId}
                          </p>
                        )}
                        {renewalDateLabel && (
                          <p className={`text-sm ${
                            isPastDue ? 'text-red-600' : isTrial ? 'text-amber-100' : cancelAtPeriodEnd ? 'text-orange-100' : 'text-green-100'
                          }`}>
                            {isPastDue
                              ? 'Fin le '
                              : isTrial
                              ? 'Fin de l’essai le '
                              : cancelAtPeriodEnd
                              ? 'Fin d’abonnement le '
                              : 'Renouvellement le '}
                            <span className={`font-semibold ${isPastDue ? 'text-red-800' : 'text-white'}`}>
                              {renewalDateLabel}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                    {hasStripeCustomer && !isPastDue && (
                      <form action={portalAction} className="shrink-0">
                        <input type="hidden" name="coproId" value={copro.id} />
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1.5 bg-white text-orange-600 hover:bg-orange-50 text-xs font-semibold px-3 py-2 rounded-lg transition-colors whitespace-nowrap shadow-sm"
                        >
                          <Settings2 size={13} />
                          Gérer &amp; factures
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              )}

              {/* Bandeau non-renouvellement */}
              {cancelAtPeriodEnd && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <AlertCircle size={16} className="text-orange-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-orange-800">
                      Le renouvellement automatique est <strong>désactivé</strong>. Votre abonnement expirera définitivement le{' '}
                      <strong>{renewalDateLabel}</strong> et ne sera pas reconduit.
                    </p>
                  </div>
                  <form action={portalAction} className="shrink-0">
                    <input type="hidden" name="coproId" value={copro.id} />
                    <button
                      type="submit"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold transition-colors"
                    >
                      Réactiver le renouvellement
                    </button>
                  </form>
                </div>
              )}

              {/* Grille des plans */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {PLANS.map((plan) => {
                  const isCurrentPlan = currentPlanId === plan.id;
                  const isLocked = (isSubscribed || isPastDue) && !isCurrentPlan;
                  const isRecommended = !isSubscribed && !isPastDue && plan.id === recommendedPlan;
                  const isPrimary = plan.highlight || isRecommended;

                  return (
                    <div
                      key={plan.id}
                      className={`relative rounded-2xl p-5 flex flex-col transition-all ${
                        isCurrentPlan
                          ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-900/20 ring-2 ring-offset-1 ring-blue-500'
                          : isLocked
                          ? 'bg-gray-50 border border-gray-100 opacity-55 cursor-not-allowed'
                          : isPrimary
                          ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-900/20'
                          : 'bg-white border border-gray-200 hover:border-blue-200 hover:shadow-sm'
                      }`}
                    >
                      {/* Badges en-tête */}
                      <div className="flex items-start justify-between gap-1 mb-3">
                        <div>
                          <p className={`text-sm font-bold ${isCurrentPlan || (!isLocked && isPrimary) ? 'text-white' : 'text-gray-900'}`}>
                            {plan.name}
                          </p>
                          <p className={`text-xs mt-0.5 ${isCurrentPlan || (!isLocked && isPrimary) ? 'text-blue-200' : 'text-gray-400'}`}>
                            {plan.desc}
                          </p>
                        </div>
                        <div className="shrink-0">
                          {isCurrentPlan && (
                            <span className="flex items-center gap-1 bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                              <CheckCircle size={10} /> Actuel
                            </span>
                          )}
                          {isLocked && (
                            <Lock size={13} className="text-gray-400 mt-0.5" />
                          )}
                          {!isLocked && !isCurrentPlan && plan.badge && (
                            <span className="bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              {plan.badge}
                            </span>
                          )}
                          {!isLocked && !isCurrentPlan && !plan.badge && isRecommended && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isPrimary ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'}`}>
                              Recommandé
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Prix */}
                      <div className="flex items-end gap-1 mb-0.5">
                        <span className={`text-3xl font-extrabold ${isCurrentPlan || (!isLocked && isPrimary) ? 'text-white' : 'text-gray-900'}`}>
                          {plan.annual}&nbsp;€
                        </span>
                        <span className={`pb-0.5 text-sm ${isCurrentPlan || (!isLocked && isPrimary) ? 'text-blue-200' : 'text-gray-400'}`}>
                          /an
                        </span>
                      </div>
                      <p className={`text-xs mb-4 ${isCurrentPlan || (!isLocked && isPrimary) ? 'text-blue-200' : 'text-gray-400'}`}>
                        soit{' '}
                        <span className={`font-semibold ${isCurrentPlan || (!isLocked && isPrimary) ? 'text-white' : 'text-gray-700'}`}>
                          {plan.monthlyLabel}/mois
                        </span>
                      </p>

                      {/* CTA */}
                      <div className="mt-auto">
                        {isCurrentPlan ? (
                          <div className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold bg-white/20 text-white cursor-default select-none">
                            <CheckCircle size={14} />
                            Plan actuel
                          </div>
                        ) : isLocked ? null : (
                          <CheckoutButton
                            planId={plan.id}
                            coproprieteid={copro.id}
                            isPrimary={isPrimary}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-gray-900">Option Charges spéciales</h3>
                      {hasChargesAddon ? (
                        chargesSpecialesAddon?.cancel_at_period_end ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                            <Clock size={11} /> Arrêt programmé
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                            <CheckCircle size={11} /> Active
                          </span>
                        )
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                          <Lock size={11} /> Non activée
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      Débloque les répartitions par bâtiment, ascenseur, parking ou toute autre clé spéciale de votre copropriété.
                    </p>
                    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Tarif de l’option</p>
                      <p className="mt-1 text-2xl font-bold text-slate-900">{chargesAddonPricing.headline}</p>
                      <p className="text-xs text-slate-600">{chargesAddonPricing.subline}</p>
                      <p className="mt-1 text-xs text-slate-500">{chargesAddonPricing.note}</p>
                    </div>
                    <ul className="space-y-1 text-xs text-gray-500">
                      <li>• Paramétrage des clés spéciales dans <strong>Paramétrage</strong></li>
                      <li>• Dépenses, budgets d&apos;AG et appels de fonds ciblés</li>
                      <li>• Activation à tout moment avec prorata automatique</li>
                    </ul>
                    {chargesSpecialesAddon?.cancel_at_period_end && addonPeriodEndLabel && (
                      <p className="text-xs text-amber-700">
                        Résiliation programmée à l&apos;échéance du{' '}
                        <span className="font-semibold">{addonPeriodEndLabel}</span>
                        .
                      </p>
                    )}
                  </div>

                  <div className="lg:w-72">
                    {isSubscribed || isPastDue ? (
                      hasStripeCustomer ? (
                        cancelAtPeriodEnd && hasChargesAddon ? (
                          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                            L&apos;option s&apos;arrêtera automatiquement avec l&apos;abonnement principal
                            {renewalDateLabel ? <> le <span className="font-semibold">{renewalDateLabel}</span></> : null}.
                            Pour la maintenir, réactivez d&apos;abord le renouvellement de l&apos;abonnement principal via le bouton Gérer ci-dessus.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            <AddonBillingButton
                              coproprieteid={copro.id}
                              coproName={copro.nom}
                              enabled={hasChargesAddon}
                              scheduledForCancellation={Boolean(chargesSpecialesAddon?.cancel_at_period_end)}
                              priceHeadline={chargesAddonPricing.headline}
                              priceSubline={chargesAddonPricing.subline}
                              priceNote={chargesAddonPricing.note}
                              currentPeriodEnd={chargesSpecialesAddon?.current_period_end ?? copro.plan_period_end ?? null}
                            />
                            <p className="text-xs text-gray-500">
                              Un récapitulatif du tarif et des conséquences de votre choix s&apos;affiche avant validation. Le portail ci-dessus reste disponible pour vos factures et moyens de paiement.
                            </p>
                          </div>
                        )
                      ) : (
                        <p className="text-xs text-gray-500">Le compte Stripe sera disponible juste après l&apos;activation de l&apos;abonnement principal.</p>
                      )
                    ) : (
                      <p className="text-xs text-gray-500">Activez d&apos;abord un abonnement principal pour ajouter cette option à la copropriété.</p>
                    )}
                  </div>
                </div>
              </div>

<hr className="border-gray-100" />
            </section>
          );
        })}

        {/* ── Fonctionnalités incluses */}
        {(coproprietes ?? []).length > 0 && (
          <div className="bg-gray-50 rounded-2xl p-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-5">
              Inclus dans tous les plans
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
              {FEATURES.map((f) => (
                <div key={f} className="flex items-center gap-2.5 text-sm text-gray-700">
                  <CheckCircle size={15} className="text-green-600 shrink-0" />
                  {f}
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-gray-500 text-center pb-4">
          Facturation annuelle. Sans engagement.{' '}
          Pour toute question :{' '}
          <Link
            href="/aide"
            className="underline hover:text-gray-600"
          >
            contactez-nous
          </Link>
        </p>
      </div>
    </div>
  );
}
