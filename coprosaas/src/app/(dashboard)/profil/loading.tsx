export default function ProfilLoading() {
  return (
    <div className="animate-pulse space-y-6 max-w-xl">
      <div className="h-7 w-36 bg-gray-200 rounded-lg" />
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-4 w-24 bg-gray-200 rounded-md" />
            <div className="h-10 bg-gray-200 rounded-lg" />
          </div>
        ))}
      </div>
      <div className="h-10 w-40 bg-gray-200 rounded-lg" />
    </div>
  );
}
