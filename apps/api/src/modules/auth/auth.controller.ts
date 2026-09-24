import type { Request, RequestHandler, Response } from "express";
import type {
  AuthSuccessResponse,
  CheckAuthResponse,
  MessageResponse,
} from "@learnbase/types";
import type { AppDeps } from "../../shared/adapters/index.js";
import { adminSignupSchema, learnerSignupSchema, loginSchema } from "./auth.schema.js";
import { loginUser, registerUser } from "./auth.service.js";
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
