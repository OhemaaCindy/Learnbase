import { SiteHeader } from "@/components/dashboard/site-header";
import LearnerReportPage from "@/components/learner-report";

const Report = () => {
  return (
    <div>
      <div>
        <SiteHeader
          title={"Manage Reports"}
          description={"Filter, sort, and access detailed report "}
        />
        <LearnerReportPage />
      </div>
    </div>
  );
};

export default Report;
