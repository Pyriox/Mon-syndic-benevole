function SkeletonCard({ tall }: { tall?: boolean }) {
  return <div className={`rounded-2xl bg-gray-100 ${tall ? 'h-32' : 'h-28'}`} />;
}

function SkeletonSection({ cards = 4, title = true }: { cards?: number; title?: boolean }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      {title && <div className="mb-4 flex items-center gap-2">
        <div className="h-6 w-6 rounded-lg bg-gray-100" />
        <div className="h-4 w-44 rounded bg-gray-100" />
      </div>}
      <div className={`grid gap-4 ${cards === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2 xl:grid-cols-4'}`}>
        {Array.from({ length: cards }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    </div>
  );
}

export default function AnalyticsLoading() {
  return (
    <div className="animate-pulse space-y-6 pb-16">
      {/* Header */}
      <div className="h-36 rounded-2xl bg-slate-800 opacity-60" />

      {/* Alertes */}
      <SkeletonSection cards={3} />

      {/* Funnel */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <div className="h-6 w-6 rounded-lg bg-gray-100" />
          <div className="h-4 w-48 rounded bg-gray-100" />
        </div>
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex-1 h-24 rounded-xl bg-gray-100" />
          ))}
        </div>
      </div>

      {/* Engagement */}
      <SkeletonSection cards={4} />

      {/* Feed + signups */}
      <div className="grid gap-4 xl:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <div className="h-6 w-6 rounded-lg bg-gray-100" />
              <div className="h-4 w-40 rounded bg-gray-100" />
            </div>
            <div className="space-y-2.5">
              {Array.from({ length: 6 }).map((_, j) => (
                <div key={j} className="flex items-center gap-3">
                  <div className="h-7 w-7 rounded-full bg-gray-100 shrink-0" />
                  <div className="h-4 flex-1 rounded bg-gray-100" />
                  <div className="h-3 w-16 rounded bg-gray-100 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Acquisition */}
      <SkeletonSection cards={4} />

      {/* GA4 */}
      <SkeletonSection cards={4} />
    </div>
  );
}
