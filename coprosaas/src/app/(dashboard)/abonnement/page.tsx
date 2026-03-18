// ============================================================
// Page : Abonnement
// Architecture : 1 abonnement Stripe par copropriété
// 3 plans : Essentiel (10 lots), Confort (20 lots), Illimité
// ============================================================
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Card, { CardHeader } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import CheckoutButton from './CheckoutButton';
import { CheckCircle, Settings2 } from 'lucide-react';

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

type PlanId = typeof PLANS[number]['id'];
const PLAN_IDS = PLANS.map((p) => p.id) as PlanId[];

// ── Sync Stripe → coproprietes table pour une copropriété donnée ────────────────
async function doStripeSync(coproId: string): Promise<boolean> {
  const { getStripe } = await import('@/lib/stripe');
  const stripeClient = getStripe();
  const adminClient = createAdminClient();

  // Lire le stripe_customer_id depuis la DB (persisté lors du checkout)
  // On utilise l'admin client pour bypass le cache de session
  const { data: coproRow } = await adminClient
    .from('coproprietes')
    .select('stripe_customer_id')
    .eq('id', coproId)
    .single();

  let customerId: string | undefined = coproRow?.stripe_customer_id ?? undefined;

  // Fallback : chercher dans Stripe si pas encore en DB
  if (!customerId) {
    const existing = await stripeClient.customers.search({
      query: `metadata['copropriete_id']:'${coproId}'`,
      limit: 1,
    });
    if (existing.data.length === 0) return false;
    customerId = existing.data[0].id;
  }

  const subs = await stripeClient.subscriptions.list({
    customer: customerId,
    status: 'all' as 'active',
    limit: 5,
  });
  const validSub = subs.data
    .filter((s) => !['canceled', 'incomplete_expired'].includes(s.status))
    .sort((a, b) => b.created - a.created)[0];

  if (!validSub) return false;

  const plan =
    validSub.status === 'active'   ? 'actif'
    : validSub.status === 'trialing' ? 'essai'
    : validSub.status === 'past_due' ? 'passe_du'
    : 'actif';

  const sub = validSub as unknown as {
    id: string;
    current_period_end: number;
    metadata: Record<string, string>;
    items: { data: { price: { id: string } }[] };
  };

  await adminClient
    .from('coproprietes')
    .update({
      stripe_customer_id:     customerId,
      stripe_subscription_id: sub.id,
      plan,
      plan_id:  sub.metadata?.plan_id ?? sub.items.data[0]?.price.id,
      plan_period_end: new Date(sub.current_period_end * 1000).toISOString(),
    })
    .eq('id', coproId);

  return true;
}

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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // ── Sync immédiate depuis Stripe au retour du checkout ──────────────────
  if (success === '1' && synced !== '1' && coproId) {
    try { await doStripeSync(coproId); } catch { /* non bloquant */ }
    return redirect(`/abonnement?success=1&synced=1&coproId=${coproId}`);
  }

  // ── Récupérer toutes les copropriétés avec leurs données d'abonnement ───
  const { data: coproprietes } = await supabase
    .from('coproprietes')
    .select('id, nom, stripe_customer_id, stripe_subscription_id, plan, plan_id, plan_period_end')
    .eq('syndic_id', user.id)
    .order('nom');

  const coproIds = (coproprietes ?? []).map((c) => c.id);

  const { data: lotsData } = await supabase
    .from('lots')
    .select('copropriete_id')
    .in('copropriete_id', coproIds.length ? coproIds : ['none']);

  const lotCountByCopro: Record<string, number> = {};
  for (const lot of lotsData ?? []) {
    lotCountByCopro[lot.copropriete_id] = (lotCountByCopro[lot.copropriete_id] ?? 0) + 1;
  }

  // ── Actions serveur ─────────────────────────────────────────────────────
  async function resyncAction(formData: FormData) {
    'use server';
    const id = formData.get('coproId') as string | null;
    if (!id) return;
    try { await doStripeSync(id); } catch { /* non bloquant */ }
    redirect(`/abonnement?resynced=1`);
  }

  async function portalAction(formData: FormData) {
    'use server';
    const id = formData.get('coproId') as string | null;
    if (!id) return;
    const supa = await createClient();
    const { data: { user: u } } = await supa.auth.getUser();
    if (!u) return;
    const { data: copro } = await supa
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

  const syncedCopro = coproId ? (coproprietes ?? []).find((c) => c.id === coproId) : null;

  return (
    <div className="min-h-full flex flex-col items-center justify-start py-8 px-4">
      <div className="w-full max-w-4xl space-y-8">

        <div>
          <h2 className="text-2xl font-bold text-gray-900">Abonnement</h2>
          <p className="text-gray-500 mt-1">
            Chaque copropriété dispose de son propre abonnement, indépendant des autres.
          </p>
        </div>

        {(success === '1' || resynced === '1') && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 flex items-center gap-2">
            <CheckCircle size={15} />
            {syncedCopro
              ? `Abonnement activé pour « ${syncedCopro.nom} » !`
              : 'Abonnement activé avec succès.'}
          </div>
        )}
        {canceled === '1' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
            Paiement annulé. Votre abonnement n&apos;a pas été modifié.
          </div>
        )}

        {(coproprietes ?? []).length === 0 && (
          <Card>
            <p className="text-sm text-gray-400 italic py-4 text-center">
              Vous n&apos;avez encore aucune copropriété.{' '}
              <a href="/coproprietes/nouvelle" className="text-blue-600 hover:underline">
                Créez-en une
              </a>{' '}
              pour souscrire à un abonnement.
            </p>
          </Card>
        )}

        {(coproprietes ?? []).map((copro) => {
          const totalLots = lotCountByCopro[copro.id] ?? 0;
          const planActuel: string = (copro.plan as string | undefined) ?? 'essai';
          const hasStripeCustomer = !!copro.stripe_customer_id;
          const hasStripeSubscription = !!copro.stripe_subscription_id;
          const isSubscribed =
            planActuel === 'actif' ||
            (hasStripeSubscription && planActuel !== 'inactif');
          const currentPlanId = PLAN_IDS.find((p) => p === copro.plan_id);
          const recommendedPlan =
            totalLots <= 10 ? 'essentiel' : totalLots <= 20 ? 'confort' : 'illimite';

          return (
            <Card key={copro.id}>
              <CardHeader
                title={copro.nom}
                description={`${totalLots} lot${totalLots > 1 ? 's' : ''}`}
                actions={
                  <div className="flex items-center gap-3">
                    {planActuel === 'actif'
                      ? <Badge variant="success">Abonné</Badge>
                      : planActuel === 'passe_du'
                      ? <Badge variant="danger">Paiement en retard</Badge>
                      : planActuel === 'inactif'
                      ? <Badge variant="danger">Inactif</Badge>
                      : hasStripeSubscription
                      ? <Badge variant="info">En essai</Badge>
                      : <Badge variant="warning">Période d&apos;essai</Badge>
                    }
                  </div>
                }
              />

              {isSubscribed && (
                <div className="mt-4 space-y-3">
                  <div className="flex flex-wrap gap-5 text-sm">
                    {currentPlanId && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">Plan</span>
                        <span className="font-semibold text-gray-900 capitalize">{currentPlanId}</span>
                      </div>
                    )}
                    {copro.plan_period_end && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">
                          {planActuel === 'actif' ? 'Renouvellement le' : 'Fin le'}
                        </span>
                        <span className="font-semibold text-gray-900">
                          {new Date(copro.plan_period_end).toLocaleDateString('fr-FR', {
                            day: 'numeric', month: 'long', year: 'numeric',
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-gray-100">
                    {hasStripeCustomer && (
                      <form action={portalAction}>
                        <input type="hidden" name="coproId" value={copro.id} />
                        <button
                          type="submit"
                          className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                        >
                          <Settings2 size={14} />
                          Gérer l&apos;abonnement
                        </button>
                      </form>
                    )}
                    <form action={resyncAction}>
                      <input type="hidden" name="coproId" value={copro.id} />
                      <button type="submit" className="text-xs text-blue-600 hover:text-blue-800 hover:underline transition-colors">
                        Synchroniser le statut
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {!isSubscribed && (
                <div className="mt-5 space-y-4">
                  <p className="text-sm text-gray-500">Choisissez un plan pour cette copropriété :</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {PLANS.map((plan) => {
                      const isRecommended = plan.id === recommendedPlan;
                      const isPrimary = plan.highlight || isRecommended;
                      return (
                        <div
                          key={plan.id}
                          className={`relative rounded-2xl p-5 flex flex-col transition-all ${
                            isPrimary
                              ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-900/20'
                              : 'bg-white border border-gray-200'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1 mb-3">
                            <div>
                              <p className={`text-sm font-bold ${isPrimary ? 'text-white' : 'text-gray-900'}`}>{plan.name}</p>
                              <p className={`text-xs mt-0.5 ${isPrimary ? 'text-blue-200' : 'text-gray-400'}`}>{plan.desc}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1 shrink-0">
                              {plan.badge && (
                                <span className="bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                  {plan.badge}
                                </span>
                              )}
                              {isRecommended && (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isPrimary ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'}`}>
                                  Recommandé
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-end gap-1 mb-1">
                            <span className={`text-3xl font-extrabold ${isPrimary ? 'text-white' : 'text-gray-900'}`}>
                              {plan.monthly}&nbsp;€
                            </span>
                            <span className={`pb-0.5 text-sm ${isPrimary ? 'text-blue-200' : 'text-gray-400'}`}>/mois</span>
                          </div>
                          <p className={`text-xs mb-1 ${isPrimary ? 'text-blue-200' : 'text-gray-400'}`}>
                            soit{' '}
                            <span className={`font-semibold ${isPrimary ? 'text-white' : 'text-gray-700'}`}>
                              {plan.annual}&nbsp;€/an
                            </span>
                          </p>
                          <CheckoutButton
                            planId={plan.id}
                            coproprieteid={copro.id}
                            isSubscribed={false}
                            hasStripeCustomer={false}
                            isPrimary={isPrimary}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <form action={resyncAction}>
                    <input type="hidden" name="coproId" value={copro.id} />
                    <button type="submit" className="text-xs text-blue-600 hover:text-blue-800 hover:underline transition-colors">
                      Vous avez déjà souscrit ? Vérifier mon abonnement Stripe
                    </button>
                  </form>
                </div>
              )}
            </Card>
          );
        })}

        {(coproprietes ?? []).length > 0 && (
          <Card>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-5">
              Inclus dans tous les plans
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5">
              {FEATURES.map((f) => (
                <div key={f} className="flex items-center gap-2.5 text-sm">
                  <CheckCircle size={15} className="text-green-500 shrink-0" />
                  <span className="text-gray-700">{f}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        <p className="text-xs text-gray-400 text-center">
          Facturation annuelle. Sans engagement.{' '}
          Pour toute question :{' '}
          <a href="mailto:contact@mon-syndic-benevole.fr" className="underline hover:text-gray-600">
            contact@mon-syndic-benevole.fr
          </a>
        </p>
      </div>
    </div>
  );
}
