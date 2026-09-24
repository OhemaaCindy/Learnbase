import "dotenv/config";
import { createApp } from "./app.js";
import { connectDB } from "./shared/db.js";
import { createRealDeps } from "./shared/adapters/index.js";

const port = Number(process.env.PORT ?? 5050);
const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  console.error("MONGODB_URI is not set. Copy .env.example to .env.");
  process.exit(1);
}

async function start(): Promise<void> {
  await connectDB(mongoUri!);
  console.log("Connected to MongoDB");

  createApp(createRealDeps()).listen(port, () => {
    console.log(`LearnBase API listening on http://localhost:${port}`);
  });
}

start().catch((error: unknown) => {
  console.error("Failed to start the API:", error);
  process.exit(1);
});
