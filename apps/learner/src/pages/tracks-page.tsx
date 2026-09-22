import { ShimmerTrack } from "@/components/shimmer-tracks";
import { CourseCard } from "@/components/track-cards";
import { allTracks } from "@/services/track-services";
import type { TrackResponse } from "@/types/track.type";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useState } from "react";

const TracksPage = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const { data, isLoading } = useQuery<TrackResponse, Error>({
    queryKey: ["get-all-tracks"],
    queryFn: allTracks,
  });

  const trackOverview = data?.tracks || [];

  const filteredTracks = trackOverview.filter((trackname) => {
    return trackname?.name.toLowerCase().includes(searchTerm.toLowerCase());
  });
  

  return (
    <div className="bg-[#02589A]">
      <div className=" max-w-7xl mx-auto  text-white p-10 flex justify-center ">
        <div className="text-3xl font-medium">Tracks</div>
      </div>
      <div className="min-h-screen bg-gray-50 py-8 ">
        <div className="max-w-7xl mx-auto ">
          {/* Search Bar */}
          <div className="mb-8">
            <div className="relative max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search Track"
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-300 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Page Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Top Tracks</h1>
          {isLoading && (
            <div className="min-h-screen bg-gray-50 py-8">
              <div className="max-w-7xl mx-auto ">
                {/* <h1 className="text-3xl font-bold text-gray-900 mb-8">
                  Top Tracks
                </h1> */}
                <ShimmerTrack />
              </div>
            </div>
          )}
          {!isLoading && filteredTracks && filteredTracks.length === 0 ? (
            <div>No track to show</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredTracks.map((track, index) => (
                <CourseCard key={index} track={track} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TracksPage;
