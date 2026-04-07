import PageLoadingState from '@/components/ui/PageLoadingState';

export default function IncidentsLoading() {
  return (
    <PageLoadingState
      title="Ouverture des incidents…"
      subtitle="Nous chargeons les signalements, photos et statuts en cours."
    >
      <div className="animate-pulse space-y-5">
        <div className="flex items-center justify-between">
          <div className="h-7 w-44 bg-gray-200 rounded-lg" />
          <div className="h-9 w-36 bg-gray-200 rounded-lg" />
        </div>
        {/* Filtres */}
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-8 w-24 bg-gray-200 rounded-full" />
          ))}
        </div>
        {/* Cartes incidents */}
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-xl" />
          ))}
        </div>
      </div>
    </PageLoadingState>
  );
}
