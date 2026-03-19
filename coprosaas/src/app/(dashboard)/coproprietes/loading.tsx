export default function CopropriétésLoading() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="flex items-center justify-between">
        <div className="h-7 w-44 bg-gray-200 rounded-lg" />
        <div className="h-9 w-40 bg-gray-200 rounded-lg" />
      </div>
      {/* Cartes copropriétés */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 bg-gray-200 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
