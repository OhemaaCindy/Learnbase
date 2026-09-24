import { beforeAll, afterAll, afterEach } from "vitest";
import mongoose from "mongoose";
import { connectDB, disconnectDB } from "../shared/db.js";

beforeAll(async () => {
  await connectDB(process.env.MONGODB_URI!);
});

afterEach(async () => {
  const db = mongoose.connection.db;
  if (!db) return;
  const collections = await db.collections();
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
});

afterAll(async () => {
  await disconnectDB();
});
