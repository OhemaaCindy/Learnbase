import type { Request, Response } from "express";
import type {
  AuthSuccessResponse,
  CheckAuthResponse,
  MessageResponse,
  VerifyEmailResponse,
  UpdateUserResponse,
} from "@learnbase/types";
import type { AppDeps } from "../../shared/adapters/index.js";
import {
  adminSignupSchema,
  learnerSignupSchema,
  loginSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  updateProfileSchema,
} from "./auth.schema.js";
import {
  loginUser,
  registerUser,
  verifyEmail,
  resendVerification,
  requestPasswordReset,
  resetPassword,
  changePassword,
  updateProfile,
} from "./auth.service.js";
import { toPublicUser } from "./user.model.js";
import { AppError } from "../../shared/errors/AppError.js";

export function signupAdmin(
  deps: AppDeps,
): (req: Request, res: Response<AuthSuccessResponse>) => Promise<void> {
  return async (req, res) => {
    const input = adminSignupSchema.parse(req.body);
    const result = await registerUser(input, "Admin", deps.mailer);
    res.status(201).json({
      success: true,
      message: "Account created. Check your email for a verification code.",
      ...result,
    });
  };
}

export function signupLearner(
  deps: AppDeps,
): (req: Request, res: Response<AuthSuccessResponse>) => Promise<void> {
  return async (req, res) => {
    const input = learnerSignupSchema.parse(req.body);
    const result = await registerUser(input, "Learner", deps.mailer);
    res.status(201).json({
      success: true,
      message: "Account created. Check your email for a verification code.",
      ...result,
    });
  };
}

export const login = async (
  req: Request,
  res: Response<AuthSuccessResponse>,
): Promise<void> => {
  const result = await loginUser(loginSchema.parse(req.body));
  res.status(200).json({ success: true, message: "Logged in", ...result });
};

export const checkAuth = (
  req: Request,
  res: Response<CheckAuthResponse>,
): void => {
  if (!req.user) throw new AppError("Not authorised", 401);
  res.status(200).json({ success: true, user: toPublicUser(req.user) });
};

export const logout = (
  _req: Request,
  res: Response<MessageResponse>,
): void => {
  // The token is stateless and held by the client; logout is the client
  // discarding it. The endpoint exists so both portals have something to call.
  res.status(200).json({ success: true, message: "Logged out" });
};

export const verifyEmailHandler = async (
  req: Request,
  res: Response<VerifyEmailResponse>,
): Promise<void> => {
  if (!req.user) throw new AppError("Not authorised", 401);
  const { token } = verifyEmailSchema.parse(req.body);
  const user = await verifyEmail(req.user._id.toString(), token);
  res.status(200).json({ success: true, message: "Email verified", user });
};

export function resendToken(
  deps: AppDeps,
): (req: Request, res: Response<MessageResponse>) => Promise<void> {
  return async (req, res) => {
    if (!req.user) throw new AppError("Not authorised", 401);
    await resendVerification(req.user, deps.mailer);
    res.status(200).json({
      success: true,
      message: "If your account needs verifying, a new code is on its way.",
    });
  };
}

export function forgotPassword(
  deps: AppDeps,
): (req: Request, res: Response<MessageResponse>) => Promise<void> {
  return async (req, res) => {
    const input = forgotPasswordSchema.parse(req.body);
    await requestPasswordReset(input.email, input.baseResetURL, deps.mailer);
    res.status(200).json({
      success: true,
      message: "If that email has an account, a reset link is on its way.",
    });
  };
}

export const resetPasswordHandler = async (
  req: Request,
  res: Response<MessageResponse>,
): Promise<void> => {
  const { password } = resetPasswordSchema.parse(req.body);
  const rawToken = req.params.id;
  if (typeof rawToken !== "string") {
    throw new AppError("That reset link is invalid or has expired", 400);
  }
  await resetPassword(rawToken, password);
  res.status(200).json({ success: true, message: "Password updated" });
};

export const changePasswordHandler = async (
  req: Request,
  res: Response<MessageResponse>,
): Promise<void> => {
  if (!req.user) throw new AppError("Not authorised", 401);
  const { password } = changePasswordSchema.parse(req.body);
  await changePassword(req.user._id.toString(), password);
  res.status(200).json({ success: true, message: "Password updated" });
};

export function updateProfileHandler(
  deps: AppDeps,
): (req: Request, res: Response<UpdateUserResponse>) => Promise<void> {
  return async (req, res) => {
    if (!req.user) throw new AppError("Not authorised", 401);
    const fields = updateProfileSchema.parse(req.body);
    const user = await updateProfile(
      req.user._id.toString(),
      fields,
      req.file?.buffer,
      deps.imageStore,
    );
    res.status(200).json({ success: true, message: "Profile updated", user });
  };
}
