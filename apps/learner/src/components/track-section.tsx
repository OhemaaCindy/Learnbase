import { allTracks } from "@/services/track-services";
import { Calendar } from "lucide-react";
import { TrackSectionShimmer } from "./skeleton";
import { TrackResponse } from "@/types/track.type";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";

const TrackSection = () => {
  // Array of colors to cycle through
  const courseColors = [
    "bg-[#ECFDF3] text-[#027A48]",
    "bg-[#F3F0FB] text-[#6941C6]",
    "bg-[#F0F9FF] text-[#026AA2]",
    "bg-[#F8F9FC] text-[#363F72]",
    "bg-[#F7EDF6] text-[#C11574]",
    "bg-[#E9F3FB] text-[#175CD3]",
    "bg-[#FFF4ED] text-[#B93815]",
    "bg-[#FFF1F3] text-[#C01048]",
  ];

  // Function to get color based on card and course index
  const getCourseColor = (cardIndex: number, courseIndex: number) => {
    const colorIndex = (cardIndex * 2 + courseIndex) % courseColors.length;
    return courseColors[colorIndex];
  };

  const { data, isLoading } = useQuery<TrackResponse, Error>({
    queryKey: ["get-all-tracks"],
    queryFn: allTracks,
  });

  // Show shimmer while loading
  if (isLoading) {
    return <TrackSectionShimmer />;
  }

  const trackDetails = data?.tracks.slice(0, 4) || [];
  console.log("🚀 ~ TracksPage ~ trackDetails:", trackDetails);

  return (
    <div className="flex flex-col justify-center items-center py-8 sm:py-12 lg:py-16 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 relative">
      <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-semibold leading-tight text-center mb-4 sm:mb-6">
        Our solutions
      </h1>
      <p className="font-semibold mb-8 sm:mb-12 text-center max-w-3xl text-sm sm:text-base px-4 sm:px-0">
        Create your account quickly with just your email or social media login,
        then explore a wide range
      </p>

      <Link
        to="/tracks"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 w-full cursor-pointer"
      >
        {trackDetails.map((item, cardIndex) => (
          <div
            key={item.id}
            className="w-full min-h-72 sm:h-80 flex flex-col rounded-xl overflow-hidden shadow-sm border border-gray-100 bg-white hover:shadow-md transition-shadow duration-200"
          >
            <div className="h-32 sm:h-40 relative flex items-center justify-center">
              <img
                src={item.image}
                alt="track image"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 sm:top-3 right-2 sm:right-3 bg-white bg-opacity-90 px-2 py-1 rounded-lg text-xs sm:text-sm font-semibold text-gray-800 max-w-[80px] truncate">
                ${item.price}
              </div>
            </div>
            <div className="p-3 sm:p-4 flex-1 flex flex-col">
              <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base line-clamp-2">
                {item.name}
              </h3>
              <div className="flex items-center text-gray-600 text-xs sm:text-sm mb-3">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                {item.duration}
              </div>
              <div className="flex flex-wrap gap-1 sm:gap-2 mt-auto">
                {item.courses.slice(0, 2).map((course, index) => (
                  <span
                    key={index}
                    className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium truncate max-w-[120px] sm:max-w-none ${getCourseColor(
                      cardIndex,
                      index
                    )}`}
                  >
                    {course.title}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </Link>
    </div>
  );
};

export default TrackSection;
