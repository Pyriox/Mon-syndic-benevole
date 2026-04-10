import PageLoadingState from '@/components/ui/PageLoadingState';

export default function AideLoading() {
  return (
    <PageLoadingState
      title="Ouverture de l’aide…"
      subtitle="Nous chargeons la FAQ et vos échanges avec le support."
    >
      <div className="animate-pulse space-y-6 max-w-5xl mx-auto">
        <div className="h-7 w-40 bg-gray-200 rounded-lg" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded-xl" />
          ))}
        </div>
      </div>
    </PageLoadingState>
  );
}
