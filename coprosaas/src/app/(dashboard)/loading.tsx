import PageLoadingState from '@/components/ui/PageLoadingState';

export default function DashboardRouteLoading() {
  return (
    <PageLoadingState
      title="Ouverture de votre espace…"
      subtitle="Nous préparons les données de la copropriété. Cela ne prend généralement qu’un instant."
    >
      <div className="animate-pulse space-y-5 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="h-7 w-52 rounded-lg bg-gray-200" />
          <div className="h-9 w-32 rounded-lg bg-gray-200" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-gray-200" />
          ))}
        </div>
      </div>
    </PageLoadingState>
  );
}
