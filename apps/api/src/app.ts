import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";

/**
 * Builds the Express application without binding a port, so tests can
 * mount it with supertest and the process entry point stays separate.
 */
export function createApp(): Express {
  const app = express();

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

  app.get("/api/health", (_req, res) => {
    res.status(200).json({
      success: true,
      message: "LearnBase API is running",
    });
  });

  return app;
}
