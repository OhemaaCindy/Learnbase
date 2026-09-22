import { SiteHeader } from "@/components/dashboard/site-header";
import { InvoiceDataTable } from "@/components/tables/invoice-table";

const Invoices = () => {
  return (
    <div>
      <SiteHeader
        title={"Manage invoices"}
        description={"Filter, sort, and access detailed invoices"}
      />

      <div className="px-6">
        <InvoiceDataTable />
      </div>
    </div>
  );
};

export default Invoices;
