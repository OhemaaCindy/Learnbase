import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { allInvoices } from "@/services/learner-services";
import type { InvoiceResponse } from "@/types/learner.type";
import { useQuery } from "@tanstack/react-query";
// import { Eye } from "lucide-react";
import { format } from "date-fns";

export function InvoiceTable() {
  const { data } = useQuery<InvoiceResponse, Error>({
    queryKey: ["get-all-invoices"],
    queryFn: allInvoices,
  });

  const invoiceList = data?.invoices || [];
  // console.log("🚀 ~ InvoiceTable ~ invoiceList:", invoiceList)

  return (
    <div className="max-w-7xl mx-auto ">
      <h1 className="text-2xl font-bold text-gray-900 mb-8 mt-8">
        Past Invoices
      </h1>
      <Table className="bg-white h-full">
        <TableHeader>
          <TableRow>
            {/* <TableHead>#</TableHead> */}
            <TableHead>Date</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoiceList ? (
            invoiceList.map((invoice) => (
              <TableRow key={invoice._id}>
                {/* <TableCell className="font-medium">{invoice._id}</TableCell> */}
                <TableCell>
                  {format(new Date(invoice.updatedAt), "PPP")}
                </TableCell>
                <TableCell>${invoice.amount}</TableCell>
                <TableCell>{invoice.status}</TableCell>
                {/* <TableCell>
                  <Eye />
                </TableCell> */}
              </TableRow>
            ))
          ) : (
            <span>No record to show</span>
          )}
        </TableBody>
        <TableFooter></TableFooter>
      </Table>
    </div>
  );
}
