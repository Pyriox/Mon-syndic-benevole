export default function DepensesLoading() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="flex items-center justify-between">
        <div className="h-7 w-36 bg-gray-200 rounded-lg" />
        <div className="h-9 w-36 bg-gray-200 rounded-lg" />
      </div>
      {/* Carte total */}
      <div className="h-20 w-64 bg-gray-200 rounded-xl" />
      {/* Lignes de table */}
      <div className="space-y-2">
        <div className="h-10 bg-gray-100 rounded-lg" />
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-14 bg-gray-200 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
