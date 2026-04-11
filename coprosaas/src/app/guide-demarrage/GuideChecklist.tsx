'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, RotateCcw } from 'lucide-react';

const STORAGE_KEY = 'msb-guide-demarrage-progress';

export default function GuideChecklist({
  steps,
}: {
  steps: Array<{ id: string; label: string }>;
}) {
  const [checkedIds, setCheckedIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored) as string[];
      if (Array.isArray(parsed)) {
        setCheckedIds(parsed.filter((id) => steps.some((step) => step.id === id)));
      }
    } catch {
      // no-op
    }
  }, [steps]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(checkedIds));
    } catch {
      // no-op
    }
  }, [checkedIds]);

  const completedCount = checkedIds.length;
  const progress = steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 0;

  const isChecked = useMemo(() => new Set(checkedIds), [checkedIds]);

  return (
    <div className="rounded-2xl border border-blue-100 bg-white/90 p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">Suivi du guide</p>
          <p className="text-xs text-slate-500 mt-1">
            {completedCount} étape{completedCount > 1 ? 's' : ''} cochée{completedCount > 1 ? 's' : ''} sur {steps.length}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCheckedIds([])}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700"
        >
          <RotateCcw size={13} /> Réinitialiser
        </button>
      </div>

      <div className="mt-3 h-2 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all" style={{ width: `${progress}%` }} />
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-2">
        {steps.map((step, index) => {
          const checked = isChecked.has(step.id);
          return (
            <label
              key={step.id}
              className={`flex items-start gap-2 rounded-xl border px-3 py-2 text-sm transition-colors ${checked ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-slate-50 text-slate-700'}`}
            >
              <input
                type="checkbox"
                className="mt-0.5"
                checked={checked}
                onChange={() => {
                  setCheckedIds((current) => (
                    checked ? current.filter((id) => id !== step.id) : [...current, step.id]
                  ));
                }}
              />
              <span className="min-w-0">
                <span className="block text-[11px] font-semibold uppercase tracking-wide opacity-70">Étape {index + 1}</span>
                <span className="flex items-center gap-1.5">
                  {checked ? <CheckCircle2 size={14} className="shrink-0" /> : null}
                  {step.label}
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
