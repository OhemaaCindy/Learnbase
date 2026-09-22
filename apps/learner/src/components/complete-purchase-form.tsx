import { useLearnerEnrollment } from "@/hooks/learner-auth-hook";
import { cn } from "@/lib/utils";
import {
  CheckoutSchema,
  type CheckoutFormData,
} from "@/schemas/learner-schema";
import { zodResolver } from "@hookform/resolvers/zod/src/zod.js";
import { ChevronRight, LoaderCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

interface PurchaseProps {
  trackId: string;
  trackAmount: number;
}
const CompletePurhase = ({ trackId, trackAmount }: PurchaseProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(CheckoutSchema),
  });

  const {
    mutate: checkoutLearner,
    isPending,
    error,
    isError,
    
  } = useLearnerEnrollment();

  const onSubmit = (data: CheckoutFormData) => {
    checkoutLearner(
      {
        paystackCallbackUrl: `${import.meta.env.VITE_CLIENT_URL}/dashboard`,
        track: trackId,
        ...data,
      },
      {
        onSuccess: (res) => {
          toast.success("Enrollment successful");
          localStorage.setItem("trackId", trackId);

          window.location.href = res.transactionUrl;
        },
        onError: (error) => {
          toast.error(
            error instanceof Error ? error.message : "Something went wrong"
          );
          console.log(error);
        },
      }
    );
  };

  return (
    <div>
      {isError && error && (
        <ul className="text-rose-500 mt-2 bg-rose-100 border border-rose-500 rounded-lg px-8 py-2 list-disc mb-2">
          {error.errors.map((err, index) => (
            <li key={index}>{err.message}</li>
          ))}
        </ul>
      )}

      {/* {data && data.success && (
        <p className="text-green-600 mt-2">{data.message}</p>
      )} */}
      <div className=" rounded-lg shadow-sm border border-gray-200 p-6 sticky top-4  ">
        <div className="text-center mb-6 ">
          <div className="text-3xl font-bold text-gray-900 mb-2">
            $ {trackAmount} USD
          </div>
        </div>

        <div className="mb-6">
          <form onSubmit={handleSubmit(onSubmit)}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select amount
            </label>
            <div className="mb-4 w-full">
              <select
                {...register("amount", { valueAsNumber: true })}
                name="amount"
                className={cn(
                  "w-full h-10   border rounded-md shadow-sm overflow-y-auto p-2",
                  errors.amount && "border-red-500 bg-red-50"
                )}
              >
                <option value={50}>$50</option>
                <option value={100}>$100</option>
                <option value={150}>$150</option>
                <option value={200}>$200</option>
                <option value={250}>$250</option>
                <option value={300}>$300</option>
                <option value={350}>$350</option>
                <option value={400}>$400</option>
                <option value={450}>$450</option>
                <option value={500}>$500</option>
              </select>
              {errors.amount && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.amount.message}
                </p>
              )}
            </div>
            <button
              type="submit"
              className="w-full bg-[#01589A] hover:bg-blue-300 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 cursor-pointer"
              //   onClick={handleEnrollment}
              disabled={isSubmitting || isPending}
            >
              {isSubmitting || isPending ? (
                <span className="animate-spin text-white flex items-center justify-center">
                  <LoaderCircle />
                </span>
              ) : (
                <span className="flex items-center gap-5">
                  Complete my purchase
                  <ChevronRight className="h-5 w-5" />
                </span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CompletePurhase;
