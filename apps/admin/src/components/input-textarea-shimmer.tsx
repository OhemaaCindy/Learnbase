// Shimmer component for loading states
export const InputShimmer = () => (
  <div className="mb-4 w-full">
    <div className="h-4 bg-blue-100 dark:bg-blue-200 rounded animate-pulse mb-2 w-20"></div>
    <div className="w-full h-10 bg-blue-100 dark:bg-blue-200 rounded-md animate-pulse"></div>
  </div>
);

export const TextareaShimmer = () => (
  <div className="mb-4 w-full md:col-span-2">
    <div className="h-4 bg-blue-100 dark:bg-blue-200 rounded animate-pulse mb-2 w-24"></div>
    <div className="w-full h-24 bg-blue-100 dark:bg-blue-200 rounded-lg animate-pulse"></div>
  </div>
);
