import { SiteHeader } from "@/components/dashboard/site-header";
import TrackCard from "@/components/track-card";
import { allTracks } from "@/services/track-services";
import type { Error } from "@/types/types";
import { useQuery } from "@tanstack/react-query";

import { Search } from "lucide-react";
import { Fragment } from "react/jsx-runtime";
import type { TrackResponse } from "@/types/track.type";
import { useState } from "react";
import { AddModal } from "@/components/add-modal";
import AddTrackForm from "@/components/add-track-form";
import { ShimmerTrack } from "../components/shimmer-track";

const Track = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [openState, toogleState] = useState(false);

  const { data, isLoading, error, isError } = useQuery<TrackResponse, Error>({
    queryKey: ["get-all-tracks"],
    queryFn: allTracks,
  });

  const trackOverview = data?.tracks || [];

  const filteredTracks = trackOverview.filter((trackname) => {
    return trackname.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="w-full">
      <SiteHeader
        title={"Manage Tracks "}
        description={"Filter, sort, and access detailed tracks"}
      />
      <div className="flex items-center justify-between mb-8 p-6">
        <div className="flex justify-start items-center gap-2 p-2 rounded-md shadow-md w-80">
          <Search size={18} className="text-[#7F7E83]" />

          <input
            type="text"
            placeholder="Search Track"
            className="outline-0 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <AddModal
          text="Add Track"
          title="Add New Track"
          openState={openState}
          toogleState={toogleState}
        >
          <AddTrackForm closeModal={toogleState} />
        </AddModal>
      </div>

      {isError && <div className="p-8 text-red-600">{error.message}</div>}

      <div className="p-8">
        {isLoading ? (
          <ShimmerTrack />
        ) : (
          <div className="grid w-full grid-cols-1 grid-rows-4 gap-6 sm:grid-cols-2 md:grid-cols-2 md:px-0 lg:grid-cols-3 xl:grid-cols-4">
            {filteredTracks && filteredTracks.length === 0 ? (
              <div className="col-span-full text-center text-gray-500 py-8">
                No tracks to show
              </div>
            ) : (
              filteredTracks.map((track, index) => (
                <Fragment key={track._id + index}>
                  <TrackCard track={track} />
                </Fragment>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Track;
