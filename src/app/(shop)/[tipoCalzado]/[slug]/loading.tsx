export default function Loading() {
  return (
    <main className="container-custom py-8 mt-8">
      {/* Breadcrumb skeleton */}
      <div className="mb-8 flex items-center gap-2">
        <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Imagen skeleton */}
        <div className="space-y-4">
          <div className="aspect-square bg-gray-200 rounded-xl animate-pulse"></div>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-20 h-20 bg-gray-200 rounded-lg animate-pulse"></div>
            ))}
          </div>
        </div>

        {/* Info skeleton */}
        <div className="space-y-6">
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-10 w-3/4 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-24 w-full bg-gray-200 rounded-xl animate-pulse"></div>
          <div className="h-12 w-full bg-gray-200 rounded animate-pulse"></div>
          <div className="h-32 w-full bg-gray-200 rounded animate-pulse"></div>
          <div className="h-14 w-full bg-gray-200 rounded-xl animate-pulse"></div>
        </div>
      </div>
    </main>
  );
}
