import PageLoadingState from '@/components/ui/PageLoadingState';

export default function CoproprieteDetailLoading() {
  return (
    <PageLoadingState
      title="Ouverture de la copropriété…"
      subtitle="Nous préparons les informations détaillées, lots et paramètres."
    >
      <div className="animate-pulse space-y-6 max-w-5xl mx-auto">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div className="h-7 w-52 bg-gray-200 rounded-lg" />
          <div className="h-9 w-36 bg-gray-200 rounded-lg" />
        </div>

        {/* Carte infos copropriété */}
        <div className="h-40 bg-gray-200 rounded-xl" />

        {/* Tableau lots */}
        <div className="space-y-3">
          <div className="h-5 w-32 bg-gray-200 rounded-md" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 bg-gray-200 rounded-xl" />
          ))}
        </div>
      </div>
    </PageLoadingState>
  );
}
