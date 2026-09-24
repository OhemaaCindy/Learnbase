import { describe, it, expect, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import { authenticate } from "./authenticate.js";
import { requireRole } from "./requireRole.js";
import { errorHandler } from "./errorHandler.js";
import { signToken } from "../auth/jwt.js";
import { User } from "../../modules/auth/user.model.js";

function appWith(...handlers: express.RequestHandler[]) {
  const app = express();
  app.get("/protected", ...handlers, (req, res) => {
    res.json({ success: true, email: req.user?.email });
  });
  app.use(errorHandler);
  return app;
}

beforeEach(() => {
  process.env.JWT_SECRET = "test-secret-value-long-enough";
});

describe("authenticate", () => {
  it("attaches the user for a valid token", async () => {
    const user = await User.create({
      firstName: "Ada", lastName: "L", email: "ada@example.com",
      password: "Password123", role: "Learner",
    });
    const token = signToken({ sub: user._id.toString(), role: "Learner" });

    const res = await request(appWith(authenticate))
      .get("/protected")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe("ada@example.com");
  });

  it("rejects a missing Authorization header with the envelope", async () => {
    const res = await request(appWith(authenticate)).get("/protected");
    expect(res.status).toBe(401);
    expect(res.body).toEqual({
      success: false,
      errors: [{ message: "Not authorised" }],
    });
  });

  it("rejects a malformed Authorization header", async () => {
    const res = await request(appWith(authenticate))
      .get("/protected")
      .set("Authorization", "Token abc");
    expect(res.status).toBe(401);
  });

  it("rejects a token whose user no longer exists", async () => {
    const token = signToken({ sub: "507f1f77bcf86cd799439011", role: "Admin" });
    const res = await request(appWith(authenticate))
      .get("/protected")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(401);
  });

  it("rejects a disabled account", async () => {
    const user = await User.create({
      firstName: "Ada", lastName: "L", email: "ada@example.com",
      password: "Password123", role: "Learner", disabled: true,
    });
    const token = signToken({ sub: user._id.toString(), role: "Learner" });
    const res = await request(appWith(authenticate))
      .get("/protected")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(401);
  });
});

describe("requireRole", () => {
  it("allows a matching role", async () => {
    const user = await User.create({
      firstName: "Admin", lastName: "One", email: "admin@example.com",
      password: "Password123", role: "Admin",
    });
    const token = signToken({ sub: user._id.toString(), role: "Admin" });
    const res = await request(appWith(authenticate, requireRole("Admin")))
      .get("/protected")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it("rejects a non-matching role with 403", async () => {
    const user = await User.create({
      firstName: "Ada", lastName: "L", email: "ada@example.com",
      password: "Password123", role: "Learner",
    });
    const token = signToken({ sub: user._id.toString(), role: "Learner" });
    const res = await request(appWith(authenticate, requireRole("Admin")))
      .get("/protected")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});
