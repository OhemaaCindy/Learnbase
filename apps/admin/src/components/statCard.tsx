import { allInvoice } from "@/services/invoice-services";
import { Invoice } from "@/types/invoices.types";
import { Learner } from "@/types/learners.type";
import { useQuery } from "@tanstack/react-query";

const StatCard = ({ learners }: { learners: Learner[] }) => {
  const { data: invoiceDetails } = useQuery<Invoice[], Error>({
    queryKey: ["get-all-invoices"],
    queryFn: allInvoice,
  });
  const info = invoiceDetails || [];

  const totalRevenue = info.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <>
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-gray-600 text-sm font-medium">Total Learners</h3>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <p className="text-2xl font-bold text-gray-900 mb-1">
              {learners?.length}
            </p>
            <div
              className={`text-sm flex items-center text-green-500 ${
                "positive" as const
              }`}
            >
              <span className="mr-1">↗</span>
              12%
              <span className="text-gray-500 ml-1">vs last month</span>
            </div>
          </div>
          <div className="text-blue-600">
            <img src="/images/learners-img.png" alt="image" className="w-10" />
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-gray-600 text-sm font-medium">Revenue</h3>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <p className="text-2xl font-bold text-gray-900 mb-1">
              ${totalRevenue}
            </p>
            <div
              className={`text-sm flex items-center text-green-500 ${
                "positive" as const
              }`}
            >
              <span className="mr-1">↗</span>
              12%
              <span className="text-gray-500 ml-1">vs last month</span>
            </div>
          </div>
          <div className="text-blue-600">
            <img src="/images/revenue-img.png" alt="image" className="w-10" />
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-gray-600 text-sm font-medium">Invoice</h3>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <p className="text-2xl font-bold text-gray-900 mb-1">
              {info?.length}
            </p>
            <div
              className={`text-sm flex items-center text-green-500 ${
                "positive" as const
              }`}
            >
              <span className="mr-1">↘</span>
              2%
              <span className="text-gray-500 ml-1">vs last month</span>
            </div>
          </div>
          <div className="text-blue-600">
            <img src="/images/invoice-img.png" alt="image" className="w-10" />
          </div>
        </div>
      </div>
    </>
  );
};

export default StatCard;
