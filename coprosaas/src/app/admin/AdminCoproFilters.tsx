'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';

interface Props {
  counts: {
    essai: number;
    actif: number;
    inactif: number;
    resilie: number;
    passe_du: number;
    total: number;
    lots: number;
    coproprietaires: number;
  };
  activePlan: string;
}

const FILTERS = [
  { key: 'essai',    label: 'essai',      cls: 'bg-amber-50 text-amber-700 border-amber-200',   activeCls: 'bg-amber-200 text-amber-900 border-amber-400' },
  { key: 'actif',   label: 'actives',    cls: 'bg-green-50 text-green-700 border-green-200',   activeCls: 'bg-green-200 text-green-900 border-green-400' },
  { key: 'inactif', label: 'inactives',  cls: 'bg-gray-100 text-gray-500 border-gray-200',     activeCls: 'bg-gray-300 text-gray-800 border-gray-400' },
  { key: 'resilie', label: 'résiliées',  cls: 'bg-orange-50 text-orange-600 border-orange-200', activeCls: 'bg-orange-200 text-orange-800 border-orange-400' },
  { key: 'passe_du',label: 'impayées',   cls: 'bg-red-50 text-red-600 border-red-200',          activeCls: 'bg-red-200 text-red-800 border-red-400' },
] as const;

export default function AdminCoproFilters({ counts, activePlan }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const toggle = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (params.get('plan') === key) {
      params.delete('plan');
    } else {
      params.set('plan', key);
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex gap-2 text-xs flex-wrap items-center">
      {FILTERS.map(({ key, label, cls, activeCls }) => {
        const count = counts[key as keyof typeof counts] as number;
        if (key === 'passe_du' && count === 0) return null;
        const isActive = activePlan === key;
        return (
          <button
            key={key}
            onClick={() => toggle(key)}
            className={`px-2 py-1 rounded-md font-medium border transition-colors ${isActive ? activeCls : cls} hover:opacity-80`}
          >
            {count} {label}
            {isActive && <span className="ml-1 opacity-60">×</span>}
          </button>
        );
      })}
      <span className="text-gray-400 px-2 py-1">
        {counts.lots} lots au total · {counts.coproprietaires} copropriétaires
      </span>
    </div>
  );
}
