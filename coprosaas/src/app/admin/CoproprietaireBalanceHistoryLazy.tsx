'use client';

import dynamic from 'next/dynamic';
import type { BalanceEventRow } from '@/app/(dashboard)/coproprietaires/CoproprietaireBalanceHistory';

const CoproprietaireBalanceHistory = dynamic(
  () => import('@/app/(dashboard)/coproprietaires/CoproprietaireBalanceHistory'),
  {
    ssr: false,
    loading: () => <span className="text-xs text-gray-300">...</span>,
  }
);

export default function CoproprietaireBalanceHistoryLazy({
  coproprietaireId,
  displayName,
  currentBalance,
  initialEvents,
}: {
  coproprietaireId: string;
  displayName: string;
  currentBalance: number;
  initialEvents: BalanceEventRow[];
}) {
  return (
    <CoproprietaireBalanceHistory
      coproprietaireId={coproprietaireId}
      displayName={displayName}
      currentBalance={currentBalance}
      initialEvents={initialEvents}
    />
  );
}
