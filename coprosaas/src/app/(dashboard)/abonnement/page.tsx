// ============================================================
// Page : Abonnement
// 3 plans : Essentiel (10 lots), Confort (20 lots), Illimité
// Facturation annuelle
// ============================================================
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Card, { CardHeader } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import CheckoutButton from './CheckoutButton';
import { CheckCircle } from 'lucide-react';

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

export default async function AbonnementPage({ searchParams }: { searchParams: Promise<{ success?: string; canceled?: string }> }) {
  const { success, canceled } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [
    { count: nbrCopros },
    { data: lotsData },
  ] = await Promise.all([
    supabase.from('coproprietes').select('id', { count: 'exact', head: true }).eq('syndic_id', user.id),
    supabase.from('lots').select('copropriete_id, coproprietes!inner(syndic_id)').eq('coproprietes.syndic_id', user.id),
  ]);

  const totalLots = lotsData?.length ?? 0;
  const planActuel: string = (user.user_metadata?.plan as string | undefined) ?? 'essai';
  const isSubscribed = planActuel === 'actif';
  const hasStripeCustomer = !!user.user_metadata?.stripe_customer_id;
  const planPeriodEnd = user.user_metadata?.plan_period_end as string | undefined;

  // Plan recommandé selon le nombre de lots total
  const recommendedPlan = totalLots <= 10 ? 'essentiel' : totalLots <= 20 ? 'confort' : 'illimite';

  return (
    <div className="min-h-full flex flex-col items-center justify-start py-8 px-4">
      <div className="w-full max-w-4xl space-y-8">

        <div>
          <h2 className="text-2xl font-bold text-gray-900">Abonnement</h2>
          <p className="text-gray-500 mt-1">Un abonnement par copropriété — choisissez le plan adapté à votre nombre de lots.</p>
        </div>

        {success === '1' && (
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
              {isSubscribed
                ? <Badge variant="success">Abonné</Badge>
                : <Badge variant="warning">Période d&apos;essai</Badge>
              }
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Copropriétés</span>
              <span className="font-semibold text-gray-900">{nbrCopros ?? 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Lots total</span>
              <span className="font-semibold text-gray-900">{totalLots}</span>
            </div>
            {isSubscribed && planPeriodEnd && (
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Prochain renouvellement</span>
                <span className="font-semibold text-gray-900">
                  {new Date(planPeriodEnd).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
            )}
          </div>
        </Card>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch mb-6">
          {PLANS.map((plan) => {
            const isRecommended = plan.id === recommendedPlan;
            const isPrimary = plan.highlight || isRecommended;
            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl p-6 flex flex-col ${
                  isPrimary
                    ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl shadow-blue-900/20'
                    : 'bg-white border border-gray-200 shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-2 min-h-[24px]">
                  <div>
                    <p className={`text-sm font-bold ${isPrimary ? 'text-white' : 'text-gray-900'}`}>{plan.name}</p>
                    <p className={`text-xs mt-0.5 ${isPrimary ? 'text-blue-200' : 'text-gray-400'}`}>{plan.desc}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {plan.badge && (
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
                    <span className={`text-4xl font-extrabold ${isPrimary ? 'text-white' : 'text-gray-900'}`}>{plan.monthly}&nbsp;€</span>
                    <span className={`pb-1 text-sm ${isPrimary ? 'text-blue-200' : 'text-gray-400'}`}>/mois</span>
                  </div>
                  <p className={`text-xs mt-1 ${isPrimary ? 'text-blue-200' : 'text-gray-400'}`}>
                    soit{' '}
                    <span className={`font-semibold ${isPrimary ? 'text-white' : 'text-gray-700'}`}>{plan.annual}&nbsp;€/an</span>
                  </p>
                </div>
                <CheckoutButton
                  planId={plan.id}
                  isSubscribed={isSubscribed}
                  hasStripeCustomer={hasStripeCustomer}
                  isPrimary={isPrimary}
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
