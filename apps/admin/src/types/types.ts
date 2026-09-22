export interface RegisterType {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  contact: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  token: string;
  user: User;
}

export interface User {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  contact: string;
  isVerified: boolean;
  verificationToken: string;
  verificationTokenExpiresAt: Date;
  _id: string;
  lastLogin: Date;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}

export interface AuthErrorRes {
  success: boolean;
  errors: AuthError[];
}

export interface AuthError {
  message: string;
}

export interface LoginPayloadType {
  email: string;
  password: string;
}

export interface LoginResponseType {
  success: boolean;
  message: string;
  token: string;
  user: User;
}

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  contact: string;
  isVerified: boolean;
  verificationToken: string;
  verificationTokenExpiresAt: Date;
  lastLogin: Date;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}

export interface ForgotPasswordPayloadType {
  email: string;
  baseResetURL: string;
}

export interface ForgotPasswordResponseType {
  success: boolean;
  message: string;
}

export interface ResetPasswordPayloadType {
  password: string;
  confirmPassword: string;
}

export interface ResetPasswordResponseype {
  success: boolean;
  errors: Error[];
}

export interface Error {
  message: string;
}

export interface VerifyEmailPayloadType {
  token: string;
}

export interface VerifyEmailResponseType {
  success: boolean;
  message: string;
  user: User;
}

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  contact: string;
  isVerified: boolean;
  lastLogin: Date;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}

export interface ResendOtpType {
  success: boolean;
  message: string;
}

export interface LogoutResponse {
  success: boolean;
  message: string;
}

export interface CheckAuthResponse {
  success: boolean;
  user: User;
}

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  contact: string;
  isVerified: boolean;
  verificationToken: string;
  verificationTokenExpiresAt: Date;
  lastLogin: Date;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
  resetPasswordExpiresAt: Date;
  resetPasswordToken: string;
  description: string;
  disabled: boolean;
  location: string;
}

export interface UpdateLearnerResponse {
  success: boolean;
  message: string;
  user: User;
}

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isVerified: boolean;
  lastLogin: Date;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
  contact: string;
  description: string;
  disabled: boolean;
  location: string;
}
