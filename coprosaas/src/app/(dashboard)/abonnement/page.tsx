// ============================================================
// Page : Abonnement
// Architecture : 1 abonnement Stripe par copropriété
// ============================================================
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import CheckoutButton from './CheckoutButton';
import { AlertCircle, CheckCircle, Lock, RefreshCw, Settings2 } from 'lucide-react';

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
    monthly: 20,
    annual: 240,
    badge: 'Le plus populaire',
    highlight: true,
    maxLots: 10,
  },
  {
    id: 'confort',
    name: 'Confort',
    desc: '20 lots inclus',
    monthly: 30,
    annual: 360,
    badge: null,
    highlight: false,
    maxLots: 20,
  },
  {
    id: 'illimite',
    name: 'Illimité',
    desc: 'Lots illimités',
    monthly: 45,
    annual: 540,
    badge: null,
    highlight: false,
    maxLots: Infinity,
  },
] as const;

type PlanId = (typeof PLANS)[number]['id'];
const PLAN_IDS = PLANS.map((p) => p.id) as PlanId[];

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

  if (coproErr) console.error('[doStripeSync] Erreur lecture copropriété:', coproErr);

  let customerId: string | undefined = coproRow?.stripe_customer_id ?? undefined;
  let customerFoundViaStripe = false;

  // Fallback : chercher dans Stripe par métadonnée si absent de la DB
  if (!customerId) {
    console.log('[doStripeSync] stripe_customer_id absent de la DB — recherche Stripe...');
    const existing = await stripeClient.customers.search({
      query: `metadata['copropriete_id']:'${coproId}'`,
      limit: 1,
    });
    if (existing.data.length === 0) {
      console.log('[doStripeSync] Aucun customer Stripe trouvé pour coproId:', coproId);
      return false;
    }
    customerId = existing.data[0].id;
    customerFoundViaStripe = true;
    console.log('[doStripeSync] Customer trouvé via Stripe search:', customerId);
  }

  const subs = await stripeClient.subscriptions.list({
    customer: customerId,
    status: 'all' as 'active',
    limit: 5,
  });

  console.log('[doStripeSync] Abonnements trouvés:', subs.data.map((s) => ({ id: s.id, status: s.status })));

  const validSub = subs.data
    .filter((s) => !['canceled', 'incomplete_expired'].includes(s.status))
    .sort((a, b) => b.created - a.created)[0];

  if (!validSub) {
    console.log('[doStripeSync] Aucun abonnement valide trouvé.');
    return false;
  }

  console.log('[doStripeSync] Abonnement retenu:', validSub.id, 'status:', validSub.status);

  // trialing = abonnement payant en période d'essai → on affiche "actif"
  const plan =
    validSub.status === 'active'    ? 'actif'
    : validSub.status === 'trialing' ? 'actif'
    : validSub.status === 'past_due' ? 'passe_du'
    : 'actif';

  const sub = validSub as unknown as {
    id: string;
    current_period_end: number;
    metadata: Record<string, string>;
    items: { data: { price: { id: string } }[] };
  };

  const { error: updateErr } = await admin
    .from('coproprietes')
    .update({
      stripe_customer_id:     customerId,
      stripe_subscription_id: sub.id,
      plan,
      plan_id:         sub.metadata?.plan_id ?? sub.items.data[0]?.price.id,
      plan_period_end: new Date(sub.current_period_end * 1000).toISOString(),
    })
    .eq('id', coproId);

  if (updateErr) {
    console.error('[doStripeSync] Erreur UPDATE coproprietes:', updateErr);
    return false;
  }

  if (customerFoundViaStripe) {
    console.log('[doStripeSync] stripe_customer_id persisté en DB:', customerId);
  }

  console.log('[doStripeSync] Sync réussie. plan=', plan, 'sub=', sub.id);
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
    resynced?: string;
    coproId?: string;
  }>;
}) {
  const { success, canceled, synced, resynced, coproId } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Sync immédiate au retour du checkout Stripe
  if (success === '1' && synced !== '1' && coproId) {
    try { await doStripeSync(coproId); } catch { /* non bloquant */ }
    return redirect(`/abonnement?success=1&synced=1&coproId=${coproId}`);
  }

  // Lecture via adminClient pour avoir les données fraîches après sync
  const admin = createAdminClient();
  const { data: coproprietes } = await admin
    .from('coproprietes')
    .select('id, nom, stripe_customer_id, stripe_subscription_id, plan, plan_id, plan_period_end')
    .eq('syndic_id', user.id)
    .order('nom');

  const coproIds = (coproprietes ?? []).map((c) => c.id);
  const { data: lotsData } = await admin
    .from('lots')
    .select('copropriete_id')
    .in('copropriete_id', coproIds.length ? coproIds : ['none']);

  const lotCountByCopro: Record<string, number> = {};
  for (const lot of lotsData ?? []) {
    lotCountByCopro[lot.copropriete_id] = (lotCountByCopro[lot.copropriete_id] ?? 0) + 1;
  }

  // ── Actions serveur ───────────────────────────────────────────────────
  async function resyncAction(formData: FormData) {
    'use server';
    const id = formData.get('coproId') as string | null;
    if (!id) return;
    try { await doStripeSync(id); } catch { /* non bloquant */ }
    redirect('/abonnement?resynced=1');
  }

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
    if (!copro?.stripe_customer_id) redirect('/abonnement');
    const { getStripe } = await import('@/lib/stripe');
    const stripeClient = getStripe();
    const session = await stripeClient.billingPortal.sessions.create({
      customer: copro!.stripe_customer_id!,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.mon-syndic-benevole.fr'}/abonnement`,
    });
    redirect(session.url);
  }

  const syncedCopro = coproId
    ? (coproprietes ?? []).find((c) => c.id === coproId)
    : null;

  return (
    <div className="min-h-full py-8 px-4">
      <div className="w-full max-w-4xl mx-auto space-y-10">

        {/* ── En-tête */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Abonnement</h1>
          <p className="text-sm text-gray-500 mt-1">
            Chaque copropriété dispose de son propre abonnement, indépendant des autres.
          </p>
        </div>

        {/* ── Bannières */}
        {success === '1' && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-start gap-3">
            <CheckCircle size={16} className="text-green-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-800">
                {syncedCopro
                  ? `Abonnement activé pour « ${syncedCopro.nom} » !`
                  : 'Abonnement activé avec succès.'}
              </p>
              <p className="text-xs text-green-600 mt-0.5">
                Si le statut affiche encore « Période d&apos;essai », cliquez sur{' '}
                <strong>Synchroniser</strong> ci-dessous.
              </p>
            </div>
          </div>
        )}

        {resynced === '1' && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-center gap-3">
            <CheckCircle size={16} className="text-blue-600 shrink-0" />
            <p className="text-sm font-medium text-blue-800">Statut synchronisé avec Stripe.</p>
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

        {/* ── Aucune copropriété */}
        {(coproprietes ?? []).length === 0 && (
          <div className="text-center py-16 text-gray-400 text-sm">
            <p className="mb-2">Vous n&apos;avez encore aucune copropriété.</p>
            <a
              href="/coproprietes/nouvelle"
              className="text-blue-600 hover:underline font-medium"
            >
              Créer ma première copropriété
            </a>
          </div>
        )}

        {/* ── Section par copropriété */}
        {(coproprietes ?? []).map((copro) => {
          const totalLots = lotCountByCopro[copro.id] ?? 0;
          const planActuel: string = (copro.plan as string | undefined) ?? 'essai';
          const hasStripeCustomer = !!copro.stripe_customer_id;
          const hasStripeSubscription = !!copro.stripe_subscription_id;
          const isSubscribed =
            planActuel === 'actif' ||
            (hasStripeSubscription && planActuel !== 'inactif');
          const isPastDue = planActuel === 'passe_du';
          const currentPlanId = PLAN_IDS.find((p) => p === copro.plan_id);
          const recommendedPlan =
            totalLots <= 10 ? 'essentiel' : totalLots <= 20 ? 'confort' : 'illimite';

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
                {isSubscribed && !isPastDue && (
                  <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full shrink-0">
                    <CheckCircle size={11} /> Abonné
                  </span>
                )}
                {isPastDue && (
                  <span className="inline-flex items-center gap-1.5 bg-red-100 text-red-700 text-xs font-semibold px-3 py-1 rounded-full shrink-0">
                    <AlertCircle size={11} /> Paiement en retard
                  </span>
                )}
                {!isSubscribed && !isPastDue && (
                  <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-500 text-xs font-semibold px-3 py-1 rounded-full shrink-0">
                    Période d&apos;essai
                  </span>
                )}
              </div>

              {/* Carte de statut (si abonné ou paiement en retard) */}
              {(isSubscribed || isPastDue) && (
                <div
                  className={`rounded-2xl p-5 ${
                    isPastDue
                      ? 'bg-red-50 border border-red-200'
                      : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <p className={`text-xs font-semibold uppercase tracking-wide ${isPastDue ? 'text-red-500' : 'text-green-100'}`}>
                        {isPastDue ? 'Paiement en attente' : 'Abonnement actif'}
                      </p>
                      <div className="flex flex-wrap gap-x-6 gap-y-1 items-baseline">
                        {currentPlanId && (
                          <p className={`text-xl font-bold ${isPastDue ? 'text-red-900' : 'text-white'}`}>
                            Plan {PLANS.find((p) => p.id === currentPlanId)?.name ?? currentPlanId}
                          </p>
                        )}
                        {copro.plan_period_end && (
                          <p className={`text-sm ${isPastDue ? 'text-red-600' : 'text-green-100'}`}>
                            {planActuel === 'actif' ? 'Renouvellement le ' : 'Fin le '}
                            <span className={`font-semibold ${isPastDue ? 'text-red-800' : 'text-white'}`}>
                              {new Date(copro.plan_period_end).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              })}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 shrink-0">
                      {hasStripeCustomer && (
                        <form action={portalAction}>
                          <input type="hidden" name="coproId" value={copro.id} />
                          <button
                            type="submit"
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                              isPastDue
                                ? 'bg-red-600 text-white hover:bg-red-700'
                                : 'bg-white text-green-700 hover:bg-green-50'
                            }`}
                          >
                            <Settings2 size={14} />
                            Gérer l&apos;abonnement
                          </button>
                        </form>
                      )}
                      <form action={resyncAction}>
                        <input type="hidden" name="coproId" value={copro.id} />
                        <button
                          type="submit"
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                            isPastDue
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : 'bg-white/20 text-white hover:bg-white/30'
                          }`}
                        >
                          <RefreshCw size={12} />
                          Synchroniser
                        </button>
                      </form>
                    </div>
                  </div>
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
                          {plan.monthly}&nbsp;€
                        </span>
                        <span className={`pb-0.5 text-sm ${isCurrentPlan || (!isLocked && isPrimary) ? 'text-blue-200' : 'text-gray-400'}`}>
                          /mois
                        </span>
                      </div>
                      <p className={`text-xs mb-4 ${isCurrentPlan || (!isLocked && isPrimary) ? 'text-blue-200' : 'text-gray-400'}`}>
                        soit{' '}
                        <span className={`font-semibold ${isCurrentPlan || (!isLocked && isPrimary) ? 'text-white' : 'text-gray-700'}`}>
                          {plan.annual}&nbsp;€/an
                        </span>
                      </p>

                      {/* CTA */}
                      <div className="mt-auto">
                        {isCurrentPlan ? (
                          <div className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold bg-white/20 text-white cursor-default select-none">
                            <CheckCircle size={14} />
                            Plan actuel
                          </div>
                        ) : isLocked ? (
                          <p className="text-center text-xs text-gray-400 py-2.5">
                            Modifiable via le portail
                          </p>
                        ) : (
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

              {/* Lien sync pour les non-abonnés */}
              {!isSubscribed && !isPastDue && (
                <form action={resyncAction}>
                  <input type="hidden" name="coproId" value={copro.id} />
                  <button
                    type="submit"
                    className="text-xs text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                  >
                    Vous avez déjà souscrit ? Cliquer pour synchroniser votre statut depuis Stripe
                  </button>
                </form>
              )}

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
                  <CheckCircle size={15} className="text-green-500 shrink-0" />
                  {f}
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-gray-400 text-center pb-4">
          Facturation annuelle. Sans engagement.{' '}
          Pour toute question :{' '}
          <a
            href="mailto:contact@mon-syndic-benevole.fr"
            className="underline hover:text-gray-600"
          >
            contact@mon-syndic-benevole.fr
          </a>
        </p>
      </div>
    </div>
  );
}
