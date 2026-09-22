import { type ColumnDef } from "@tanstack/react-table";

import type { Course } from "@/types/courses.types";
import { format } from "date-fns";
import { CourseActions } from "@/components/tables/courses-table";

export const courseColumns: ColumnDef<Course>[] = [
  {
    header: "Courses",
    accessorKey: "title",
  },
  {
    header: "Tracks",
    accessorKey: "track",
    cell: ({ row }) => {
      const track = row.original.track;
      return <p>{track?.name}</p>;
    },
  },

  {
    header: "Date Joined",
    accessorKey: "admin",
    cell: ({ row }) => {
      const admin = row.original.createdAt;
      return <p>{format(new Date(admin), "do MMMM, yyyy")}</p>;
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      <CourseActions row={row} />;
    },
  },
];
