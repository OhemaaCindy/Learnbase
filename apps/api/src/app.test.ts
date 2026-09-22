import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "./app.js";

describe("GET /api/health", () => {
  it("reports the API is running", async () => {
    const res = await request(createApp()).get("/api/health");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      message: "LearnBase API is running",
    });
  });
});

describe("CORS", () => {
  it("allows the configured admin origin", async () => {
    const res = await request(createApp())
      .get("/api/health")
      .set("Origin", "http://localhost:5173");

    expect(res.headers["access-control-allow-origin"]).toBe(
      "http://localhost:5173",
    );
  });
});
