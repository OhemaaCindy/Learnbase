import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import crypto from "node:crypto";
import { createApp } from "../../app.js";
import { User } from "./user.model.js";
import { fakeMailer, fakeImageStore } from "../../test/factories.js";

function appWith() {
  const mail = fakeMailer();
  const images = fakeImageStore();
  return { app: createApp({ mailer: mail.mailer, imageStore: images.imageStore }), sent: mail.sent };
}

const ADMIN_ORIGIN = "https://admin.example.com";
const LEARNER_ORIGIN = "https://learner.example.com";

beforeEach(async () => {
  process.env.JWT_SECRET = "test-secret-value-long-enough";
  process.env.CLIENT_ADMIN_URL = ADMIN_ORIGIN;
  process.env.CLIENT_LEARNER_URL = LEARNER_ORIGIN;
  await User.create({
    firstName: "Ada", lastName: "Lovelace", email: "ada@example.com",
    password: "Password123", role: "Learner",
  });
});

function linkFrom(text: string): string {
  const match = text.match(/https?:\/\/\S+/);
  if (!match) throw new Error(`no link in: ${text}`);
  return match[0];
}

describe("POST /api/auth/forgot-password", () => {
  it("emails a reset link built from an allowed origin", async () => {
    const { app, sent } = appWith();
    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "ada@example.com", baseResetURL: `${LEARNER_ORIGIN}/reset-password` });

    expect(res.status).toBe(200);
    expect(sent).toHaveLength(1);
    expect(linkFrom(sent[0]!.text)).toContain(`${LEARNER_ORIGIN}/reset-password/`);
  });

  // Review Focus 1 — the important one
  it("refuses a baseResetURL on an origin we do not control, and sends nothing", async () => {
    const { app, sent } = appWith();
    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "ada@example.com", baseResetURL: "https://evil.example/reset-password" });

    expect(res.status).toBe(400);
    expect(sent).toHaveLength(0);
    const user = await User.findOne({ email: "ada@example.com" }).select("+resetPasswordToken");
    expect(user?.resetPasswordToken).toBeUndefined();
  });

  it("refuses a disallowed baseResetURL for an unknown email too, before any account lookup", async () => {
    const { app, sent } = appWith();
    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "nobody@example.com", baseResetURL: "https://evil.example/reset-password" });

    expect(res.status).toBe(400);
    expect(sent).toHaveLength(0);
  });

  it("refuses an origin that merely starts with an allowed one", async () => {
    const { app, sent } = appWith();
    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({
        email: "ada@example.com",
        baseResetURL: `${LEARNER_ORIGIN}.evil.example/reset-password`,
      });
    expect(res.status).toBe(400);
    expect(sent).toHaveLength(0);
  });

  it("keeps a backslash-disguised userinfo attack from reaching the emailed link", async () => {
    const { app, sent } = appWith();
    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({
        email: "ada@example.com",
        baseResetURL: `${LEARNER_ORIGIN}\\@evil.test/reset-password`,
      });

    if (res.status !== 200) {
      expect(res.status).toBe(400);
      expect(sent).toHaveLength(0);
      return;
    }

    // WHATWG's `new URL(...).origin` treats the backslash as a path
    // separator, so the request is accepted (`.origin` reports the allowed
    // learner origin). The vulnerability is what happens next: if the RAW
    // candidate — still carrying the literal backslash — is what gets
    // emailed, an RFC 3986 parser downstream (curl, Python, a mail-scanner)
    // keeps that backslash inside the authority and resolves the link to
    // evil.test instead. Checking the link's host with Node's own `new URL()`
    // would NOT catch this: Node applies the same WHATWG normalisation on
    // read-back, so a backslash-carrying link and its fixed, re-serialised
    // form report the identical host here. The presence of a literal
    // backslash in the link actually sent is the real signal.
    const link = linkFrom(sent[0]!.text);
    expect(link).not.toContain("\\");
    expect(new URL(link).host).toBe(new URL(LEARNER_ORIGIN).host);
  });

  it("refuses a non-absolute baseResetURL", async () => {
    const { app, sent } = appWith();
    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "ada@example.com", baseResetURL: "//reset-password" });
    expect(res.status).toBe(400);
    expect(sent).toHaveLength(0);
  });

  it("answers identically for an unknown email and sends nothing", async () => {
    const { app, sent } = appWith();
    const known = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "ada@example.com", baseResetURL: `${LEARNER_ORIGIN}/reset-password` });
    sent.length = 0;
    const unknown = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "nobody@example.com", baseResetURL: `${LEARNER_ORIGIN}/reset-password` });

    expect(unknown.status).toBe(known.status);
    expect(unknown.body.message).toBe(known.body.message);
    expect(sent).toHaveLength(0);
  });

  it("stores the token hashed, never in plain text", async () => {
    const { app, sent } = appWith();
    await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "ada@example.com", baseResetURL: `${ADMIN_ORIGIN}/reset-password` });

    const raw = linkFrom(sent[0]!.text).split("/").pop()!;
    const user = await User.findOne({ email: "ada@example.com" }).select("+resetPasswordToken");
    expect(user?.resetPasswordToken).toBeDefined();
    expect(user?.resetPasswordToken).not.toBe(raw);
    expect(user?.resetPasswordToken).toBe(
      crypto.createHash("sha256").update(raw).digest("hex"),
    );
  });
});

describe("POST /api/auth/reset-password/:id", () => {
  async function startReset() {
    const { app, sent } = appWith();
    await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "ada@example.com", baseResetURL: `${ADMIN_ORIGIN}/reset-password` });
    return { app, raw: linkFrom(sent[0]!.text).split("/").pop()! };
  }

  it("changes the password and lets the user log in with it", async () => {
    const { app, raw } = await startReset();
    const res = await request(app)
      .post(`/api/auth/reset-password/${raw}`)
      .send({ password: "NewPassword123", confirmPassword: "NewPassword123" });

    expect(res.status).toBe(200);
    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "ada@example.com", password: "NewPassword123" });
    expect(login.status).toBe(200);
  });

  // Review Focus 2
  it("refuses to reuse a token that already worked", async () => {
    const { app, raw } = await startReset();
    await request(app)
      .post(`/api/auth/reset-password/${raw}`)
      .send({ password: "NewPassword123", confirmPassword: "NewPassword123" });

    const again = await request(app)
      .post(`/api/auth/reset-password/${raw}`)
      .send({ password: "ThirdPassword123", confirmPassword: "ThirdPassword123" });

    expect(again.status).toBe(400);
    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "ada@example.com", password: "ThirdPassword123" });
    expect(login.status).toBe(401);
  });

  it("refuses an expired token", async () => {
    const { app, raw } = await startReset();
    await User.updateOne(
      { email: "ada@example.com" },
      { resetPasswordExpiresAt: new Date(Date.now() - 1000) },
    );

    const res = await request(app)
      .post(`/api/auth/reset-password/${raw}`)
      .send({ password: "NewPassword123", confirmPassword: "NewPassword123" });

    expect(res.status).toBe(400);
  });

  it("refuses an unknown token", async () => {
    const { app } = appWith();
    const res = await request(app)
      .post("/api/auth/reset-password/not-a-real-token")
      .send({ password: "NewPassword123", confirmPassword: "NewPassword123" });
    expect(res.status).toBe(400);
  });

  it("rejects mismatched passwords", async () => {
    const { app, raw } = await startReset();
    const res = await request(app)
      .post(`/api/auth/reset-password/${raw}`)
      .send({ password: "NewPassword123", confirmPassword: "Different123" });
    expect(res.status).toBe(400);
  });
});
