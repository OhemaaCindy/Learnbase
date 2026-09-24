import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";
import { User } from "./user.model.js";
import { fakeMailer, fakeImageStore } from "../../test/factories.js";

function appWith() {
  const mail = fakeMailer();
  const images = fakeImageStore();
  return { app: createApp({ mailer: mail.mailer, imageStore: images.imageStore }), sent: mail.sent };
}

const signup = {
  firstName: "Ada", lastName: "Lovelace", email: "ada@example.com",
  password: "Password123", confirmPassword: "Password123",
};

beforeEach(() => {
  process.env.JWT_SECRET = "test-secret-value-long-enough";
});

async function signUp() {
  const { app, sent } = appWith();
  const res = await request(app).post("/api/auth/signup/learner").send(signup);
  return { app, sent, token: res.body.token as string };
}

async function codeFor(email: string): Promise<string> {
  const user = await User.findOne({ email }).select("+verificationToken");
  return user!.verificationToken!;
}

describe("POST /api/auth/verify-email", () => {
  it("verifies with the correct code and clears it", async () => {
    const { app, token } = await signUp();
    const code = await codeFor("ada@example.com");

    const res = await request(app)
      .post("/api/auth/verify-email")
      .set("Authorization", `Bearer ${token}`)
      .send({ token: code });

    expect(res.status).toBe(200);
    expect(res.body.user.isVerified).toBe(true);

    const user = await User.findOne({ email: "ada@example.com" }).select(
      "+verificationToken +verificationTokenExpiresAt",
    );
    expect(user?.verificationToken).toBeUndefined();
    expect(user?.verificationTokenExpiresAt).toBeUndefined();
  });

  it("rejects a wrong code with 400 and leaves the account unverified", async () => {
    const { app, token } = await signUp();
    const res = await request(app)
      .post("/api/auth/verify-email")
      .set("Authorization", `Bearer ${token}`)
      .send({ token: "000000" });

    expect(res.status).toBe(400);
    const user = await User.findOne({ email: "ada@example.com" });
    expect(user?.isVerified).toBe(false);
  });

  it("rejects an expired code", async () => {
    const { app, token } = await signUp();
    const code = await codeFor("ada@example.com");
    await User.updateOne(
      { email: "ada@example.com" },
      { verificationTokenExpiresAt: new Date(Date.now() - 1000) },
    );

    const res = await request(app)
      .post("/api/auth/verify-email")
      .set("Authorization", `Bearer ${token}`)
      .send({ token: code });

    expect(res.status).toBe(400);
    expect(res.body.errors[0].message).toMatch(/expired/i);
  });

  it("rejects an anonymous request", async () => {
    const { app } = appWith();
    const res = await request(app).post("/api/auth/verify-email").send({ token: "123456" });
    expect(res.status).toBe(401);
  });

  // Review Focus 3
  it("locks verification after repeated wrong codes", async () => {
    const { app, token } = await signUp();

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await request(app)
        .post("/api/auth/verify-email")
        .set("Authorization", `Bearer ${token}`)
        .send({ token: "000000" });
    }

    // Even the CORRECT code must now be refused — the window is burnt.
    const code = await codeFor("ada@example.com");
    const res = await request(app)
      .post("/api/auth/verify-email")
      .set("Authorization", `Bearer ${token}`)
      .send({ token: code });

    expect(res.status).toBe(429);
    const user = await User.findOne({ email: "ada@example.com" });
    expect(user?.isVerified).toBe(false);
  });
});

describe("POST /api/auth/resend-token", () => {
  it("issues a new code and emails it, with no request body", async () => {
    const { app, sent, token } = await signUp();
    const first = await codeFor("ada@example.com");
    sent.length = 0;

    const res = await request(app)
      .post("/api/auth/resend-token")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(sent).toHaveLength(1);
    const second = await codeFor("ada@example.com");
    expect(second).not.toBe(first);
    expect(sent[0]!.html).toContain(second);
  });

  it("resets the failed-attempt counter", async () => {
    const { app, token } = await signUp();
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await request(app)
        .post("/api/auth/verify-email")
        .set("Authorization", `Bearer ${token}`)
        .send({ token: "000000" });
    }

    await request(app).post("/api/auth/resend-token").set("Authorization", `Bearer ${token}`);

    const code = await codeFor("ada@example.com");
    const res = await request(app)
      .post("/api/auth/verify-email")
      .set("Authorization", `Bearer ${token}`)
      .send({ token: code });

    expect(res.status).toBe(200);
  });

  it("rejects an anonymous request", async () => {
    const { app } = appWith();
    const res = await request(app).post("/api/auth/resend-token");
    expect(res.status).toBe(401);
  });

  it("does nothing for an already-verified account", async () => {
    const { app, sent, token } = await signUp();
    const code = await codeFor("ada@example.com");
    await request(app)
      .post("/api/auth/verify-email")
      .set("Authorization", `Bearer ${token}`)
      .send({ token: code });
    sent.length = 0;

    const res = await request(app)
      .post("/api/auth/resend-token")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(sent).toHaveLength(0);
  });
});
