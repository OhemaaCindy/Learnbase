import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const InvoiceTableShimmer = () => {
  // Create array for multiple skeleton rows
  const skeletonRows = Array.from({ length: 5 }, (_, index) => index);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {/* Learners column */}
          <TableHead>
            <Skeleton className="h-4 w-20  dark:bg-blue-200 bg-blue-100" />
          </TableHead>
          {/* Email Address column */}
          <TableHead>
            <Skeleton className="h-4 w-24 bg-blue-100 dark:bg-blue-200" />
          </TableHead>
          {/* Date Joined column */}
          <TableHead>
            <Skeleton className="h-4 w-24 bg-blue-100 dark:bg-blue-200" />
          </TableHead>
          {/* Amount column */}
          <TableHead>
            <Skeleton className="h-4 w-16 bg-blue-100 dark:bg-blue-200" />
          </TableHead>
          {/* Status column */}
          <TableHead className="">
            <Skeleton className="h-4 w-16 bg-blue-100 dark:bg-blue-200" />
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {skeletonRows.map((index) => (
          <TableRow key={index}>
            {/* Learner profile photo and name */}
            <TableCell>
              <div className="flex items-center space-x-3">
                <Skeleton className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-200" />
                <Skeleton className="h-4 w-24 bg-blue-100 dark:bg-blue-200" />
              </div>
            </TableCell>
            {/* Email */}
            <TableCell>
              <Skeleton className="h-4 w-32 bg-blue-100 dark:bg-blue-200" />
            </TableCell>
            {/* Date Joined */}
            <TableCell>
              <Skeleton className="h-4 w-28 bg-blue-100 dark:bg-blue-200" />
            </TableCell>
            {/* Amount */}
            <TableCell>
              <Skeleton className="h-4 w-16 bg-blue-100 dark:bg-blue-200" />
            </TableCell>
            {/* Status */}
            <TableCell>
              <Skeleton className="h-6 w-20 rounded-full bg-blue-100 dark:bg-blue-200" />
            </TableCell>
            {/* Actions */}
            <TableCell>
              <div className="flex items-center justify-end gap-3 ">
                {/* <Skeleton className="h-8 w-16 bg-blue-100 dark:bg-blue-200" /> */}
                <Skeleton className="h-8 w-16 bg-blue-100 dark:bg-blue-200" />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default InvoiceTableShimmer;
