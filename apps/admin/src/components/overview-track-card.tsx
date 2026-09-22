import type { TrackCardColors } from "@/pages/overview";
import type { Track } from "@/types/track.type";
import { Calendar } from "lucide-react";

const OverviewTrackCard = ({
  track,
  trackColors,
}: {
  track: Track;
  trackColors: TrackCardColors;
}) => {
  return (
    <div className=" rounded-xl overflow-hidden shadow-sm border border-gray-100 bg-white">
      <div className={`h-32  relative flex items-center justify-center`}>
        <img
          src={track?.image}
          alt="track image"
          className="w-full h-full object-cover"
        />
        <div className="absolute top-3 right-3 bg-white bg-opacity-90 px-2 py-1 rounded-lg text-sm font-semibold text-gray-800">
          ${track?.price}
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2">{track?.name}</h3>
        <div className="flex items-center text-gray-600 text-sm mb-3">
          <Calendar className="w-4 h-4 mr-1" />
          {track?.duration}
        </div>
        <div className="flex gap-2">
          {track?.courses?.map((course, idx) => {
            const colors = trackColors[idx];
            return (
              <span
                key={course._id}
                className="px-2 py-1 text-xs rounded-md font-medium"
                style={{ backgroundColor: colors?.light, color: colors?.deep }}
              >
                {course?.title}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default OverviewTrackCard;
