// ============================================================
// Page : Abonnement
// 3 plans : Essentiel (10 lots), Confort (20 lots), Illimité
// Facturation annuelle
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
  },
  {
    id: 'confort',
    name: 'Confort',
    desc: '20 lots inclus',
    monthly: 30,
    annual: 360,
    badge: null,
    highlight: false,
  },
  {
    id: 'illimite',
    name: 'Illimité',
    desc: 'Lots illimités',
    monthly: 45,
    annual: 540,
    badge: null,
    highlight: false,
  },
] as const;

// Helpers de sync Stripe (réutilisable depuis la page et l'action)
async function doStripeSync(userId: string, existingMeta: Record<string, unknown>) {
  const { getStripe } = await import('@/lib/stripe');
  const stripeClient = getStripe();
  const existing = await stripeClient.customers.search({
    query: `metadata['supabase_user_id']:'${userId}'`,
    limit: 1,
  });
  if (existing.data.length === 0) return false;

  const customer = existing.data[0];
  // Cherche tous les abonnements non expirés (pas seulement active)
  const subs = await stripeClient.subscriptions.list({
    customer: customer.id,
    status: 'all' as 'active',   // cast : l'API Stripe accepte 'all'
    limit: 5,
  });
  const validSub = subs.data
    .filter(s => !['canceled', 'incomplete_expired'].includes(s.status))
    .sort((a, b) => b.created - a.created)[0];

  if (!validSub) return false;

  const planStatus =
    validSub.status === 'active' || validSub.status === 'incomplete' ? 'actif'
    : validSub.status === 'trialing' ? 'essai'
    : validSub.status === 'past_due'  ? 'passe_du'
    : 'actif';

  const sub = validSub as unknown as {
    id: string;
    current_period_end: number;
    metadata: Record<string, string>;
    items: { data: { price: { id: string } }[] };
  };

  const adminClient = createAdminClient();
  await adminClient.auth.admin.updateUserById(userId, {
    user_metadata: {
      ...existingMeta,
      plan:                   planStatus,
      plan_status:            planStatus,
      stripe_customer_id:     customer.id,
      stripe_subscription_id: sub.id,
      plan_id:                sub.metadata?.plan_id ?? sub.items.data[0]?.price.id,
      plan_period_end:        new Date(sub.current_period_end * 1000).toISOString(),
    },
  });
  return true;
}

