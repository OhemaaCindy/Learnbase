import "dotenv/config";
import { createApp } from "./app.js";
import { connectDB } from "./shared/db.js";
import { createRealDeps } from "./shared/adapters/index.js";

const port = Number(process.env.PORT ?? 5050);

const REQUIRED = [
  "MONGODB_URI",
  "JWT_SECRET",
  ...(process.env.NODE_ENV === "production"
    ? (["CLIENT_ADMIN_URL", "CLIENT_LEARNER_URL"] as const)
    : []),
] as const;

const missing = REQUIRED.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(
    `Missing required environment variables: ${missing.join(", ")}. Copy .env.example to .env.`,
  );
  process.exit(1);
}

const mongoUri = process.env.MONGODB_URI!;

async function start(): Promise<void> {
  await connectDB(mongoUri);
  console.log("Connected to MongoDB");

  createApp(createRealDeps()).listen(port, () => {
    console.log(`LearnBase API listening on http://localhost:${port}`);
  });
}

start().catch((error: unknown) => {
  console.error("Failed to start the API:", error);
  process.exit(1);
});
