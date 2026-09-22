import { SiteHeader } from "@/components/dashboard/site-header";
import { CoursesDataTable } from "@/components/tables/courses-table";

const Courses = () => {
  return (
    <div>
      <SiteHeader
        title={"Manage Courses"}
        description={"Filter, sort, and access detailed courses "}
      />
      <div className="px-6">
        <CoursesDataTable />
      </div>
    </div>
  );
};

export default Courses;
