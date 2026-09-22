import type { Track } from "@/types/track.type";
import { Star } from "lucide-react";

const SummarySection = ({ details }: { details: Track }) => {
  // console.log("🚀 ~ SummarySection ~ details:", details);
  return (
    <>
      <div className=" text-white py-3 sm:py-4">
        <nav className="flex items-center space-x-2 text-xs sm:text-sm justify-center md:justify-start">
          <a href="/" className="hover:text-blue-200 truncate">
            Home
          </a>
          <span className="text-blue-300 flex-shrink-0">›</span>
          <a href="/tracks" className="hover:text-blue-200 truncate">
            Tracks
          </a>
          <span className="text-blue-300 flex-shrink-0">›</span>
          <span className="font-medium truncate"> {details?.name}</span>
        </nav>
      </div>

      {/* Hero Section */}
      <div className=" text-white">
        <div className=" py-8 sm:py-12">
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 items-center">
            <div className="flex flex-col ">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 text-center md:text-start">
                {details?.name}
              </h1>
              <p className="text-base sm:text-lg text-blue-100 mb-6 sm:mb-8 leading-relaxed text-center md:text-start">
                {details?.description}
              </p>

              <div className="self-center md:self-start flex flex-col sm:flex-row sm:items-center sm:space-x-8 space-y-4 sm:space-y-0 text-sm">
                <div className="flex items-center gap-4 md:gap-2 self-center md:flex-col md:items-start">
                  <p className="text-blue-200">Instructor</p>
                  <p className="font-semibold">{details?.instructor}</p>
                </div>
                <div className="flex items-center gap-4 md:gap-2 self-center md:flex-col md:items-start">
                  <p className="text-blue-200">Enrolled students</p>
                  <p className="font-semibold">50</p>
                </div>
                <div className="flex items-center gap-4 md:gap-2 self-center md:flex-col md:items-start">
                  <span className="text-blue-200">1 review</span>
                  <div className="flex items-center space-x-1 mt-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <Star className="w-4 h-4 text-gray-300" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SummarySection;
