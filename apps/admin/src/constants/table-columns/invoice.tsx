import { type ColumnDef } from "@tanstack/react-table";

import { format } from "date-fns";

import InvoiceImage from "@/components/invoice-table-image";
import type { Invoice, Learner } from "@/types/invoices.types";
import { InvoiceActions } from "@/components/tables/invoice-table";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export const invoiceColumns: ColumnDef<Invoice>[] = [
  {
    id: "learnerName", // 👈 add this
    header: "Learners",
    accessorFn: (row) =>
      `${row.learner?.firstName || ""} ${row.learner?.lastName || ""}`.trim(),
    filterFn: (row, _, filterValue) => {
      const learner = row.original.learner;
      if (!learner || !filterValue) return true;

      const searchValue = filterValue.toLowerCase();
      const firstName = learner.firstName?.toLowerCase() || "";
      const lastName = learner.lastName?.toLowerCase() || "";

      return firstName.includes(searchValue) || lastName.includes(searchValue);
    },
    cell: ({ row }) => {
      const learner: Learner | null = row.original.learner;
      return <InvoiceImage learner={learner} />;
    },
  },

  {
    header: "Emal Address",
    accessorKey: "learner",
    cell: ({ row }) => {
      const learner = row.original.learner;
      return <p>{learner?.email}</p>;
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
  header: "Status",
  accessorKey: "status",
  cell: ({ row }) => {
    const status = row.original.status;

    return (
      <Badge
        className={cn(
          "capitalize",
          status === "paid" && "bg-green-100 text-green-700",
          status === "pending" && "bg-yellow-100 text-yellow-700"
        )}
      >
        {status}
      </Badge>
    );
  },
},

  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      <InvoiceActions row={row} />;
    },
  },
];
