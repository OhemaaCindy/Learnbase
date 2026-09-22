import { apiEndpoints } from "@/constants/api-endpoints";
import { axiosClient } from "@/lib/axios";
import type {
  AddTrackFormData,
  UpdateTrackFormData,
} from "@/schemas/track-schema";
import type {
  AddTrackResponse,
  DeleteTrackResponse,
  SingleTrackResponse,
  TrackResponse,
  UpdateTrackResponse,
} from "@/types/track.type";
import type { AuthErrorRes } from "@/types/types";
import axios from "axios";

export const allTracks = async (): Promise<TrackResponse> => {
  try {
    const response = await axiosClient.get<TrackResponse>(
      apiEndpoints.TRACKS.getAllTracks
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

export const singleTrack = async (id: string): Promise<SingleTrackResponse> => {
  try {
    const response = await axiosClient.get<SingleTrackResponse>(
      apiEndpoints.TRACKS.getOneTrack(id)
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

export const createTrack = async (
  payload: AddTrackFormData
): Promise<AddTrackResponse> => {
  const { name, price, image, instructor, duration, description } = payload;

  try {
    const formData = new FormData();
    formData.append("name", name);
    formData.append("price", price);
    formData.append("instructor", instructor);
    formData.append("duration", duration);
    formData.append("description", description);
    formData.append("image", image);

    const response = await axiosClient.post<AddTrackResponse>(
      apiEndpoints.TRACKS.createTrack,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          Accept: "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    // throw error;

    if (axios.isAxiosError(error) && error.response) {
      throw error.response.data as AuthErrorRes;
    }

    const errMsg =
      error instanceof Error ? error.message : "Something went wrong";
    throw {
      success: false,
      errors: [{ message: errMsg || error }],
    } as AuthErrorRes;
  }
};

export interface UpdateTrackProps {
  id: string;
  payload: UpdateTrackFormData;
}
export const upateTrack = async ({
  id,
  payload,
}: UpdateTrackProps): Promise<UpdateTrackResponse> => {
  const formData = new FormData();

  // Append only non-empty string values
  if (payload.name) formData.append("name", payload.name);
  if (payload.price) formData.append("price", payload.price);
  if (payload.instructor) formData.append("instructor", payload.instructor);
  if (payload.duration) formData.append("duration", payload.duration);
  if (payload.description) formData.append("description", payload.description);

  // Append image only if it's a File instance
  if (payload.image instanceof File) {
    formData.append("image", payload.image);
  }

  try {
    const response = await axiosClient.put<UpdateTrackResponse>(
      apiEndpoints.TRACKS.updateTrack(id),
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

export const deleteTrack = async (id: string): Promise<DeleteTrackResponse> => {
  try {
    const response = await axiosClient.delete<DeleteTrackResponse>(
      apiEndpoints.TRACKS.deleteTrack(id)
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
