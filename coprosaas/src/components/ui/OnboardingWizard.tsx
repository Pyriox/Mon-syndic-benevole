'use client';

import { CheckCircle2, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface OnboardingWizardProps {
  step: 2 | 3;
  nextHref: string;
}

const STEPS = ['Copropriété', 'Lots', 'Copropriétaires'];

export default function OnboardingWizard({ step, nextHref }: OnboardingWizardProps) {
  const stepDesc =
    step === 2
      ? 'Ajoutez les lots de la copropriété avec leurs tantièmes. Vous pourrez attribuer chaque lot à un copropriétaire.'
      : 'Ajoutez les copropriétaires et invitez-les à rejoindre leur espace en ligne.';

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex-1 min-w-0 space-y-3">
          {/* Titre */}
          <p className="text-sm font-semibold text-blue-900">
            🎉 Votre copropriété a été créée — configurez-la en 2 étapes
          </p>

          {/* Stepper */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {STEPS.map((label, i) => {
              const num = i + 1;
              const done = num < step;
              const active = num === step;
              return (
                <span key={label} className="flex items-center gap-1">
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-medium ${
                      done ? 'text-green-600' : active ? 'text-blue-700 font-semibold' : 'text-gray-400'
                    }`}
                  >
                    {done ? (
                      <CheckCircle2 size={13} />
                    ) : (
                      <span
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center text-[9px] font-bold ${
                          active
                            ? 'border-blue-600 text-blue-600 bg-white'
                            : 'border-gray-300 text-gray-400 bg-white'
                        }`}
                      >
                        {num}
                      </span>
                    )}
                    {label}
                  </span>
                  {i < STEPS.length - 1 && (
                    <ChevronRight size={11} className="text-gray-300 shrink-0" />
                  )}
                </span>
              );
            })}
          </div>

          {/* Description */}
          <p className="text-xs text-blue-700">{stepDesc}</p>
        </div>

        {/* CTA */}
        <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 shrink-0">
          <Link
            href={nextHref}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-colors"
          >
            {step < STEPS.length ? 'Étape suivante' : 'Tableau de bord'}
            <ChevronRight size={12} />
          </Link>
          <Link
            href="/dashboard"
            className="text-[10px] text-blue-500 hover:text-blue-700 hover:underline"
          >
            Passer
          </Link>
        </div>
      </div>
    </div>
  );
}
