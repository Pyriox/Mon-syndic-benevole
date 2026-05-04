'use client';

import { useState } from 'react';
import { CheckCircle, Lock } from 'lucide-react';
import CheckoutButton from './CheckoutButton';

const PLANS = [
  {
    id: 'essentiel' as const,
    name: 'Essentiel',
    desc: '10 lots inclus',
    annual: 360,
    monthlyLabel: '30 €',
    badge: 'Le plus populaire',
    highlight: true,
    maxLots: 10,
  },
  {
    id: 'confort' as const,
    name: 'Confort',
    desc: '20 lots inclus',
    annual: 540,
    monthlyLabel: '45 €',
    badge: null,
    highlight: false,
    maxLots: 20,
  },
  {
    id: 'illimite' as const,
    name: 'Illimité',
    desc: 'Lots illimités',
    annual: 960,
    monthlyLabel: '80 €',
    badge: null,
    highlight: false,
    maxLots: Infinity,
  },
];

type PlanId = (typeof PLANS)[number]['id'];

function computeRecommended(lots: number): PlanId {
  if (lots <= 10) return 'essentiel';
  if (lots <= 20) return 'confort';
  return 'illimite';
}

interface Props {
  coproprieteId: string;
  currentPlanId: string | null | undefined;
  isSubscribed: boolean;
  isPastDue: boolean;
  initialLotCount: number;
}

export default function PlansGridSection({
  coproprieteId,
  currentPlanId,
  isSubscribed,
  isPastDue,
  initialLotCount,
}: Props) {
  const [lotInput, setLotInput] = useState<number>(initialLotCount);
  const showSelector = !isSubscribed && !isPastDue;
  const effectiveLots = lotInput > 0 ? lotInput : initialLotCount;
  const dynamicRecommended = computeRecommended(effectiveLots);

  return (
    <div className="space-y-4">
      {/* ── Micro-selector "Combien de lots ?" ── */}
      {showSelector && (
        <div className="flex flex-wrap items-center gap-3 p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
          <label htmlFor="lot-count-selector" className="text-sm font-medium text-indigo-900 shrink-0">
            Combien de lots avez-vous ?
          </label>
          <div className="flex items-center gap-3">
            <input
              id="lot-count-selector"
              type="number"
              min={1}
              max={500}
              value={lotInput || ''}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setLotInput(isNaN(val) ? 0 : Math.max(0, val));
              }}
              className="w-20 rounded-lg border border-indigo-200 bg-white px-2.5 py-1.5 text-sm text-center font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="ex: 12"
            />
            {lotInput > 0 && (
              <span className="text-xs text-indigo-700">
                → Plan recommandé :{' '}
                <strong className="text-indigo-900">
                  {PLANS.find((p) => p.id === dynamicRecommended)?.name}
                </strong>
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Grille des plans ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {PLANS.map((plan) => {
          const isCurrentPlan = currentPlanId === plan.id;
          const isLocked = (isSubscribed || isPastDue) && !isCurrentPlan;
          const isRecommended =
            !isSubscribed &&
            !isPastDue &&
            plan.id === dynamicRecommended;
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
                  <p
                    className={`text-sm font-bold ${
                      isCurrentPlan || (!isLocked && isPrimary) ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    {plan.name}
                  </p>
                  <p
                    className={`text-xs mt-0.5 ${
                      isCurrentPlan || (!isLocked && isPrimary) ? 'text-blue-200' : 'text-gray-400'
                    }`}
                  >
                    {plan.desc}
                  </p>
                </div>
                <div className="shrink-0">
                  {isCurrentPlan && (
                    <span className="flex items-center gap-1 bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      <CheckCircle size={10} /> Actuel
                    </span>
                  )}
                  {isLocked && <Lock size={13} className="text-gray-400 mt-0.5" />}
                  {!isLocked && !isCurrentPlan && plan.badge && !isRecommended && (
                    <span className="bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {plan.badge}
                    </span>
                  )}
                  {!isLocked && !isCurrentPlan && isRecommended && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isPrimary ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      Recommandé
                    </span>
                  )}
                </div>
              </div>

              {/* Prix */}
              <div className="flex items-end gap-1 mb-0.5">
                <span
                  className={`text-3xl font-extrabold ${
                    isCurrentPlan || (!isLocked && isPrimary) ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {plan.annual}&nbsp;€
                </span>
                <span
                  className={`pb-0.5 text-sm ${
                    isCurrentPlan || (!isLocked && isPrimary) ? 'text-blue-200' : 'text-gray-400'
                  }`}
                >
                  /an
                </span>
              </div>
              <p
                className={`text-xs mb-4 ${
                  isCurrentPlan || (!isLocked && isPrimary) ? 'text-blue-200' : 'text-gray-400'
                }`}
              >
                soit{' '}
                <span
                  className={`font-semibold ${
                    isCurrentPlan || (!isLocked && isPrimary) ? 'text-white' : 'text-gray-700'
                  }`}
                >
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
                  <CheckoutButton planId={plan.id} coproprieteid={coproprieteId} isPrimary={isPrimary} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
