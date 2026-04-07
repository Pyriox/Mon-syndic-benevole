import PageLoadingState from '@/components/ui/PageLoadingState';

export default function LotsLoading() {
  return (
    <PageLoadingState
      title="Ouverture des lots…"
      subtitle="Nous récupérons la liste des lots et leurs tantièmes."
    >
      <div className="animate-pulse space-y-5">
        <div className="flex items-center justify-between">
          <div className="h-7 w-24 bg-gray-200 rounded-lg" />
          <div className="h-9 w-28 bg-gray-200 rounded-lg" />
        </div>
        {/* Table skeleton */}
        <div className="space-y-2">
          <div className="h-10 bg-gray-100 rounded-lg" />
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded-xl" />
          ))}
        </div>
      </div>
    </PageLoadingState>
  );
}
