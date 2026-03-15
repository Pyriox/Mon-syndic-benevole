// ============================================================
// Page : Abonnement
// 3 plans : Essentiel (≤15 lots), Confort (≤25 lots), Illimité
// -10 % pour paiement annuel sur tous les plans
// ============================================================
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Card, { CardHeader } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { Check, CreditCard } from 'lucide-react';

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
    desc: "Jusqu'à 15 lots inclus",
    monthly: 20,
    annual: 216,
    annualMonthly: 18,
    badge: 'Le plus populaire',
    highlight: true,
  },
  {
    id: 'confort',
    name: 'Confort',
    desc: "Jusqu'à 25 lots inclus",
    monthly: 30,
    annual: 324,
    annualMonthly: 27,
    badge: null,
    highlight: false,
  },
  {
    id: 'illimite',
    name: 'Illimité',
    desc: 'Lots illimités',
    monthly: 50,
    annual: 540,
    annualMonthly: 45,
    badge: null,
    highlight: false,
  },
] as const;

export default async function AbonnementPage() {
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

  // Plan recommandé selon le nombre de lots total
  const recommendedPlan = totalLots <= 15 ? 'essentiel' : totalLots <= 25 ? 'confort' : 'illimite';

  return (
    <div className="min-h-full flex flex-col items-center justify-start py-8 px-4">
      <div className="w-full max-w-4xl space-y-8">

        <div>
          <h2 className="text-2xl font-bold text-gray-900">Abonnement</h2>
          <p className="text-gray-500 mt-1">Un abonnement par copropriété — choisissez le plan adapté à votre nombre de lots.</p>
        </div>

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
          </div>
        </Card>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PLANS.map((plan) => {
            const isRecommended = plan.id === recommendedPlan;
            const isPrimary = plan.highlight || isRecommended;
            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl p-6 flex flex-col gap-4 ${
                  isPrimary
                    ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl shadow-blue-900/20'
                    : 'bg-white border border-gray-200 shadow-sm'
                }`}
              >
                {/* Titre + badges */}
                <div className="flex items-start justify-between gap-2 min-h-[24px]">
                  <div>
                    <p className={`text-sm font-bold ${isPrimary ? 'text-white' : 'text-gray-900'}`}>
                      {plan.name}
                    </p>
                    <p className={`text-xs mt-0.5 ${isPrimary ? 'text-blue-200' : 'text-gray-400'}`}>
                      {plan.desc}
                    </p>
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

                {/* Prix */}
                <div>
                  <div className="flex items-end gap-1">
                    <span className={`text-4xl font-extrabold ${isPrimary ? 'text-white' : 'text-gray-900'}`}>
                      {plan.monthly}&nbsp;€
                    </span>
                    <span className={`pb-1 text-sm ${isPrimary ? 'text-blue-200' : 'text-gray-400'}`}>/mois</span>
                  </div>
                  <p className={`text-xs mt-1 ${isPrimary ? 'text-blue-200' : 'text-gray-400'}`}>
                    ou{' '}
                    <span className={`font-semibold ${isPrimary ? 'text-white' : 'text-gray-700'}`}>
                      {plan.annual}&nbsp;€/an
                    </span>
                    {' '}({plan.annualMonthly}&nbsp;€/mois &mdash; &minus;10&nbsp;%)
                  </p>
                </div>

                {/* Fonctionnalités */}
                <ul className="space-y-1.5 flex-1">
                  {FEATURES.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check
                        size={14}
                        className={`mt-0.5 shrink-0 ${isPrimary ? 'text-green-300' : 'text-green-500'}`}
                      />
                      <span className={isPrimary ? 'text-white/90' : 'text-gray-600'}>{f}</span>
                    </li>
                  ))}
                </ul>

                {/* Bouton */}
                <button
                  disabled={isSubscribed}
                  className={`mt-2 flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold transition-colors ${
                    isSubscribed
                      ? 'bg-white/10 text-white/50 cursor-default'
                      : isPrimary
                        ? 'bg-white text-blue-700 hover:bg-blue-50'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  <CreditCard size={15} />
                  {isSubscribed ? 'Abonnement actif' : 'S’abonner — 30 jours offerts'}
                </button>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-gray-400 text-center">
          Carte bancaire requise. Les 30 premiers jours ne seront pas facturés. Sans engagement.{' '}
          Pour toute question :{' '}
          <a href="mailto:contact@mon-syndic-benevole.fr" className="underline hover:text-gray-600">
            contact@mon-syndic-benevole.fr
          </a>
        </p>
      </div>
    </div>
  );
}
