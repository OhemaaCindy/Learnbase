import { type ColumnDef } from "@tanstack/react-table";

import { ViewProfileModal } from "@/components/view-profile-modal";
import LearnerProfile from "@/components/learner-profile-view";
import type { Learner } from "@/types/learners.type";
import ImageAndName from "@/components/learner-image-and-name";
import { format } from "date-fns";

export const learnerColumns: ColumnDef<Learner>[] = [
  // {
  //   header: "Learners",
  //   accessorKey: "profilePhoto",
  //   cell: ({ row }) => <ImageAndName learner={row.original} />,
  // },
  {
    id: "learnerName", // 👈 add this
    header: "Learners",
    accessorFn: (row) =>
      `${row?.firstName || ""} ${row?.lastName || ""}`.trim(),
    filterFn: (row, _, filterValue) => {
      const learner = row.original;
      if (!learner || !filterValue) return true;

      const searchValue = filterValue.toLowerCase();
      const firstName = learner.firstName?.toLowerCase() || "";
      const lastName = learner.lastName?.toLowerCase() || "";

      return firstName.includes(searchValue) || lastName.includes(searchValue);
    },
    cell: ({ row }) => {
      const learner: Learner | null = row.original;
      return <ImageAndName learner={learner} />;
    },
  },
  {
    header: "Courses",
    accessorKey: "course",
    cell: ({ row }) => {
      const learner = row.original.course || "N/A";
      return <p>{learner}</p>;
    },
  },
  {
    header: "Date Joined",
    accessorKey: "dateJoined",
    cell: ({ row }) => {
      const learner = row.original.createdAt;
      return <p>{format(new Date(learner), "do MMMM, yyyy")}</p>;
    },
  },

  {
    header: "Amount",
    accessorKey: "amount",
    cell: ({ row }) => {
      return <div className="">${row.original?.amount || "0.0"}</div>;
    },
  },
  {
    header: "Gender",
    accessorKey: "learner",
    cell: ({ row }) => {
      const learner = row.original.gender || "N/A";
      return <p>{learner}</p>;
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      return (
        <ViewProfileModal>
          <LearnerProfile id={row.original._id} />
        </ViewProfileModal>
      );
    },
  },
];
