'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Dashboard error]', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 px-4 text-center">
      <AlertTriangle className="w-10 h-10 text-yellow-500" />
      <h2 className="text-lg font-semibold text-gray-800">Une erreur est survenue</h2>
      <p className="text-sm text-gray-500 max-w-sm">
        Impossible de charger cette page. Si le problème persiste, contactez le support.
      </p>
      <button
        onClick={reset}
        className="mt-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Réessayer
      </button>
    </div>
  );
}
