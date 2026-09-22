import type { UpdateLearnerFormData } from "@/schemas/learner-schema";
import {
  upateLearner,
  // type UpdateLearnerProps,
} from "@/services/learner-services";
import type { AuthErrorRes } from "@/types/auth.type";
import type { UpdateLearnerResponse } from "@/types/learner.type";
import { useMutation } from "@tanstack/react-query";

export const useUpdateLearner = () => {
  //   const queryClient = useQueryClient();
  return useMutation<
    UpdateLearnerResponse,
    AuthErrorRes,
    UpdateLearnerFormData
  >({
    mutationFn: upateLearner,
    // onSuccess(_, variables) {
    //   // queryClient.invalidateQueries({ queryKey: ["get-all-tracks"] });
    //   queryClient.invalidateQueries({
    //     queryKey: ["get-single-track", variables.id],
    //   });
    // },
  });
};
