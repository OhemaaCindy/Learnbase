/**
 * Re-exports the shared contract. Previously this file declared `User`
 * four separate times, which TypeScript silently merged into one
 * interface. Names are aliased so existing imports keep working.
 */
export type {
  User,
  ApiErrorResponse as AuthErrorRes,
  ApiError as AuthError,
  AdminRegisterPayload as RegisterType,
  AuthSuccessResponse as RegisterResponse,
  LoginPayload as LoginPayloadType,
  AuthSuccessResponse as LoginResponseType,
  ForgotPasswordPayload as ForgotPasswordPayloadType,
  MessageResponse as ForgotPasswordResponseType,
  ResetPasswordPayload as ResetPasswordPayloadType,
  ApiErrorResponse as ResetPasswordResponseype,
  ApiError as Error,
  VerifyEmailPayload as VerifyEmailPayloadType,
  VerifyEmailResponse as VerifyEmailResponseType,
  MessageResponse as ResendOtpType,
  MessageResponse as LogoutResponse,
  CheckAuthResponse,
  UpdateUserResponse as UpdateLearnerResponse,
} from "@learnbase/types";
