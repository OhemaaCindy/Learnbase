import { apiEndpoints } from "@/constants/api-endpoints";
import { axiosClient } from "@/lib/axios";
import type {
  Learner,
  LearnerResponse,
  LearnersResponse,
} from "@/types/learners.type";
import type { AuthErrorRes } from "@/types/types";
import axios from "axios";

export const allLearners = async (): Promise<Learner[]> => {
  try {
    const response = await axiosClient.get<LearnersResponse>(
      apiEndpoints.LEARNERS.getAllLearners
    );
    return response.data.learners;
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

export const singleLearner = async (id: string): Promise<Learner> => {
  try {
    const response = await axiosClient.get<LearnerResponse>(
      apiEndpoints.LEARNERS.getOneLearner(id)
    );
    return response.data.learner;
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
