export default function AssembleeDetailLoading() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Page title */}
      <div className="h-7 w-64 bg-gray-200 rounded-lg" />
      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 bg-gray-200 rounded-xl" />
        ))}
      </div>
      {/* Resolution list */}
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
