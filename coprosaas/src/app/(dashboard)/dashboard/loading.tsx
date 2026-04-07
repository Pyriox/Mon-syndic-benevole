import PageLoadingState from '@/components/ui/PageLoadingState';

// Skeleton affiché instantanément pendant le chargement du tableau de bord
export default function DashboardLoading() {
  return (
    <PageLoadingState
      title="Ouverture de votre tableau de bord…"
      subtitle="Vos données arrivent. Cela ne prend généralement qu’un instant."
    >
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
    </PageLoadingState>
  );
}
