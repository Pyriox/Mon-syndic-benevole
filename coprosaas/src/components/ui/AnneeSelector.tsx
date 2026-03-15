'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface AnneeSelectorProps {
  annee: number;
}

export default function AnneeSelector({ annee }: AnneeSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const navigate = (year: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('annee', year.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2 py-1.5">
      <button
        onClick={() => navigate(annee - 1)}
        className="p-1 rounded hover:bg-gray-100 text-gray-500 transition-colors"
        title="Année précédente"
      >
        <ChevronLeft size={15} />
      </button>
      <span className="text-sm font-semibold text-gray-900 px-2 min-w-[3rem] text-center">
        {annee}
      </span>
      <button
        onClick={() => navigate(annee + 1)}
        className="p-1 rounded hover:bg-gray-100 text-gray-500 transition-colors"
        title="Année suivante"
      >
        <ChevronRight size={15} />
      </button>
    </div>
  );
}
