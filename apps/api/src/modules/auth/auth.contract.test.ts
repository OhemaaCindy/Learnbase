import { describe, it, expect, expectTypeOf, beforeEach } from "vitest";
import request from "supertest";
import type { AuthSuccessResponse, CheckAuthResponse, JsonOf } from "@learnbase/types";
import { createApp } from "../../app.js";
import { User } from "./user.model.js";
import { fakeMailer, fakeImageStore } from "../../test/factories.js";

function appWith() {
  const mail = fakeMailer();
  const images = fakeImageStore();
  return createApp({ mailer: mail.mailer, imageStore: images.imageStore });
}

beforeEach(() => {
  process.env.JWT_SECRET = "test-secret-value-long-enough";
});

describe("auth responses match the shared contract", () => {
  it("signup returns the AuthSuccessResponse shape", async () => {
    const res = await request(appWith()).post("/api/auth/signup/learner").send({
      firstName: "Ada", lastName: "Lovelace", email: "ada@example.com",
      password: "Password123", confirmPassword: "Password123",
    });

    const body = res.body as JsonOf<AuthSuccessResponse>;
    expectTypeOf(body).toHaveProperty("token").toEqualTypeOf<string>();
    expectTypeOf(body).toHaveProperty("user");

    // The type says these exist; assert they really do at runtime.
    expect(typeof body.token).toBe("string");
    expect(typeof body.user._id).toBe("string");
    expect(typeof body.user.createdAt).toBe("string");
    expect(["Admin", "Learner"]).toContain(body.user.role);
    expect(typeof body.user.isVerified).toBe("boolean");
    expect(typeof body.user.__v).toBe("number");
  });

  it("check-auth returns the CheckAuthResponse shape", async () => {
    const app = appWith();
    await User.create({
      firstName: "Ada", lastName: "Lovelace", email: "ada@example.com",
      password: "Password123", role: "Learner",
    });
    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "ada@example.com", password: "Password123" });

    const res = await request(app)
      .get("/api/auth/check-auth")
      .set("Authorization", `Bearer ${login.body.token}`);

    const body = res.body as JsonOf<CheckAuthResponse>;
    expectTypeOf(body).toHaveProperty("user");
    expect(body.success).toBe(true);
    expect(typeof body.user.email).toBe("string");
    expect(Object.keys(body.user)).not.toContain("password");
  });

  it("every error response uses the envelope", async () => {
    const app = appWith();
    const cases = await Promise.all([
      request(app).post("/api/auth/login").send({ email: "x@y.com", password: "nope" }),
      request(app).post("/api/auth/signup/admin").send({}),
      request(app).get("/api/auth/check-auth"),
      request(app).get("/api/nope"),
    ]);

    for (const res of cases) {
      expect(res.body.success).toBe(false);
      expect(Array.isArray(res.body.errors)).toBe(true);
      expect(res.body.errors.length).toBeGreaterThan(0);
      expect(typeof res.body.errors[0].message).toBe("string");
    }
  });
});
