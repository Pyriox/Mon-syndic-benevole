import PageLoadingState from '@/components/ui/PageLoadingState';

export default function RegularisationLoading() {
  return (
    <PageLoadingState
      title="Ouverture de la régularisation…"
      subtitle="Nous calculons les exercices, provisions et écarts de charges."
    >
      <div className="animate-pulse space-y-5 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="h-7 w-48 bg-gray-200 rounded-lg" />
          <div className="h-9 w-36 bg-gray-200 rounded-lg" />
        </div>
        {/* Lignes exercices */}
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-xl" />
          ))}
        </div>
      </div>
    </PageLoadingState>
  );
}
