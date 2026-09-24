import { Router } from "express";
import type { AppDeps } from "../../shared/adapters/index.js";
import { signupAdmin, signupLearner } from "./auth.controller.js";

export function createAuthRouter(deps: AppDeps): Router {
  const router = Router();
  router.post("/signup/admin", signupAdmin(deps));
  router.post("/signup/learner", signupLearner(deps));
  return router;
}
