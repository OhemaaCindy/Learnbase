import type { RequestHandler } from "express";
import type { AppDeps } from "../../shared/adapters/index.js";
import { adminSignupSchema, learnerSignupSchema } from "./auth.schema.js";
import { registerUser } from "./auth.service.js";

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
