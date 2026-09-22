import { apiEndpoints } from "@/constants/api-endpoints";
import { axiosClient } from "@/lib/axios";
import type {
  AddCourseFormData,
  UpdateCourseFormData,
} from "@/schemas/course-schema";
import type {
  AddCoursesResponse,
  Course,
  CoursesResponse,
  DeleteCourseResponse,
  SingleCourseResponse,
  UpdateCourseResponse,
} from "@/types/courses.types";
import type { AuthErrorRes } from "@/types/types";
import axios from "axios";

export const allCourses = async (): Promise<Course[]> => {
  try {
    const response = await axiosClient.get<CoursesResponse>(
      apiEndpoints.COURSES.getAllCourses
    );
    return response.data.courses;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw error.response.data as AuthErrorRes;
    }
    throw {
      success: false,
      errors: [{ message: "Something went wrong" }],
    } as AuthErrorRes;
  }
};

export const singleCourse = async (
  id: string
): Promise<SingleCourseResponse> => {
  try {
    const response = await axiosClient.get<SingleCourseResponse>(
      apiEndpoints.COURSES.getSingleCourse(id)
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw error.response.data as AuthErrorRes;
    }
    throw {
      success: false,
      errors: [{ message: "Something went wrong" }],
    } as AuthErrorRes;
  }
};

export const createCourse = async (
  payload: AddCourseFormData
): Promise<AddCoursesResponse> => {
  const { title, image, track, description } = payload;

  const formData = new FormData();
  formData.append("title", title);
  formData.append("track", track);
  formData.append("description", description);
  formData.append("image", image);

  try {
    const response = await axiosClient.post<AddCoursesResponse>(
      apiEndpoints.COURSES.createCourse,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw error.response.data as AuthErrorRes;
    }
    throw {
      success: false,
      errors: [{ message: "Something went wrong" }],
    } as AuthErrorRes;
  }
};

export interface UpdateCourseProps {
  id: string;
  payload: UpdateCourseFormData;
}
export const upateCourse = async ({
  id,
  payload,
}: UpdateCourseProps): Promise<UpdateCourseResponse> => {
  const formData = new FormData();

  // Append only non-empty string values
  if (payload.track) formData.append("track", payload.track);
  if (payload.title) formData.append("title", payload.title);
  // if (payload.image) formData.append("image", payload.image);
  if (payload.description) formData.append("description", payload.description);

  // Append image only if it's a File instance
  if (payload.image instanceof File) {
    formData.append("image", payload.image);
  }

  try {
    const response = await axiosClient.put<UpdateCourseResponse>(
      apiEndpoints.COURSES.updateCourse(id),
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw error.response.data as AuthErrorRes;
    }
    throw {
      success: false,
      errors: [{ message: "Something went wrong" }],
    } as AuthErrorRes;
  }
};

export const deleteCourse = async (
  id: string
): Promise<DeleteCourseResponse> => {
  try {
    const response = await axiosClient.delete<DeleteCourseResponse>(
      apiEndpoints.COURSES.deleteCourse(id)
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw error.response.data as AuthErrorRes;
    }
    throw {
      success: false,
      errors: [{ message: "Something went wrong" }],
    } as AuthErrorRes;
  }
};
