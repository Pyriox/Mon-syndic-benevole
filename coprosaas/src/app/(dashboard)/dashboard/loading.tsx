import { Loader2 } from 'lucide-react';

// Skeleton affiché instantanément pendant le chargement du tableau de bord
export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        <Loader2 size={16} className="animate-spin text-blue-600" />
        <div>
          <p className="font-semibold">Ouverture de votre tableau de bord…</p>
          <p className="text-xs text-blue-700/80">Vos données arrivent. Cela ne prend généralement qu’un instant.</p>
        </div>
      </div>

      <div className="animate-pulse space-y-6">
        {/* Titre */}
        <div className="h-7 w-56 bg-gray-200 rounded-lg" />

        {/* Cartes de stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-gray-200 rounded-xl" />
          ))}
        </div>

        {/* Deux colonnes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="h-5 w-40 bg-gray-200 rounded-md" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-14 bg-gray-200 rounded-xl" />
            ))}
          </div>
          <div className="space-y-3">
            <div className="h-5 w-40 bg-gray-200 rounded-md" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-14 bg-gray-200 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
