import { InputField } from "./inputs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "./button";
import {
  UpdateInvoiceTypeSchema,
  type AddInvoiceFormData,
  type UpdateInvoiceFormData,
} from "@/schemas/invoice-schema";
import { cn } from "@/lib/utils";
import { useAddInvoice } from "@/hooks/invoice-hook";
import type { Invoice } from "@/types/invoices.types";

interface AddInvoiceFormProps {
  closeModal: (state: boolean) => void;
  learnerDetail: Invoice;
}

const UpdateInvoiceForm = ({ learnerDetail }: AddInvoiceFormProps) => {
  const fullName = `${learnerDetail?.learner?.firstName ?? ""} ${
    learnerDetail?.learner?.lastName ?? ""
  }`.trim();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    // reset,
    // control,
    // setValue,
    // watch,
  } = useForm<UpdateInvoiceFormData>({
    resolver: zodResolver(UpdateInvoiceTypeSchema),
    defaultValues: {
      learner: fullName || "",
      amount: learnerDetail.amount || 0,
      dueDate: learnerDetail.dueDate.toString(),
      status: learnerDetail.status || "",
      // paymentDetails: learnerDetail?.paymentDetails || "",
    },
  });

  // const {
  //   data: learnerDetails,
  //   isLoading: isloadingLearners,
  //   // isError,
  //   // error,
  // } = useQuery<Learner[], Error>({
  //   queryKey: ["get-all-learners"],
  //   queryFn: allLearners,
  // });
  // const learners = learnerDetails || [];

  const {
    // mutate: updateInvoice,
    isPending,
    error,
    isError,
    //  data,
  } = useAddInvoice();

  const onSubmit = (data: AddInvoiceFormData) => {
    console.log(data);
    // updateInvoice(
    //   { ...data },
    //   {
    //     onSuccess(res) {
    //       reset();
    //       closeModal(false);
    //       toast.success("Invoice created successfully");
    //     },
    //     onError() {
    //       toast.error("Failed to create Invoice");
    //     },
    //   }
    // );
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
        <InputField
          label="Learner "
          name="learner"
          type="text"
          register={register}
          error={errors.learner?.message}
          // required
        />

        <InputField
          label="Enter Amount ($)"
          name="amount"
          type="number"
          register={register}
          error={errors.amount?.message}
          // required
        />

        <InputField
          label="Due date"
          name="dueDate"
          type="date"
          register={register}
          error={errors.dueDate?.message}
          // required
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
          // required
        />

        <div className="pt-4">
          <Button
            type="submit"
            disabled={isSubmitting || isPending}
            className="mb-4 cursor-pointer"
          >
            {isSubmitting || isPending
              ? "Updating Invoice..."
              : "Update Invoice"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default UpdateInvoiceForm;
