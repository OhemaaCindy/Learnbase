import type { Learner } from "@/types/invoices.types";
import { User } from "lucide-react";

interface Details {
  learner: Learner | null;
}

const InvoiceImage = ({ learner }: Details) => {
  if (!learner) return;

  return (
    <div className="flex items-center gap-3">
      {learner?.profileImage ? (
        <img
          src={learner?.profileImage}
          alt="photo"
          className="w-12 h-12 rounded-full object-cover"
        />
      ) : (
        <div
          className={`w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center `}
        >
          <User className="w-6 h-6 text-gray-500" />
        </div>
      )}

      <span className="font-medium text-sm">{`${learner?.firstName} ${learner?.lastName}`}</span>
    </div>
  );
};

export default InvoiceImage;
