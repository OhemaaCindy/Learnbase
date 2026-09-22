import {
  createInvoice,
  type CreateInvoiceProps,
} from "@/services/invoice-services";
import type { InvoiceResponse } from "@/types/invoices.types";
import type { AuthErrorRes } from "@/types/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useAddInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation<InvoiceResponse, AuthErrorRes, CreateInvoiceProps>({
    mutationFn: createInvoice,
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ["get-all-invoices"] });
    },
  });
};

// export const useUpdateInvoice = () => {
//   const queryClient = useQueryClient();
//   return useMutation<InvoiceResponse, AuthErrorRes, CreateInvoiceProps>({
//     mutationFn: createInvoice,
//     onSuccess() {
//       queryClient.invalidateQueries({ queryKey: ["get-all-invoices"] });
//     },
//   });
// };
