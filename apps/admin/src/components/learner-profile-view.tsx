import { singleLearner } from "@/services/learner-services";
import type { Learner } from "@/types/learners.type";
import { useQuery } from "@tanstack/react-query";
import { User } from "lucide-react";
import { Skeleton } from "./ui/skeleton";

const LearnerProfile = ({ id }: { id: string }) => {
  const {
    data: learnerDetails,
    isLoading,
    error,
    isError,
  } = useQuery<Learner, Error>({
    queryKey: ["get-learner", id],
    queryFn: () => singleLearner(id),
  });

  return (
    <div>
      {isError && <span>{error.message}</span>}

      {/* Profile Image Section */}
      {isLoading ? (
        <ProfileImageSkeleton />
      ) : learnerDetails?.profileImage ? (
        <div className="flex items-center justify-center">
          <img
            src={learnerDetails?.profileImage}
            alt="photo"
            className="w-50 h-50 rounded-full object-cover"
          />
        </div>
      ) : (
        <div className="flex items-center justify-center">
          <User className="w-50 h-50 rounded-full text-gray-500 object-cover" />
        </div>
      )}

      {/* Name and Email Section */}
      <div className="flex items-center justify-center flex-col mt-3 mb-10">
        {isLoading ? (
          <NameEmailSkeleton />
        ) : (
          <>
            <p className="text-[#1F1F36] font-bold text-xl">
              {learnerDetails?.firstName ?? "N/A"}{" "}
              {learnerDetails?.lastName ?? ""}
            </p>
            <p className="text-[#1F1F36]">{learnerDetails?.email || "N/A"}</p>
          </>
        )}
      </div>

      {/* Details Section */}
      <div className="flex flex-col w-full px-8 py-9 rounded-2xl gap-4 shadow-sm">
        {isLoading ? (
          <DetailsSkeleton />
        ) : (
          <>
            <div className="flex justify-between">
              <p>Program</p>
              <p>{learnerDetails?.course || "N/A"}</p>
            </div>

            <div className="flex justify-between">
              <p>Gender</p>
              <p>{learnerDetails?.gender || "N/A"}</p>
            </div>

            <div className="flex justify-between">
              <p>Location</p>
              <p>{learnerDetails?.location || "N/A"}</p>
            </div>

            <div className="flex justify-between">
              <p>Paid</p>
              <p>{learnerDetails?.amount || "N/A"}</p>
            </div>

            <div className="flex justify-between">
              <p>Bio</p>
              <p className="flex-wrap">
                {learnerDetails?.description || "N/A"}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LearnerProfile;

// Skeleton for profile image
const ProfileImageSkeleton = () => {
  return (
    <div className="flex items-center justify-center">
      <Skeleton className="w-50 h-50 rounded-full bg-blue-100 dark:bg-blue-200" />
    </div>
  );
};

// Skeleton for name and email
const NameEmailSkeleton = () => {
  return (
    <div className="flex items-center justify-center flex-col gap-2">
      <Skeleton className="w-48 h-7 bg-blue-100 dark:bg-blue-200" />
      <Skeleton className="w-56 h-5 bg-blue-100 dark:bg-blue-200" />
    </div>
  );
};

// Skeleton for details section
const DetailsSkeleton = () => {
  return (
    <div className="flex flex-col gap-4">
      {/* Program row */}
      <div className="flex justify-between items-center">
        <Skeleton className="w-16 h-5 bg-blue-100 dark:bg-blue-200" />
        <Skeleton className="w-32 h-5 bg-blue-100 dark:bg-blue-200" />
      </div>

      {/* Gender row */}
      <div className="flex justify-between items-center">
        <Skeleton className="w-14 h-5 bg-blue-100 dark:bg-blue-200" />
        <Skeleton className="w-20 h-5 bg-blue-100 dark:bg-blue-200" />
      </div>

      {/* Location row */}
      <div className="flex justify-between items-center">
        <Skeleton className="w-18 h-5 bg-blue-100 dark:bg-blue-200" />
        <Skeleton className="w-28 h-5 bg-blue-100 dark:bg-blue-200" />
      </div>

      {/* Paid row */}
      <div className="flex justify-between items-center">
        <Skeleton className="w-10 h-5 bg-blue-100 dark:bg-blue-200" />
        <Skeleton className="w-24 h-5 bg-blue-100 dark:bg-blue-200" />
      </div>

      {/* Bio row */}
      <div className="flex justify-between items-start">
        <Skeleton className="w-8 h-5 bg-blue-100 dark:bg-blue-200" />
        <div className="flex flex-col gap-1 flex-1 ml-4">
          <Skeleton className="w-full h-5 bg-blue-100 dark:bg-blue-200" />
          <Skeleton className="w-3/4 h-5 bg-blue-100 dark:bg-blue-200" />
        </div>
      </div>
    </div>
  );
};
