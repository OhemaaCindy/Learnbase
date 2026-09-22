import type { Track } from "@/types/track.type";
import { useNavigate } from "react-router";

interface TrackProps {
  track: Track;
}
export const CourseCard = ({ track }: TrackProps) => {
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <span key={i} className="text-yellow-400">
          ★
        </span>
      );
    }

    if (hasHalfStar) {
      stars.push(
        <span key="half" className="text-yellow-400">
          ★
        </span>
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <span key={`empty-${i}`} className="text-gray-300">
          ☆
        </span>
      );
    }

    return stars;
  };

  const navigate = useNavigate();

  const handleNavigation = (id: string) => {
    navigate(`/track/${id}`);
  };
  return (
    <div
      // to={`${track._id}`}
      className="max-w-sm w-full h-[500px] rounded-lg shadow-md overflow-hidden mx-auto"
    >
      {/* Course Image/Icon Section */}
      <div className="h-60 flex items-center justify-center relative">
        <div className="relative w-full h-full">
          <img
            src={track?.image}
            alt="track image"
            className="h-full w-full object-cover"
          />
        </div>
      </div>

      {/* Course Content */}
      <div className="p-6 flex flex-col justify-between h-[calc(500px-240px)]">
        <div>
          <h3 className="text-xl font-semibold text-gray-800 mb-3">
            {track?.name}
          </h3>
          <p className="text-gray-600 text-sm mb-4 leading-relaxed line-clamp-3">
            {track?.description}
          </p>
        </div>

        {/* Rating and Price */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="flex">{renderStars(4.0)}</div>
              <span className="text-gray-700 font-medium">4.0</span>
            </div>
            <div className="text-right">
              <span className="text-gray-500 text-sm">Price: </span>
              <span className="text-gray-800 font-semibold">
                ${track?.price}
              </span>
            </div>
          </div>

          {/* Preview Button */}
          <button
            className="w-full bg-[#01589A] hover:bg-blue-400 cursor-pointer text-white py-3 px-4 rounded-md font-medium transition-colors duration-200"
            onClick={() => handleNavigation(track._id)}
          >
            Preview course
          </button>
        </div>
      </div>
    </div>
  );
};
