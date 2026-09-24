import { Router } from "express";
import type { AppDeps } from "../../shared/adapters/index.js";
import {
  checkAuth,
  login,
  signupAdmin,
  signupLearner,
  verifyEmailHandler,
  resendToken,
  forgotPassword,
  resetPasswordHandler,
} from "./auth.controller.js";
import { authenticate } from "../../shared/middleware/authenticate.js";
import { loginLimiter, otpLimiter, emailLimiter } from "../../shared/rateLimit.js";

export function createAuthRouter(deps: AppDeps): Router {
  const router = Router();
  router.post("/signup/admin", signupAdmin(deps));
  router.post("/signup/learner", signupLearner(deps));
  router.post("/login", loginLimiter, login);
  router.get("/check-auth", authenticate, checkAuth);
  router.post("/verify-email", authenticate, otpLimiter, verifyEmailHandler);
  router.post("/resend-token", authenticate, emailLimiter, resendToken(deps));
  router.post("/forgot-password", emailLimiter, forgotPassword(deps));
  router.post("/reset-password/:id", resetPasswordHandler);
  return router;
}
