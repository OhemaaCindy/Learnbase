import { apiEndpoints } from "@/constants/api-endpoints";
import { axiosClient } from "@/lib/axios";
import type {
  UpdateLearnerFormData,
  // UpdatePasswordFormData,
} from "@/schemas/learner-schema";
import type { AuthErrorRes } from "@/types/auth.type";
import type {
  EnollmentResponse,
  EnollmentType,
  InvoiceResponse,
  UpdateLearnerResponse,
} from "@/types/learner.type";
import axios from "axios";

export const upateLearner = async (
  payload: UpdateLearnerFormData
): Promise<UpdateLearnerResponse> => {
  console.log("🔥 ~ updateLearner ~ payload:", payload);
  // const { firstName, lastName, contact, location, disabled, descripton } = payload;

  const formData = new FormData();

  // Append only non-empty string values
  if (payload.firstName) formData.append("firstName", payload.firstName);
  if (payload.lastName) formData.append("lastName", payload.lastName);
  if (payload.contact) formData.append("contact", payload.contact);
  if (payload.location) formData.append("location", payload.location);
  formData.append("disabled", String(payload.disabled));
  if (payload.description) formData.append("description", payload.description);

  // formData.append("descripton", payload.description);

  // Append image only if it's a File instance
  if (payload.profileImage instanceof File) {
    formData.append("profileImage", payload.profileImage);
  }
  console.log("🚀 ~ upateLearner ~ formData:", formData);

  try {
    console.log("🚀 ~ upateLearner ~ formData:", formData);
    const response = await axiosClient.put<UpdateLearnerResponse>(
      apiEndpoints.LEARNERS.updateProfile,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return response.data;
  } catch (error) {
    // console.log("🚀 ~ createTrack ~ error:", error);
    if (axios.isAxiosError(error) && error.response) {
      throw error.response.data as AuthErrorRes;
    }
    throw {
      success: false,
      errors: [{ message: "Something went wrong" }],
    } as AuthErrorRes;
  }
};

export const trackEnrollment = async (
  payload: EnollmentType
): Promise<EnollmentResponse> => {
  // console.log("🔥 ~ enrollLearner ~ payload:", payload);

  try {
    // console.log("🚀 ~ upateLearner ~ payload:", payload);
    const response = await axiosClient.post<EnollmentResponse>(
      apiEndpoints.LEARNERS.trackEnrollment,
      payload
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

export const allInvoices = async (): Promise<InvoiceResponse> => {
  try {
    const response = await axiosClient.get<InvoiceResponse>(
      apiEndpoints.INVOICES.getInvoices
    );
    return response.data;
  } catch (error) {
    console.log("🚀 ~ allInvoices ~ error:", error);
    if (axios.isAxiosError(error) && error.response) {
      throw error.response.data as AuthErrorRes;
    }
    throw {
      success: false,
      errors: [{ message: "Something went wrong" }],
    } as AuthErrorRes;
  }
};
// export const upatePassword = async ({
//   payload,
// }: UpdatePasswordFormData): Promise<UpdateLearnerResponse> => {
//   try {
//     console.log("🚀 ~ upateLearner ~ payload:", payload);
//     const response = await axiosClient.post<UpdateLearnerResponse>(
//       apiEndpoints.AUTH.updatePassword,
//       payload
//       // {
//       //   headers: { "Content-Type": "multipart/form-data" },
//       // }
//     );
//     return response.data;
//   } catch (error) {
//     // console.log("🚀 ~ createTrack ~ error:", error);
//     if (axios.isAxiosError(error) && error.response) {
//       throw error.response.data as AuthErrorRes;
//     }
//     throw {
//       success: false,
//       errors: [{ message: "Something went wrong" }],
//     } as AuthErrorRes;
//   }
// };
