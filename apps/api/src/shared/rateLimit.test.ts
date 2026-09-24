import { describe, it, expect, afterEach } from "vitest";
import express from "express";
import request from "supertest";
import { makeLimiter } from "./rateLimit.js";
import { errorHandler } from "./middleware/errorHandler.js";

afterEach(() => {
  delete process.env.RATE_LIMIT_IN_TESTS;
});

function app(limiter: express.RequestHandler) {
  const instance = express();
  instance.post("/thing", limiter, (_req, res) => res.json({ success: true }));
  instance.use(errorHandler);
  return instance;
}

describe("rate limiting", () => {
  it("blocks past the limit with the error envelope and a 429", async () => {
    process.env.RATE_LIMIT_IN_TESTS = "1";
    const limiter = makeLimiter({ windowMs: 60_000, max: 2 });
    const instance = app(limiter);

    await request(instance).post("/thing").expect(200);
    await request(instance).post("/thing").expect(200);
    const res = await request(instance).post("/thing");

    expect(res.status).toBe(429);
    expect(res.body.success).toBe(false);
    expect(res.body.errors[0].message).toMatch(/too many/i);
  });

  it("is inert in tests unless explicitly enabled", async () => {
    const limiter = makeLimiter({ windowMs: 60_000, max: 1 });
    const instance = app(limiter);
    await request(instance).post("/thing").expect(200);
    await request(instance).post("/thing").expect(200);
    await request(instance).post("/thing").expect(200);
  });
});
