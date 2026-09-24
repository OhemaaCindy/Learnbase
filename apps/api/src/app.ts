import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import type { MessageResponse } from "@learnbase/types";
import { errorHandler } from "./shared/middleware/errorHandler.js";
import { notFound } from "./shared/middleware/notFound.js";
import { type AppDeps, createRealDeps } from "./shared/adapters/index.js";
import { createAuthRouter } from "./modules/auth/auth.routes.js";

/**
 * Builds the Express application without binding a port, so tests can
 * mount it with supertest and the process entry point stays separate.
 *
 * `deps` defaults to the real adapters (e.g. Brevo mail over SMTP), which
 * are constructed lazily so importing/calling this with no arguments in
 * tests never opens a network connection. Tests inject fakes instead.
 */
export function createApp(deps: AppDeps = createRealDeps()): Express {
  const app = express();
  app.set("deps", deps);

  const allowedOrigins = [
    process.env.CLIENT_ADMIN_URL ?? "http://localhost:5173",
    process.env.CLIENT_LEARNER_URL ?? "http://localhost:5174",
  ];

  app.use(helmet());
  app.use(
    cors({
      origin: allowedOrigins,
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get("/api/health", (_req, res: express.Response<MessageResponse>) => {
    res.status(200).json({
      success: true,
      message: "LearnBase API is running",
    });
  });

  app.use("/api/auth", createAuthRouter(deps));

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
