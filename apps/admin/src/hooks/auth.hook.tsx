import { useMutation } from "@tanstack/react-query";
import {
  forgotPasswordAdmin,
  loginAdmin,
  logout,
  registerAdmin,
  resendOtp,
  resetAdminPassword,
  verifyEmailOtp,
  type ResetAdminPasswordProps,
} from "../services/auth-services";
import type {
  AuthErrorRes,
  ForgotPasswordPayloadType,
  ForgotPasswordResponseType,
  LoginPayloadType,
  LoginResponseType,
  LogoutResponse,
  RegisterResponse,
  RegisterType,
  ResendOtpType,
  ResetPasswordResponseype,
  VerifyEmailPayloadType,
  VerifyEmailResponseType,
} from "../types/types";

export const useRegisterAdmin = () =>
  useMutation<RegisterResponse, AuthErrorRes, RegisterType>({
    mutationFn: registerAdmin,
  });

export const useLoginAdmin = () =>
  useMutation<LoginResponseType, AuthErrorRes, LoginPayloadType>({
    mutationFn: (payload) => loginAdmin(payload),
  });

export const useForgotPasswordAdmin = () =>
  useMutation<
    ForgotPasswordResponseType,
    AuthErrorRes,
    ForgotPasswordPayloadType
  >({
    mutationFn: (payload) => {
      return forgotPasswordAdmin(payload);
    },
  });

export const useResetPasswordAdmin = () =>
  useMutation<ResetPasswordResponseype, AuthErrorRes, ResetAdminPasswordProps>({
    mutationFn: ({ payload, id }: ResetAdminPasswordProps) => {
      return resetAdminPassword({ payload, id });
    },
  });

export const useOtpVerifyAdmin = () =>
  useMutation<VerifyEmailResponseType, AuthErrorRes, VerifyEmailPayloadType>({
    mutationFn: (payload) => verifyEmailOtp(payload),
  });

export const useResendOtpAdmin = () =>
  useMutation<ResendOtpType, AuthErrorRes>({
    mutationFn: resendOtp,
  });

export const useLogoutAdmin = () =>
  useMutation<LogoutResponse, AuthErrorRes>({
    mutationFn: logout,
  });
