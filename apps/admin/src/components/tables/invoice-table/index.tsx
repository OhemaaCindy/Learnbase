"use client";

import { useState } from "react";
import {
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type Row,
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
import { AddModal } from "@/components/add-modal";
import AddInvoiceForm from "@/components/add-invoice-form";
import { UpdateModal } from "@/components/update-modal";
import UpdateInvoiceForm from "@/components/update-invoice-form";
import { useQuery } from "@tanstack/react-query";
import { allInvoice } from "@/services/invoice-services";
import type { Invoice } from "@/types/invoices.types";
import InvoiceTableShimmer from "@/components/invoice-table-shimmer";
import { invoiceColumns } from "@/constants/table-columns/invoice";

// export const columns: ColumnDef<Invoice>[] = [
//   {
//     header: "Learners",
//     accessorKey: "profilePhoto",
//     cell: ({ row }) => {
//       const learner: Learner | null = row.original.learner;

//       return <InvoiceImage learner={learner} />;
//     },
//   },

//   {
//     header: "Emal Address",
//     accessorKey: "learner",
//     cell: ({ row }) => {
//       const learner = row.original.learner;
//       return <p>{learner?.email}</p>;
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
//     header: "Status",
//     accessorKey: "status",
//   },
//   {
//     id: "actions",
//     enableHiding: false,
//     cell: ({ row }) => {
//       <InvoiceActions row={row} />;
//     },
//   },
// ];

export const InvoiceActions = ({ row }: { row: Row<Invoice> }) => {
  const [openState, toogleState] = useState(false);
  const learnerDetail = row.original;
  return (
    <div className="flex items-center justify-end gap-3">
      <UpdateModal
        title="Update Invoice"
        openState={openState}
        toogleState={toogleState}
      >
        <UpdateInvoiceForm
          closeModal={toogleState}
          learnerDetail={learnerDetail}
        />
      </UpdateModal>
    </div>
  );
};

export function InvoiceDataTable() {
  const [openState, toogleState] = useState(false);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const { data: invoiceDetails, isLoading: isloadingInvoices } = useQuery<
    Invoice[],
    Error
  >({
    queryKey: ["get-all-invoices"],
    queryFn: allInvoice,
  });
  const info = invoiceDetails || [];

  const table = useReactTable({
    data: info,
    columns: invoiceColumns,
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
      <div className="items-center py-4 flex justify-between">
        <Input
          placeholder="Search by name"
          value={
            (table.getColumn("learnerName")?.getFilterValue() as string) ?? ""
          }
          onChange={(event) =>
            table.getColumn("learnerName")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />

        <div className="">
          <AddModal
            text="Add Invoice"
            title="Add New Invoice"
            openState={openState}
            toogleState={toogleState}
          >
            <AddInvoiceForm closeModal={toogleState} />
          </AddModal>
        </div>
      </div>
      <div className="overflow-hidden rounded-md border">
        {isloadingInvoices ? (
          <InvoiceTableShimmer />
        ) : (
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
                    colSpan={invoiceColumns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
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
