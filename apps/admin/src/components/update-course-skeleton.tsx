const UpdateCourseFormSkeleton = () => {
  return (
    <div className="animate-pulse">
      {/* Title Field Skeleton */}
      <div className="mb-4">
        <div className="h-4 bg-gray-300 rounded w-16 mb-2"></div>
        <div className="h-10 bg-gray-300 rounded-md w-full"></div>
      </div>

      {/* Track Select Skeleton */}
      <div className="mb-4">
        <div className="h-4 bg-gray-300 rounded w-20 mb-2"></div>
        <div className="h-10 bg-gray-300 rounded-md w-full"></div>
      </div>

      {/* Image Upload Skeleton */}
      <div className="mb-4">
        <div className="h-4 bg-gray-300 rounded w-24 mb-2"></div>
        <div className="h-32 bg-gray-300 rounded-md w-full border-2 border-dashed border-gray-400"></div>
      </div>

      {/* Description Field Skeleton */}
      <div className="mb-4">
        <div className="h-4 bg-gray-300 rounded w-20 mb-2"></div>
        <div className="h-10 bg-gray-300 rounded-md w-full"></div>
      </div>

      {/* Submit Button Skeleton */}
      <div className="pt-4">
        <div className="h-10 bg-gray-300 rounded w-32 mb-4"></div>
      </div>
    </div>
  );
};

export default UpdateCourseFormSkeleton;
