import React, { Fragment } from "react";
import StatCard from "@/components/statCard";
import RevenueChart from "@/components/revenue-chart";
import InvoiceList from "@/components/invoice-list";
import { SiteHeader } from "@/components/dashboard/site-header";
import OverviewTrackCard from "@/components/overview-track-card";
import { useQuery } from "@tanstack/react-query";
import type { TrackResponse } from "@/types/track.type";
import { allTracks } from "@/services/track-services";
import type { Invoice } from "@/types/invoices.types";
import { allInvoice } from "@/services/invoice-services";
import { Button } from "@/components/ui/button";
import { Link } from "react-router";
import { Skeleton } from "@/components/ui/skeleton";
import { allLearners } from "@/services/learner-services";
import { Learner } from "@/types/learners.type";

interface RevenueData {
  month: string;
  value: number;
}

export type TrackCardColors = { light?: string; deep?: string }[];

const Overview: React.FC = () => {
  const revenueData: RevenueData[] = [
    { month: "Jan", value: 2200 },
    { month: "Feb", value: 1800 },
    { month: "Mar", value: 3200 },
    { month: "Apr", value: 2800 },
    { month: "May", value: 2900 },
    { month: "Jun", value: 2600 },
  ];
  const { data: learnerDetails } = useQuery<Learner[], Error>({
    queryKey: ["get-all-learners"],
    queryFn: allLearners,
  });
  const learners = learnerDetails || [];

  const { data, isLoading: isloadingTacks } = useQuery<TrackResponse, Error>({
    queryKey: ["get-all-tracks"],
    queryFn: allTracks,
  });

  const trackDetails = data?.tracks || [];

  const trackCardColors: TrackCardColors[] = [
    [
      { light: "#ECFDF3", deep: "#027A48" },
      { light: "#F3F0FB", deep: "#6941C6" },
    ],
    [
      { light: "#F0F9FF", deep: "#026AA2" },
      { light: "#F8F9FC", deep: "#5A628C" },
    ],
    [
      { light: "#F7EDF6", deep: "#C11574" },
      { light: "#E9F3FB", deep: "#175CD3" },
    ],
    [
      { light: "#FFF4ED", deep: "#B93815" },
      { light: "#FFF1F3", deep: "#C01048" },
    ],
    [
      { light: "#F3F0FB", deep: "#827D08" },
      { light: "#F3F0FB", deep: "#6941C6" },
    ],
    [
      { light: "#555555", deep: "#146111" },
      { light: "#F3F0FB", deep: "#6941C6" },
    ],
  ];

  const { data: invoiceDetails, isLoading: isloadingInvoices } = useQuery<
    Invoice[],
    Error
  >({
    queryKey: ["get-all-invoices"],
    queryFn: allInvoice,
  });
  const info = invoiceDetails?.slice(0, 4) || [];

  return (
    <>
      <SiteHeader
        title="Welcome Admin 👋"
        description="Track activity, trends, and popular destinations in real time"
      />
      <div className="min-h-screen  p-6 ">
        <div className="">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 ">
            <StatCard learners={learners} />
          </div>

          {/* Tracks Section */}
          <div className="mb-8 ">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Tracks
              </h2>
              <Button variant={"ghost"} asChild>
                <Link to={"/tracks"}>View more</Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {isloadingTacks ? (
                <CardSkeleton />
              ) : (
                trackDetails.slice(0, 4).map((track, index) => {
                  const trackColors = trackCardColors?.[index];

                  return (
                    <Fragment key={track._id + index}>
                      <OverviewTrackCard
                        track={track}
                        trackColors={trackColors}
                      />
                    </Fragment>
                  );
                })
              )}
            </div>
          </div>

          {/* Bottom Section */}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RevenueChart data={revenueData} />

            {isloadingInvoices ? (
              <InvoiceSkeleton />
            ) : (
              <InvoiceList info={info} />
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Overview;

const CardSkeleton = () => {
  const items = [...Array(4)];
  return (
    <>
      {items.map((_, i) => (
        <Skeleton
          key={i}
          className="h-60 w-full  bg-blue-100 dark:bg-blue-200"
        />
      ))}
    </>
  );
};

const InvoiceSkeleton = () => {
  return (
    <>
      <Skeleton className=" w-full  bg-blue-100 dark:bg-blue-200" />
    </>
  );
};
