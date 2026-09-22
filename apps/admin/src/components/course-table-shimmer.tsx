import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const CourseTableShimmer = () => {
  // Create array for multiple skeleton rows
  const skeletonRows = Array.from({ length: 4 }, (_, index) => index);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {/* Course column */}
          <TableHead>
            <Skeleton className="h-4 w-20  dark:bg-blue-200 bg-blue-100" />
          </TableHead>
          {/* Tracks column */}
          <TableHead>
            <Skeleton className="h-4 w-24 bg-blue-100 dark:bg-blue-200" />
          </TableHead>
          {/* Date Joined column */}
          <TableHead>
            <Skeleton className="h-4 w-24 bg-blue-100 dark:bg-blue-200" />
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {skeletonRows.map((index) => (
          <TableRow key={index}>
            {/* Course  name */}
            <TableCell>
              <Skeleton className="h-4 w-24 bg-blue-100 dark:bg-blue-200" />
              {/* </div> */}
            </TableCell>
            {/* Tracks */}
            <TableCell>
              <Skeleton className="h-4 w-32 bg-blue-100 dark:bg-blue-200" />
            </TableCell>
            {/* Date Joined */}
            <TableCell>
              <Skeleton className="h-4 w-28 bg-blue-100 dark:bg-blue-200" />
            </TableCell>

            <TableCell>
              <div className="flex items-center justify-end gap-3 ">
                <Skeleton className="h-8 w-16 bg-blue-100 dark:bg-blue-200" />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default CourseTableShimmer;
