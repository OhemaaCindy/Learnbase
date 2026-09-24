import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";
import { User } from "./user.model.js";
import { fakeMailer, fakeImageStore } from "../../test/factories.js";

function appWith() {
  const mail = fakeMailer();
  const images = fakeImageStore();
  const app = createApp({ mailer: mail.mailer, imageStore: images.imageStore });
  return { app, sent: mail.sent };
}

const payload = {
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada@example.com",
  password: "Password123",
  confirmPassword: "Password123",
  contact: "+233201234567",
};

beforeEach(() => {
  process.env.JWT_SECRET = "test-secret-value-long-enough";
});

describe("POST /api/auth/signup/admin", () => {
  it("creates an unverified admin, returns a token, and emails a code", async () => {
    const { app, sent } = appWith();
    const res = await request(app).post("/api/auth/signup/admin").send(payload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.token).toBe("string");
    expect(res.body.user.email).toBe("ada@example.com");
    expect(res.body.user.role).toBe("Admin");
    expect(res.body.user.isVerified).toBe(false);
    expect(sent).toHaveLength(1);
    expect(sent[0]!.to).toBe("ada@example.com");
  });

  it("never returns credential or token fields", async () => {
    const { app } = appWith();
    const res = await request(app).post("/api/auth/signup/admin").send(payload);
    expect(res.body.user.password).toBeUndefined();
    expect(res.body.user.verificationToken).toBeUndefined();
    expect(res.body.user.resetPasswordToken).toBeUndefined();
  });

  it("rejects mismatched passwords with 400", async () => {
    const { app } = appWith();
    const res = await request(app)
      .post("/api/auth/signup/admin")
      .send({ ...payload, confirmPassword: "Different123" });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors.length).toBeGreaterThan(0);
  });

  it("rejects a weak password with 400", async () => {
    const { app } = appWith();
    const res = await request(app)
      .post("/api/auth/signup/admin")
      .send({ ...payload, password: "short", confirmPassword: "short" });
    expect(res.status).toBe(400);
  });

  // Review Focus 5
  it("rejects a duplicate email with 409, not a 500", async () => {
    const { app } = appWith();
    await request(app).post("/api/auth/signup/admin").send(payload);
    const res = await request(app).post("/api/auth/signup/admin").send(payload);
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  // Review Focus 4
  it("treats differently-cased and padded emails as one account", async () => {
    const { app } = appWith();
    await request(app).post("/api/auth/signup/admin").send(payload);
    const res = await request(app)
      .post("/api/auth/signup/admin")
      .send({ ...payload, email: "  ADA@Example.COM " });
    expect(res.status).toBe(409);
    // Must come from the service's own duplicate check, which only fires if the
    // schema normalised the email before the lookup. The unique-index fallback
    // produces "A record with that email already exists" instead.
    expect(res.body.errors[0].message).toBe(
      "An account with that email already exists",
    );
    expect(await User.countDocuments()).toBe(1);
  });

  it("does not send a verification email when signup fails", async () => {
    const { app, sent } = appWith();
    await request(app).post("/api/auth/signup/admin").send(payload);
    sent.length = 0;
    await request(app).post("/api/auth/signup/admin").send(payload);
    expect(sent).toHaveLength(0);
  });
});

describe("POST /api/auth/signup/learner", () => {
  it("creates a learner without requiring contact", async () => {
    const { app } = appWith();
    const { contact: _contact, ...withoutContact } = payload;
    const res = await request(app)
      .post("/api/auth/signup/learner")
      .send(withoutContact);

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe("Learner");
  });

  it("stores a six digit verification code that expires", async () => {
    const { app } = appWith();
    const { contact: _contact, ...withoutContact } = payload;
    await request(app).post("/api/auth/signup/learner").send(withoutContact);

    const user = await User.findOne({ email: "ada@example.com" }).select(
      "+verificationToken +verificationTokenExpiresAt",
    );
    expect(user?.verificationToken).toMatch(/^\d{6}$/);
    expect(user?.verificationTokenExpiresAt?.getTime()).toBeGreaterThan(Date.now());
  });
});
