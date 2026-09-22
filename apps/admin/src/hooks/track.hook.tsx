import type { AddTrackFormData } from "@/schemas/track-schema";
import {
  createTrack,
  deleteTrack,
  upateTrack,
  type UpdateTrackProps,
} from "@/services/track-services";
import type {
  AddTrackResponse,
  DeleteTrackResponse,
  UpdateTrackResponse,
} from "@/types/track.type";
import type { AuthErrorRes } from "@/types/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useAddTrack = () => {
  const queryClient = useQueryClient();
  return useMutation<AddTrackResponse, AuthErrorRes, AddTrackFormData>({
    mutationFn: createTrack,
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ["get-all-tracks"] });
    },
  });
};

export const useUpdateTrack = () => {
  const queryClient = useQueryClient();
  return useMutation<UpdateTrackResponse, AuthErrorRes, UpdateTrackProps>({
    mutationFn: upateTrack,
    onSuccess(_, variables) {
      // queryClient.invalidateQueries({ queryKey: ["get-all-tracks"] });
      queryClient.invalidateQueries({
        queryKey: ["get-single-track", variables.id],
      });
    },
  });
};

// export const useDeleteTrack = () =>
//   useMutation<DeleteTrackResponse, AuthErrorRes>({
//     mutationFn: (id) => deleteTrack(id),
//   });

// export const useDeleteTrack = () =>
//   useMutation<DeleteTrackResponse, AuthErrorRes>({
//     mutationFn: (id) => deleteTrack(id),
//   });

export const useDeleteTrack = () => {
  const queryClient = useQueryClient();
  return useMutation<DeleteTrackResponse, AuthErrorRes, string>({
    mutationFn: (id) => deleteTrack(id),
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ["get-all-tracks"] });
    },
  });
};
