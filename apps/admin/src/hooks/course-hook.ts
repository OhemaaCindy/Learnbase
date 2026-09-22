import type {
  AddCourseFormData,
  UpdateCourseFormData,
} from "@/schemas/course-schema";
import {
  createCourse,
  deleteCourse,
  upateCourse,
} from "@/services/courses-services";
import type {
  AddCoursesResponse,
  DeleteCourseResponse,
  UpdateCourseResponse,
} from "@/types/courses.types";
import type { AuthErrorRes } from "@/types/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useAddCourse = () => {
  const queryClient = useQueryClient();
  return useMutation<AddCoursesResponse, AuthErrorRes, AddCourseFormData>({
    mutationFn: createCourse,
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ["get-all-courses"] });
    },
  });
};

export const useDeleteCourse = () => {
  const queryClient = useQueryClient();
  return useMutation<DeleteCourseResponse, AuthErrorRes, string>({
    mutationFn: (id) => deleteCourse(id),
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ["get-all-courses"] });
    },
  });
};

interface courseProps {
  id: string;
  payload: UpdateCourseFormData;
}
export const useUpdateCourse = () => {
  const queryClient = useQueryClient();
  return useMutation<UpdateCourseResponse, AuthErrorRes, courseProps>({
    mutationFn: ({ id, payload }) => upateCourse({ id, payload }),
    onSuccess() {
      // queryClient.invalidateQueries({ queryKey: ["get-all-tracks"] });
      queryClient.invalidateQueries({
        queryKey: ["get-all-courses"],
      });
    },
  });
};
