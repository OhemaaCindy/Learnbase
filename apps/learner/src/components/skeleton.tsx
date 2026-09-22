// Shimmer component for loading state
const CardShimmer = () => {
  return (
    <div className="w-full h-80 flex flex-col rounded-xl overflow-hidden shadow-sm border border-gray-100 bg-white mb-10 animate-pulse">
      {/* Image shimmer */}
      <div className="h-40 relative bg-blue-100">
        {/* Price tag shimmer */}
        <div className="absolute top-3 right-3 bg-gray-300 w-12 h-6 rounded-lg"></div>
      </div>

      {/* Content shimmer */}
      <div className="p-4">
        {/* Title shimmer */}
        <div className="h-5 bg-gray-200 rounded mb-2 w-3/4"></div>

        {/* Duration shimmer */}
        <div className="flex items-center mb-3">
          <div className="w-4 h-4 bg-gray-200 rounded mr-1"></div>
          <div className="h-4 bg-gray-200 rounded w-16"></div>
        </div>

        {/* Peels shimmer */}
        <div className="flex flex-wrap gap-2">
          <div className="h-6 bg-gray-200 rounded-full w-16"></div>
          <div className="h-6 bg-gray-200 rounded-full w-20"></div>
        </div>
      </div>
    </div>
  );
};

// Grid of shimmer cards
const TrackSectionShimmer = () => {
  return (
    <div className="flex flex-col justify-center items-center mt-10 mb-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl sm:text-4xl lg:text-5xl font-semibold leading-tight text-center">
        Our solutions
      </h1>
      <p className="font-semibold mb-10 text-center max-w-3xl">
        Create your account quickly with just your email or social media login,
        then explore a wide range
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 w-full">
        {Array.from({ length: 4 }).map((_, index) => (
          <CardShimmer key={index} />
        ))}
      </div>
    </div>
  );
};

export { CardShimmer, TrackSectionShimmer };
