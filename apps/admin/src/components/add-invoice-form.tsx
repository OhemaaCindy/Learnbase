import { InputField } from "./inputs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "./button";
import { useQuery } from "@tanstack/react-query";
import type { Learner } from "@/types/learners.type";
import { allLearners } from "@/services/learner-services";
import {
  AddInvoiceTypeSchema,
  type AddInvoiceFormData,
} from "@/schemas/invoice-schema";
import { cn } from "@/lib/utils";
import { useAddInvoice } from "@/hooks/invoice-hook";
import toast from "react-hot-toast";

interface AddInvoiceFormProps {
  closeModal: (state: boolean) => void;
}

const AddInvoiceForm = ({ closeModal }: AddInvoiceFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,

    watch,
  } = useForm<AddInvoiceFormData>({
    resolver: zodResolver(AddInvoiceTypeSchema),
  });

  console.log({ url: import.meta.env.VITE_CLIENT_URL });
  const id = watch("learner");
  console.log("Selected ID:", id);

  const { data: learnerDetails, isLoading: isloadingLearners } = useQuery<
    Learner[],
    Error
  >({
    queryKey: ["get-all-learners"],
    queryFn: allLearners,
  });
  const learners = learnerDetails || [];
  

  const { mutate: addInvoice, isPending, error, isError } = useAddInvoice();

  const onSubmit = (data: AddInvoiceFormData) => {
    const payload =  {
       ...data,
        paystackCallbackUrl: `${import.meta.env.VITE_CLIENT_URL}/payment`,
       
    }
   
    addInvoice(
     payload,
      {
        onSuccess() {
          reset();
          closeModal(false);
          toast.success("Invoice created successfully");
        },
        onError() {
          toast.error("Failed to create Invoice");
        },
      }
    );
  };

  return (
    <div>
      {isError && error && (
        <ul className="text-rose-500 mt-2 bg-rose-100 border border-rose-500 rounded-lg px-8 py-2 list-disc">
          {error.errors.map((err, index) => (
            <li key={index}>{err.message}</li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        {isloadingLearners ? (
          <Shimmer />
        ) : (
          <>
            <select
              {...register("learner")}
              className={cn(
                "w-full px-3 py-2 border rounded-md shadow-sm overflow-y-auto ",
                errors.learner && "border-red-500 bg-red-50"
              )}
            >
              <option value="">Select a learner</option>
              {learners?.map((learner) => (
                <option key={learner._id} value={learner._id}>
                  {`${learner.firstName} ${learner.lastName}`}
                </option>
              ))}
            </select>
            {errors.learner && (
              <p className="text-red-500 text-sm mt-1">
                {errors.learner.message}
              </p>
            )}
          </>
        )}
        <InputField
          label="Enter Amount ($)"
          name="amount"
          type="number"
          register={register}
          error={errors.amount?.message}
          required
        />

        <InputField
          label="Due date"
          name="dueDate"
          type="date"
          register={register}
          error={errors.dueDate?.message}
          required
        />

         <select
          {...register("status")}
          className={cn(
            "w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500",
            "border-gray-300",
            errors.status && "border-red-500 bg-red-50"
          )}
        >
          <option value="">Select status</option>

          <option value={"pending"}>Pending</option>
          <option value={"paid"}>Paid</option>
          <option value={"unpaid"}>UnPaid</option>
        </select>

        <InputField
          label="Payment Details"
          name="paymentDetails"
          type="text"
          register={register}
          error={errors.paymentDetails?.message}
        /> 

        <div className="pt-4">
          <Button
            type="submit"
            disabled={isSubmitting || isPending}
            className="mb-4 cursor-pointer"
          >
            {isSubmitting || isPending
              ? "Creating Invoice..."
              : "Create Invoice"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddInvoiceForm;
const Shimmer = () => (
  <div className="animate-pulse">
    <div className="w-full px-3 py-2 border rounded-md shadow-sm bg-blue-100 dark:bg-blue-200">
      <div className="h-5 bg-blue-100 dark:bg-blue-200 rounded w-full"></div>
    </div>
  </div>
);
