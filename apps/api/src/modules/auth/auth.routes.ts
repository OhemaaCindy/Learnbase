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
  changePasswordHandler,
  updateProfileHandler,
} from "./auth.controller.js";
import { authenticate } from "../../shared/middleware/authenticate.js";
import { loginLimiter, otpLimiter, emailLimiter } from "../../shared/rateLimit.js";
import { uploadSingle } from "../../shared/middleware/upload.js";

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
  router.post("/change-password", authenticate, changePasswordHandler);
  router.put(
    "/update",
    authenticate,
    uploadSingle("profileImage"),
    updateProfileHandler(deps),
  );
  return router;
}
