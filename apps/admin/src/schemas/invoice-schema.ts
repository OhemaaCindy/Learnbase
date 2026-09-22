import z from "zod";

export const AddInvoiceTypeSchema = z.object({
  learner: z.string().min(1, "Please select learner "),
  amount: z.number(),
  dueDate: z.string().min(1, "Enter due date"),
  // paystackCallbackUrl: z.string(),
  paymentDetails: z.string().min(1, "Enter payment details"),
  status: z.string().min(1, "Select status"),
});
export type AddInvoiceFormData = z.infer<typeof AddInvoiceTypeSchema>;

export const UpdateInvoiceTypeSchema = z.object({
  learner: z.string().min(1, "Please select learner "),
  amount: z.number(),
  dueDate: z.string().min(1, "Enter due date"),
  // paystackCallbackUrl: z.string(),
  paymentDetails: z.string().min(1, "Enter payment details"),
  status: z.string().min(1, "Select status"),
});
export type UpdateInvoiceFormData = z.infer<typeof UpdateInvoiceTypeSchema>;
