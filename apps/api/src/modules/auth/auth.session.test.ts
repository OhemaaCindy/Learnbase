import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";
import { User } from "./user.model.js";
import { fakeMailer, fakeImageStore } from "../../test/factories.js";

function appWith() {
  const mail = fakeMailer();
  const images = fakeImageStore();
  return createApp({ mailer: mail.mailer, imageStore: images.imageStore });
}

async function seedLearner(overrides: Record<string, unknown> = {}) {
  return User.create({
    firstName: "Ada",
    lastName: "Lovelace",
    email: "ada@example.com",
    password: "Password123",
    role: "Learner",
    ...overrides,
  });
}

beforeEach(() => {
  process.env.JWT_SECRET = "test-secret-value-long-enough";
});

describe("POST /api/auth/login", () => {
  it("returns a token and the user for correct credentials", async () => {
    await seedLearner();
    const res = await request(appWith())
      .post("/api/auth/login")
      .send({ email: "ada@example.com", password: "Password123" });

    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe("string");
    expect(res.body.user.email).toBe("ada@example.com");
    expect(res.body.user.password).toBeUndefined();
  });

  // Review Focus 4
  it("accepts a differently-cased, padded email", async () => {
    await seedLearner();
    const res = await request(appWith())
      .post("/api/auth/login")
      .send({ email: "  ADA@Example.COM ", password: "Password123" });
    expect(res.status).toBe(200);
  });

  it("records lastLogin", async () => {
    await seedLearner();
    await request(appWith())
      .post("/api/auth/login")
      .send({ email: "ada@example.com", password: "Password123" });
    const user = await User.findOne({ email: "ada@example.com" });
    expect(user?.lastLogin).toBeInstanceOf(Date);
  });

  it("rejects a wrong password with 401", async () => {
    await seedLearner();
    const res = await request(appWith())
      .post("/api/auth/login")
      .send({ email: "ada@example.com", password: "WrongPassword1" });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("gives the same message for an unknown email as for a wrong password", async () => {
    await seedLearner();
    const unknown = await request(appWith())
      .post("/api/auth/login")
      .send({ email: "nobody@example.com", password: "Password123" });
    const wrong = await request(appWith())
      .post("/api/auth/login")
      .send({ email: "ada@example.com", password: "WrongPassword1" });

    expect(unknown.status).toBe(401);
    expect(unknown.body.errors[0].message).toBe(wrong.body.errors[0].message);
  });

  it("rejects a disabled account", async () => {
    await seedLearner({ disabled: true });
    const res = await request(appWith())
      .post("/api/auth/login")
      .send({ email: "ada@example.com", password: "Password123" });
    expect(res.status).toBe(401);
  });
});

describe("GET /api/auth/check-auth", () => {
  it("returns the current user for a valid token", async () => {
    await seedLearner();
    const app = appWith();
    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "ada@example.com", password: "Password123" });

    const res = await request(app)
      .get("/api/auth/check-auth")
      .set("Authorization", `Bearer ${login.body.token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe("ada@example.com");
  });

  it("never leaks token fields", async () => {
    await seedLearner({ verificationToken: "123456", resetPasswordToken: "abc" });
    const app = appWith();
    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "ada@example.com", password: "Password123" });
    const res = await request(app)
      .get("/api/auth/check-auth")
      .set("Authorization", `Bearer ${login.body.token}`);

    expect(res.body.user.verificationToken).toBeUndefined();
    expect(res.body.user.resetPasswordToken).toBeUndefined();
    expect(res.body.user.resetPasswordExpiresAt).toBeUndefined();
  });

  it("rejects an anonymous request with 401", async () => {
    const res = await request(appWith()).get("/api/auth/check-auth");
    expect(res.status).toBe(401);
  });
});

describe("POST /api/admin/auth/logout", () => {
  it("acknowledges logout for an authenticated user", async () => {
    await seedLearner();
    const app = appWith();
    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "ada@example.com", password: "Password123" });

    const res = await request(app)
      .post("/api/admin/auth/logout")
      .set("Authorization", `Bearer ${login.body.token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("rejects an anonymous logout with 401", async () => {
    const res = await request(appWith()).post("/api/admin/auth/logout");
    expect(res.status).toBe(401);
  });
});
