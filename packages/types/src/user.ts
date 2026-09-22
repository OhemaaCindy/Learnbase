export type Role = "Admin" | "Learner";

/**
 * The canonical user shape returned by the API.
 *
 * Deliberately omits `password`, `verificationToken`,
 * `verificationTokenExpiresAt`, `resetPasswordToken` and
 * `resetPasswordExpiresAt`. The previous API returned those from
 * /auth/check-auth, which handed any valid session the means to reset
 * that account's password. Neither frontend reads them. See spec §7.
 */
export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  isVerified: boolean;
  lastLogin: Date;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
  contact?: string;
  profileImage?: string;
  description?: string;
  location?: string;
  disabled?: boolean;
}

export interface AdminRegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  contact: string;
}

export type LearnerRegisterPayload = Omit<AdminRegisterPayload, "contact">;

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthSuccessResponse {
  success: boolean;
  message: string;
  token: string;
  user: User;
}

export interface CheckAuthResponse {
  success: boolean;
  user: User;
}

export interface ForgotPasswordPayload {
  email: string;
  /** Frontend origin the API uses to build the emailed reset link. */
  baseResetURL: string;
}

export interface ResetPasswordPayload {
  password: string;
  confirmPassword: string;
}

export interface VerifyEmailPayload {
  /** The 6-digit OTP from the verification email. */
  token: string;
}

export interface VerifyEmailResponse {
  success: boolean;
  message: string;
  user: User;
}

export interface UpdateUserResponse {
  success: boolean;
  message: string;
  user: User;
}
