import PageLoadingState from '@/components/ui/PageLoadingState';

export default function CoproprietairesLoading() {
  return (
    <PageLoadingState
      title="Ouverture des copropriétaires…"
      subtitle="Nous préparons la liste, les lots et les soldes associés."
    >
      <div className="animate-pulse space-y-5">
        <div className="flex items-center justify-between">
          <div className="h-7 w-48 bg-gray-200 rounded-lg" />
          <div className="h-9 w-36 bg-gray-200 rounded-lg" />
        </div>
        {/* Barre de recherche */}
        <div className="h-10 w-full max-w-sm bg-gray-200 rounded-lg" />
        {/* Lignes de table */}
        <div className="space-y-2">
          <div className="h-10 bg-gray-100 rounded-lg" />
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-14 bg-gray-200 rounded-xl" />
          ))}
        </div>
      </div>
    </PageLoadingState>
  );
}
