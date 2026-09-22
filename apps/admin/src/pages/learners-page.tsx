import { SiteHeader } from "@/components/dashboard/site-header";
import { LearnersDataTable } from "@/components/tables/learners-table";

const Learners = () => {
  return (
    <div>
      <SiteHeader
        title={"Manage learners"}
        description={"Filter, sort, and access detailed learner profiles"}
      />
      <div className="px-6">
        <LearnersDataTable />
      </div>
    </div>
  );
};

export default Learners;
