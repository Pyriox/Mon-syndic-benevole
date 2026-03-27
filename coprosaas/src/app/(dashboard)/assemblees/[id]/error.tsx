'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function AGDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[AG detail error]', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 px-4 text-center">
      <AlertTriangle className="w-10 h-10 text-yellow-500" />
      <h2 className="text-lg font-semibold text-gray-800">
        Impossible de charger cette assemblée
      </h2>
      <p className="text-sm text-gray-500 max-w-sm">
        Une erreur est survenue lors du chargement des données de l&apos;assemblée générale.
      </p>
      <div className="flex gap-3 mt-2">
        <button
          onClick={reset}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Réessayer
        </button>
        <Link
          href="/assemblees"
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Retour aux assemblées
        </Link>
      </div>
    </div>
  );
}
