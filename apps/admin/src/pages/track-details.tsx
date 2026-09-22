import { SiteHeader } from "@/components/dashboard/site-header";
import TrackDetailsCard from "@/components/track-details-card";
import { singleTrack } from "@/services/track-services";
import type { SingleTrackResponse, Track } from "@/types/track.type";
import { useQuery } from "@tanstack/react-query";
import { ChevronsLeft, LoaderCircle } from "lucide-react";
import { useNavigate, useParams } from "react-router";

const TrackDetails = () => {
  const navigate = useNavigate();

  const params = useParams();
  const id = params.id;

  const { data, isLoading } = useQuery<SingleTrackResponse, Error>({
    queryKey: ["get-single-track", id],
    queryFn: () => singleTrack(id as string),
  });

  const details = data?.track;

  const handleBack = () => {
    navigate("/tracks");
  };

  return (
    <div className="flex flex-col">
      <SiteHeader
        title={"Manage Tracks "}
        description={"Filter, sort, and access detailed tracks"}
      />
      <div className="bg-[#8CB4FA] mx-5 w-fit rounded-full p-4 cursor-pointer">
        <span onClick={handleBack}>
          <ChevronsLeft />
        </span>
      </div>
      <div className="flex justify-center w-full  px-40 py-20 ">
        {isLoading ? (
          <div className="flex items-center text-[#15A3DD] ... px-6 py-2 gap-2 rounded-sm">
            <LoaderCircle className="animate-spin" />
          </div>
        ) : (
          <TrackDetailsCard details={details as Track} />
        )}
      </div>
    </div>
  );
};

export default TrackDetails;