export default async function AbonnementPage({ searchParams }: { searchParams: Promise<{ success?: string; canceled?: string; synced?: string; resynced?: string }> }) {
  const { success, canceled, synced, resynced } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // ── Sync immédiate depuis Stripe au retour du checkout ──────────────
  if (success === '1' && synced !== '1') {
    try { await doStripeSync(user.id, user.user_metadata ?? {}); } catch { /* non bloquant */ }
    return redirect(`/abonnement?success=1&synced=1`);
  }

  // ── Action serveur : resync manuel ────────────────────────────────
  async function resyncAction() {
    'use server';
    const supa = await createClient();
    const { data: { user: u } } = await supa.auth.getUser();
    if (!u) return;
    try { await doStripeSync(u.id, u.user_metadata ?? {}); } catch { /* non bloquant */ }
    redirect('/abonnement?resynced=1');
  }

  // ── Action serveur : portail Stripe ──────────────────────────────
  async function portalAction() {
    'use server';
    const supa = await createClient();
    const { data: { user: u } } = await supa.auth.getUser();
    if (!u) return;
    const { getStripe } = await import('@/lib/stripe');
    const stripeClient = getStripe();
    const customerId = u.user_metadata?.stripe_customer_id as string | undefined;
    if (!customerId) { redirect('/abonnement'); return; }
    const session = await stripeClient.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.mon-syndic-benevole.fr'}/abonnement`,
    });
    redirect(session.url);
  }

  // Recharger les métadonnées DIRECTEMENT depuis Supabase DB (bypass JWT cache)
  // La session JWT ne se met à jour qu'après un refresh côté client ;
  // l'admin client lit toujours la valeur persistée en base.
  const adminClient = createAdminClient();
  const { data: adminUserData } = await adminClient.auth.admin.getUserById(user.id);
  const meta = adminUserData?.user?.user_metadata ?? user.user_metadata ?? {};

  const [
    { count: nbrCopros },
    { data: lotsData },
  ] = await Promise.all([
    supabase.from('coproprietes').select('id', { count: 'exact', head: true }).eq('syndic_id', user.id),
    supabase.from('lots').select('copropriete_id, coproprietes!inner(syndic_id)').eq('coproprietes.syndic_id', user.id),
  ]);

  const totalLots = lotsData?.length ?? 0;
  const planActuel: string = (meta?.plan as string | undefined) ?? 'essai';
  const hasStripeCustomer = !!meta?.stripe_customer_id;
  const hasStripeSubscription = !!meta?.stripe_subscription_id;
  // Considéré abonné si plan actif, OU si une subscription Stripe existe (trialing, past_due…)
  const isSubscribed = planActuel === 'actif' || (hasStripeSubscription && planActuel !== 'inactif');
  const planPeriodEnd = meta?.plan_period_end as string | undefined;
  const planId = meta?.plan_id as string | undefined;

  // Plan souscrit parmi nos 3 identifiants connus
  const PLAN_IDS = ['essentiel', 'confort', 'illimite'] as const;
  type PlanId = typeof PLAN_IDS[number];
  const currentPlanId: PlanId | undefined = PLAN_IDS.find(p => p === planId);

  // Plan recommandé selon le nombre de lots total
  const recommendedPlan = totalLots <= 10 ? 'essentiel' : totalLots <= 20 ? 'confort' : 'illimite';

  return (
    <div className="min-h-full flex flex-col items-center justify-start py-8 px-4">
      <div className="w-full max-w-4xl space-y-8">

        <div>
          <h2 className="text-2xl font-bold text-gray-900">Abonnement</h2>
          <p className="text-gray-500 mt-1">Un abonnement par copropriété — choisissez le plan adapté à votre nombre de lots.</p>
        </div>

        {(success === '1' || resynced === '1') && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 flex items-center gap-2">
            <CheckCircle size={15} />
            Abonnement activé avec succès. Bienvenue !
          </div>
        )}
        {canceled === '1' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
            Paiement annulé. Votre abonnement n&apos;a pas été modifié.
          </div>
        )}

        <Card>
          <CardHeader title="Votre compte" description="État de votre abonnement actuel" />
          <div className="mt-4 flex flex-wrap items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Statut</span>
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
            {isSubscribed && currentPlanId && (
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Plan</span>
                <span className="font-semibold text-gray-900 capitalize">{currentPlanId}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Copropriétés</span>
              <span className="font-semibold text-gray-900">{nbrCopros ?? 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Lots total</span>
              <span className="font-semibold text-gray-900">{totalLots}</span>
            </div>
            {planPeriodEnd && (
              <div className="flex items-center gap-2">
                <span className="text-gray-500">{isSubscribed ? 'Renouvellement le' : 'Fin le'}</span>
                <span className="font-semibold text-gray-900">
                  {new Date(planPeriodEnd).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
            )}
          </div>
          <div className="mt-5 pt-4 border-t border-gray-100 flex flex-wrap items-center gap-4">
            {isSubscribed && hasStripeCustomer && (
              <form action={portalAction}>
                <button type="submit" className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
                  <Settings2 size={14} />
                  Gérer l&apos;abonnement
                </button>
              </form>
            )}
            <form action={resyncAction}>
              <button
                type="submit"
                className="text-xs text-blue-600 hover:text-blue-800 hover:underline transition-colors"
              >
                {isSubscribed ? 'Synchroniser le statut' : 'Vous avez déjà souscrit ? Vérifier mon abonnement Stripe'}
              </button>
            </form>
          </div>
        </Card>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch mb-6">
          {PLANS.map((plan) => {
            const isCurrentPlan = isSubscribed && plan.id === currentPlanId;
            const isOtherPlan   = isSubscribed && !isCurrentPlan;
            const isRecommended = !isSubscribed && plan.id === recommendedPlan;
            const isPrimary = !isSubscribed && (plan.highlight || isRecommended);
            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl p-6 flex flex-col transition-all ${
                  isCurrentPlan
                    ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-xl shadow-green-900/20 ring-2 ring-green-400'
                    : isOtherPlan
                    ? 'bg-white border border-gray-200 shadow-sm opacity-50'
                    : isPrimary
                    ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl shadow-blue-900/20'
                    : 'bg-white border border-gray-200 shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-2 min-h-[24px]">
                  <div>
                    <p className={`text-sm font-bold ${isCurrentPlan || isPrimary ? 'text-white' : 'text-gray-900'}`}>{plan.name}</p>
                    <p className={`text-xs mt-0.5 ${isCurrentPlan ? 'text-green-100' : isPrimary ? 'text-blue-200' : 'text-gray-400'}`}>{plan.desc}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {isCurrentPlan && (
                      <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle size={10} /> Plan actuel
                      </span>
                    )}
                    {!isSubscribed && plan.badge && (
                      <span className="bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded-full">{plan.badge}</span>
                    )}
                    {isRecommended && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isPrimary ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'}`}>
                        Recommandé
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex items-end gap-1">
                    <span className={`text-4xl font-extrabold ${isCurrentPlan || isPrimary ? 'text-white' : 'text-gray-900'}`}>{plan.monthly}&nbsp;€</span>
                    <span className={`pb-1 text-sm ${isCurrentPlan ? 'text-green-100' : isPrimary ? 'text-blue-200' : 'text-gray-400'}`}>/mois</span>
                  </div>
                  <p className={`text-xs mt-1 ${isCurrentPlan ? 'text-green-100' : isPrimary ? 'text-blue-200' : 'text-gray-400'}`}>
                    soit{' '}
                    <span className={`font-semibold ${isCurrentPlan || isPrimary ? 'text-white' : 'text-gray-700'}`}>{plan.annual}&nbsp;€/an</span>
                  </p>
                </div>
                <CheckoutButton
                  planId={plan.id}
                  isSubscribed={isSubscribed}
                  hasStripeCustomer={hasStripeCustomer}
                  isPrimary={isPrimary}
                  isCurrentPlan={isCurrentPlan}
                />
              </div>
            );
          })}
        </div>

        {/* Fonctionnalités incluses dans tous les plans */}
        <Card>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-5">Inclus dans tous les plans</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5">
            {FEATURES.map((f) => (
              <div key={f} className="flex items-center gap-2.5 text-sm">
                <CheckCircle size={15} className="text-green-500 shrink-0" />
                <span className="text-gray-700">{f}</span>
              </div>
            ))}
          </div>
        </Card>

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
