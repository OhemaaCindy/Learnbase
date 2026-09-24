import type { Request, RequestHandler, Response } from "express";
import type {
  AuthSuccessResponse,
  CheckAuthResponse,
  MessageResponse,
  VerifyEmailResponse,
} from "@learnbase/types";
import type { AppDeps } from "../../shared/adapters/index.js";
import {
  adminSignupSchema,
  learnerSignupSchema,
  loginSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "./auth.schema.js";
import {
  loginUser,
  registerUser,
  verifyEmail,
  resendVerification,
  requestPasswordReset,
  resetPassword,
} from "./auth.service.js";
import { toPublicUser } from "./user.model.js";
import { AppError } from "../../shared/errors/AppError.js";

export function signupAdmin(deps: AppDeps): RequestHandler {
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

export function signupLearner(deps: AppDeps): RequestHandler {
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
