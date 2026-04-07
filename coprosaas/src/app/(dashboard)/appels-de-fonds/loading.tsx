import PageLoadingState from '@/components/ui/PageLoadingState';

export default function AppelsDeFondsLoading() {
  return (
    <PageLoadingState
      title="Ouverture des appels de fonds…"
      subtitle="Nous récupérons les appels, échéances et paiements en cours."
    >
      <div className="animate-pulse space-y-5">
        <div className="flex items-center justify-between">
          <div className="h-7 w-48 bg-gray-200 rounded-lg" />
          <div className="h-9 w-40 bg-gray-200 rounded-lg" />
        </div>
        {/* Cartes appels */}
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-gray-200 rounded-xl" />
          ))}
        </div>
      </div>
    </PageLoadingState>
  );
}
