'use client';

import { RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function RefreshButton({ fetchedAt }: { fetchedAt: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  function handleRefresh() {
    setPending(true);
    router.refresh();
    // Reset after 3s (Next.js doesn't expose a "done" callback for refresh)
    setTimeout(() => setPending(false), 3000);
  }

  const ageMs = Date.now() - Date.parse(fetchedAt);
  const ageMin = Math.floor(ageMs / 60_000);
  const stale = ageMin >= 4;

  return (
    <button
      type="button"
      onClick={handleRefresh}
      disabled={pending}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors disabled:cursor-wait ${
        stale
          ? 'bg-amber-500/20 text-amber-200 hover:bg-amber-500/30'
          : 'bg-white/10 text-slate-300 hover:bg-white/20'
      }`}
    >
      <RefreshCw size={11} className={pending ? 'animate-spin' : ''} />
      {pending
        ? 'Actualisation…'
        : stale
          ? `Données ${ageMin} min · Actualiser`
          : `Màj il y a ${ageMin === 0 ? '< 1' : ageMin} min`}
    </button>
  );
}
