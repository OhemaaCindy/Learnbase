import type { Track } from "@/types/track.type";
import { Calendar, User } from "lucide-react";
import { Link } from "react-router";
import { Fragment } from "react";

export default function TrackCard({ track }: { track: Track }) {
  const courses = track?.courses || [];
  return (
    <Link
      to={`${track._id}`}
      className="inline-block h-[420px] rounded-2xl shadow-lg overflow-x-hidden relative group"
    >
      {/* Shimmer overlay */}
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full transition-transform duration-1000 ease-in-out z-10 pointer-events-none"></div>

      <div className="w-full h-full flex flex-col">
        <div className="relative flex-3/4 w-full  overflow-hidden">
          <img
            src={track?.image}
            alt="track image"
            className="h-full w-full object-cover"
          />
          <div className="absolute top-4 right-4 bg-white bg-opacity-90 backdrop-blur-sm rounded-3xl px-3 py-1">
            <span className="text-gray-800 font-semibold text-md">
              ${track?.price}
            </span>
          </div>
        </div>

        <div className="p-6 flex-auto flex flex-col   h-full">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            {track?.name}
          </h2>

          <p className="text-gray-600 text-base leading-relaxed truncate">
            {track?.description}
          </p>

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 text-gray-500">
              <Calendar size={18} />
              <span className="text-sm">{track?.duration}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-500">
              <User size={18} />
              <span className="text-sm">{track?.instructor}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-auto ">
            {courses.map((course) => {
              return (
                <Fragment key={course._id}>
                  <span className="px-4 py-1 bg-red-50 text-red-600 rounded-full text-sm font-medium border border-red-100">
                    {course.title}
                  </span>
                </Fragment>
              );
            })}
          </div>
        </div>
      </div>
    </Link>
  );
}
