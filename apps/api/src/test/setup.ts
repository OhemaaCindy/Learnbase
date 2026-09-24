import { beforeAll, afterAll, afterEach } from "vitest";
import mongoose from "mongoose";
import { connectDB, disconnectDB } from "../shared/db.js";

beforeAll(async () => {
  await connectDB(process.env.MONGODB_URI!);
});

afterEach(async () => {
  const { collections } = mongoose.connection;
  await Promise.all(
    Object.values(collections).map((collection) => collection.deleteMany({})),
  );
});

afterAll(async () => {
  await disconnectDB();
});
