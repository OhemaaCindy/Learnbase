import type { Invoice } from "@/types/invoices.types";
import { UserIcon } from "lucide-react";

const InvoiceList = ({ info }: { info: Invoice[] }) => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">
        Latest Invoice
      </h3>
      <div className="space-y-1">
        <div className="flex justify-between text-xs font-medium text-gray-500 uppercase tracking-wide pb-3">
          <span>Name</span>
          <span>Amount</span>
        </div>
        {info.map((invoice) => (
          <div
            key={invoice._id}
            className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0"
          >
            <div className="flex items-center space-x-3">
              {invoice.learner?.profileImage ? (
                <img
                  src={invoice.learner?.profileImage}
                  alt="invoice.avatar"
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <UserIcon className="h-6 w-6 text-gray-500" />
                </div>
              )}

              <span className="font-medium text-gray-900">
                {`${invoice?.learner?.firstName || "N/A"} ${
                  invoice?.learner?.lastName || "N/A"
                }`}
              </span>
            </div>
            <span className="font-semibold text-gray-900">
              ${invoice?.amount}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InvoiceList;
