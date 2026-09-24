import { Router } from "express";
import type { AppDeps } from "../../shared/adapters/index.js";
import { checkAuth, login, signupAdmin, signupLearner } from "./auth.controller.js";
import { authenticate } from "../../shared/middleware/authenticate.js";
import { loginLimiter } from "../../shared/rateLimit.js";

export function createAuthRouter(deps: AppDeps): Router {
  const router = Router();
  router.post("/signup/admin", signupAdmin(deps));
  router.post("/signup/learner", signupLearner(deps));
  router.post("/login", loginLimiter, login);
  router.get("/check-auth", authenticate, checkAuth);
  return router;
}
