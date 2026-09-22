import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import { connectDB, disconnectDB } from "./db.js";

describe("connectDB", () => {
  it("is already connected via the test harness", () => {
    expect(mongoose.connection.readyState).toBe(1);
  });

  it("rejects an unreachable database rather than hanging", async () => {
    await disconnectDB();

    await expect(
      connectDB("mongodb://127.0.0.1:1/learnbase-nope"),
    ).rejects.toThrow();

    await connectDB(process.env.MONGODB_URI!);
    expect(mongoose.connection.readyState).toBe(1);
  });
});
