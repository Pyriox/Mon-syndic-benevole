import PageLoadingState from '@/components/ui/PageLoadingState';

export default function AssembleesLoading() {
  return (
    <PageLoadingState
      title="Ouverture des assemblées générales…"
      subtitle="Nous chargeons vos AG et leurs résolutions."
    >
      <div className="animate-pulse space-y-5">
        <div className="flex items-center justify-between">
          <div className="h-7 w-52 bg-gray-200 rounded-lg" />
          <div className="h-9 w-36 bg-gray-200 rounded-lg" />
        </div>
        {/* Cartes AG */}
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-xl" />
          ))}
        </div>
      </div>
    </PageLoadingState>
  );
}
