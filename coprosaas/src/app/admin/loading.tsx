import PageLoadingState from '@/components/ui/PageLoadingState';

export default function AdminLoading() {
  return (
    <PageLoadingState>
      <div className="animate-pulse space-y-5">
        <div className="grid gap-4 md:grid-cols-[220px_1fr]">
          <div className="space-y-2 rounded-2xl border border-gray-200 bg-white p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-9 rounded-lg bg-gray-200" />
            ))}
          </div>
          <div className="space-y-4">
            <div className="h-8 w-56 rounded-lg bg-gray-200" />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-28 rounded-2xl bg-gray-200" />
              ))}
            </div>
            <div className="h-80 rounded-2xl bg-gray-200" />
          </div>
        </div>
      </div>
    </PageLoadingState>
  );
}
