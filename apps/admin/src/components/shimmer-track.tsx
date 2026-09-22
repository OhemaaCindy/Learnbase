const CardShimmer = () => {
  return (
    <div className="w-full h-80 flex flex-col rounded-2xl overflow-hidden shadow-sm border border-gray-100 bg-white animate-pulse">
      {/* Image shimmer */}
      <div className="h-40 relative bg-blue-100 dark:bg-blue-200">
        {/* Tag shimmer (like price or label) */}
        <div className="absolute top-3 right-3 bg-blue-100 dark:bg-blue-200 w-12 h-6 rounded-lg"></div>
      </div>

      {/* Content shimmer */}
      <div className="p-4 flex flex-col justify-between flex-1">
        {/* Title shimmer */}
        <div className="h-5 bg-blue-100 dark:bg-blue-200 rounded mb-2 w-3/4"></div>

        {/* Subtitle / duration shimmer */}
        <div className="flex items-center mb-3">
          <div className="w-4 h-4 bg-blue-100 dark:bg-blue-200 rounded mr-2"></div>
          <div className="h-4  bg-blue-100 dark:bg-blue-200 rounded w-16"></div>
        </div>

        {/* Chips shimmer (like skills or tags) */}
        <div className="flex flex-wrap gap-2">
          <div className="h-6 bg-blue-100 dark:bg-blue-200 rounded-full w-20"></div>
          <div className="h-6 bg-blue-100 dark:bg-blue-200 rounded-full w-16"></div>
          {/* <div className="h-6 bg-blue-100 dark:bg-blue-200 rounded-full w-24"></div> */}
        </div>
      </div>
    </div>
  );
};

export const ShimmerTrack = () => {
  return (
    <div className="grid w-full grid-cols-1 grid-rows-4 gap-6 sm:grid-cols-2 md:grid-cols-2 md:px-0 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <CardShimmer key={i} />
      ))}
    </div>
  );
};
