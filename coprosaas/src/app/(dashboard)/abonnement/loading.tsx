export default function AbonnementLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-7 w-44 bg-gray-200 rounded-lg" />
      {/* Cartes de plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-64 bg-gray-200 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
