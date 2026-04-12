'use client';

import { useEffect } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[dashboard] render failed', error);
  }, [error]);

  return (
    <Card className="max-w-3xl mx-auto mt-6">
      <div className="flex items-start gap-4 rounded-xl border border-red-200 bg-red-50 px-5 py-4">
        <div className="shrink-0 rounded-lg bg-red-100 p-2">
          <AlertTriangle size={20} className="text-red-600" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-red-900">Impossible de charger le tableau de bord</h2>
          <p className="mt-1 text-sm text-red-800">
            Les données n&apos;ont pas pu être chargées correctement. La page n&apos;a pas été affichée partiellement pour éviter une vue vide ou incohérente.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button onClick={reset} className="inline-flex items-center gap-2">
              <RefreshCw size={16} />
              Réessayer
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
