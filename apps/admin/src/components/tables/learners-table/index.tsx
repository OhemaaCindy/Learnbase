"use client";

import * as React from "react";
import {
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { allLearners } from "@/services/learner-services";
import { useQuery } from "@tanstack/react-query";
import type { Learner } from "@/types/learners.type";
import LearnerTableShimmer from "@/components/learner-shimmer";
import { learnerColumns } from "@/constants/table-columns/learner";

// export const learnerColumns: ColumnDef<Learner>[] = [
//   {
//     header: "Learners",
//     accessorKey: "profilePhoto",
//     cell: ({ row }) => <ImageAndName learner={row.original} />,
//   },

//   {
//     header: "Courses",
//     accessorKey: "course",
//     cell: ({ row }) => {
//       const learner = row.original.course || "N/A";
//       return <p>{learner}</p>;
//     },
//   },
//   {
//     header: "Date Joined",
//     accessorKey: "dateJoined",
//     cell: ({ row }) => {
//       const learner = row.original.createdAt;
//       return <p>{format(new Date(learner), "do MMMM, yyyy")}</p>;
//     },
//   },

//   {
//     header: "Amount",
//     accessorKey: "amount",
//     cell: ({ row }) => {
//       return <div className="">${row.original?.amount || "0.0"}</div>;
//     },
//   },
//   {
//     header: "Gender",
//     accessorKey: "learner",
//     cell: ({ row }) => {
//       const learner = row.original.gender || "N/A";
//       return <p>{learner}</p>;
//     },
//   },
//   {
//     id: "actions",
//     enableHiding: false,
//     cell: ({ row }) => {
//       return (
//         <ViewProfileModal>
//           <LearnerProfile id={row.original._id} />
//         </ViewProfileModal>
//       );
//     },
//   },
// ];

export function LearnersDataTable() {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const { data: learnerDetails, isLoading: isloadingLearners } = useQuery<
    Learner[],
    Error
  >({
    queryKey: ["get-all-learners"],
    queryFn: allLearners,
  });
  const learners = learnerDetails || [];
  console.log("🚀 ~ LearnersDataTable ~ learners:", learners);

  const table = useReactTable({
    data: learners,
    columns: learnerColumns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  return (
    <div className="w-full ">
      <div className="py-4 ">
        <Input
          placeholder="Filter emails..."
          value={
            (table.getColumn("learnerName")?.getFilterValue() as string) ?? ""
          }
          onChange={(event) =>
            table.getColumn("learnerName")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
      </div>
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          {isloadingLearners ? (
            <LearnerTableShimmer />
          ) : (
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={learnerColumns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          )}
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="text-muted-foreground flex-1 text-sm">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
