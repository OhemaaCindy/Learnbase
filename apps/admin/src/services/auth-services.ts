import axios from "axios";
import { apiEndpoints } from "../constants/api-endpoints";
import { axiosClient } from "../lib/axios";
import type {
  AuthErrorRes,
  CheckAuthResponse,
  ForgotPasswordPayloadType,
  ForgotPasswordResponseType,
  LoginPayloadType,
  LoginResponseType,
  LogoutResponse,
  RegisterResponse,
  RegisterType,
  ResendOtpType,
  ResetPasswordPayloadType,
  ResetPasswordResponseype,
  VerifyEmailPayloadType,
  VerifyEmailResponseType,
} from "../types/types";

export const registerAdmin = async (
  payload: RegisterType
): Promise<RegisterResponse> => {
  try {
    const response = await axiosClient.post<RegisterResponse>(
      apiEndpoints.AUTH.register,
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

export const loginAdmin = async (
  payload: LoginPayloadType
): Promise<LoginResponseType> => {
  try {
    const response = await axiosClient.post<LoginResponseType>(
      apiEndpoints.AUTH.login,
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

export const forgotPasswordAdmin = async (
  payload: ForgotPasswordPayloadType
): Promise<ForgotPasswordResponseType> => {
  try {
    const response = await axiosClient.post<ForgotPasswordResponseType>(
      apiEndpoints.AUTH.forgotPassword,
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

export interface ResetAdminPasswordProps {
  id: string;
  payload: ResetPasswordPayloadType;
}

export const resetAdminPassword = async ({
  payload,
  id,
}: ResetAdminPasswordProps): Promise<ResetPasswordResponseype> => {
  try {
    const response = await axiosClient.post<ResetPasswordResponseype>(
      apiEndpoints.AUTH.resetPassword(id),
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

export const verifyEmailOtp = async (
  payload: VerifyEmailPayloadType
): Promise<VerifyEmailResponseType> => {
  try {
    const response = await axiosClient.post<VerifyEmailResponseType>(
      apiEndpoints.AUTH.verifyEmail,
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

export const resendOtp = async (): Promise<ResendOtpType> => {
  try {
    const response = await axiosClient.post<ResendOtpType>(
      apiEndpoints.AUTH.resendVerificationToken
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

export const logout = async (): Promise<LogoutResponse> => {
  try {
    const response = await axiosClient.post<LogoutResponse>(
      apiEndpoints.AUTH.logout
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

export const checkAuthUser = async (): Promise<CheckAuthResponse> => {
  try {
    const response = await axiosClient.get<CheckAuthResponse>(
      apiEndpoints.AUTH.checkAuth
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
