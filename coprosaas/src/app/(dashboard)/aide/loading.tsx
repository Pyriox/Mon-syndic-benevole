export default function AideLoading() {
  return (
    <div className="animate-pulse space-y-6 max-w-2xl">
      <div className="h-7 w-40 bg-gray-200 rounded-lg" />
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 bg-gray-200 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
