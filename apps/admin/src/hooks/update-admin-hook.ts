// import type { UpdateLearnerFormData } from "@/schemas/auth-schema";
import { upateAdmin } from "@/services/update-admin-services";
import type { AuthErrorRes, UpdateLearnerResponse } from "@/types/types";
import { useMutation } from "@tanstack/react-query";
import type { UpdateAdminFormData } from "@/schemas/auth-schema";

export const useUpdateAdmin = () => {
  //   const queryClient = useQueryClient();
  return useMutation<UpdateLearnerResponse, AuthErrorRes, UpdateAdminFormData>({
    mutationFn: upateAdmin,
    // onSuccess(_, variables) {
    //   // queryClient.invalidateQueries({ queryKey: ["get-all-tracks"] });
    //   queryClient.invalidateQueries({
    //     queryKey: ["get-single-track", variables.id],
    //   });
    // },
  });
};
