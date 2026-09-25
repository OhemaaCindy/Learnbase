import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";
import { User } from "./user.model.js";
import { fakeMailer, fakeImageStore } from "../../test/factories.js";
import { signToken } from "../../shared/auth/jwt.js";

function appWith() {
  const mail = fakeMailer();
  const images = fakeImageStore("https://images.example/uploaded.png");
  return {
    app: createApp({ mailer: mail.mailer, imageStore: images.imageStore }),
    uploads: images.uploads,
  };
}

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

beforeEach(() => {
  process.env.JWT_SECRET = "test-secret-value-long-enough";
});

async function authed(app: ReturnType<typeof createApp>) {
  await User.create({
    firstName: "Ada", lastName: "Lovelace", email: "ada@example.com",
    password: "Password123", role: "Learner",
  });
  const login = await request(app)
    .post("/api/auth/login")
    .send({ email: "ada@example.com", password: "Password123" });
  return login.body.token as string;
}

describe("POST /api/auth/change-password", () => {
  it("changes the password and the old one stops working", async () => {
    const { app } = appWith();
    const token = await authed(app);

    const res = await request(app)
      .post("/api/auth/change-password")
      .set("Authorization", `Bearer ${token}`)
      .send({ password: "BrandNew123", confirmPassword: "BrandNew123" });

    expect(res.status).toBe(200);

    const oldLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "ada@example.com", password: "Password123" });
    expect(oldLogin.status).toBe(401);

    const newLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "ada@example.com", password: "BrandNew123" });
    expect(newLogin.status).toBe(200);
  });

  // I1 regression: a token issued before change-password must stop
  // working — otherwise a stolen token survives the owner's own recovery.
  // The "before" token's `iat` is backdated by 10s explicitly rather than
  // sleeping or faking the system clock, keeping it deterministically past
  // the 1s skew allowance.
  it("invalidates tokens issued before a change-password, but not ones issued after", async () => {
    const { app } = appWith();
    const user = await User.create({
      firstName: "Ada", lastName: "Lovelace", email: "ada@example.com",
      password: "Password123", role: "Learner",
    });
    const staleToken = signToken({
      sub: user._id.toString(),
      role: "Learner",
      iat: Math.floor(Date.now() / 1000) - 10,
    });

    const change = await request(app)
      .post("/api/auth/change-password")
      .set("Authorization", `Bearer ${staleToken}`)
      .send({ password: "BrandNew123", confirmPassword: "BrandNew123" });
    expect(change.status).toBe(200);

    const staleCheck = await request(app)
      .get("/api/auth/check-auth")
      .set("Authorization", `Bearer ${staleToken}`);
    expect(staleCheck.status).toBe(401);

    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "ada@example.com", password: "BrandNew123" });
    expect(login.status).toBe(200);

    const freshCheck = await request(app)
      .get("/api/auth/check-auth")
      .set("Authorization", `Bearer ${login.body.token}`);
    expect(freshCheck.status).toBe(200);
  });

  it("rejects mismatched confirmation", async () => {
    const { app } = appWith();
    const token = await authed(app);
    const res = await request(app)
      .post("/api/auth/change-password")
      .set("Authorization", `Bearer ${token}`)
      .send({ password: "BrandNew123", confirmPassword: "Different123" });
    expect(res.status).toBe(400);
  });

  it("rejects an anonymous request", async () => {
    const { app } = appWith();
    const res = await request(app)
      .post("/api/auth/change-password")
      .send({ password: "BrandNew123", confirmPassword: "BrandNew123" });
    expect(res.status).toBe(401);
  });
});

describe("PUT /api/auth/update", () => {
  it("updates text fields and returns the updated user", async () => {
    const { app } = appWith();
    const token = await authed(app);

    const res = await request(app)
      .put("/api/auth/update")
      .set("Authorization", `Bearer ${token}`)
      .field("firstName", "Augusta")
      .field("location", "London")
      .field("disabled", "false");

    expect(res.status).toBe(200);
    expect(res.body.user.firstName).toBe("Augusta");
    expect(res.body.user.location).toBe("London");
    expect(res.body.user.lastName).toBe("Lovelace");
  });

  it("uploads a profile image and stores the returned url", async () => {
    const { app, uploads } = appWith();
    const token = await authed(app);

    const res = await request(app)
      .put("/api/auth/update")
      .set("Authorization", `Bearer ${token}`)
      .field("firstName", "Augusta")
      .attach("profileImage", PNG, { filename: "me.png", contentType: "image/png" });

    expect(res.status).toBe(200);
    expect(res.body.user.profileImage).toBe("https://images.example/uploaded.png");
    expect(uploads).toHaveLength(1);
  });

  it("leaves the existing image alone when no file is sent", async () => {
    const { app, uploads } = appWith();
    const token = await authed(app);
    await User.updateOne(
      { email: "ada@example.com" },
      { profileImage: "https://images.example/original.png" },
    );

    const res = await request(app)
      .put("/api/auth/update")
      .set("Authorization", `Bearer ${token}`)
      .field("firstName", "Augusta");

    expect(res.body.user.profileImage).toBe("https://images.example/original.png");
    expect(uploads).toHaveLength(0);
  });

  it("ignores attempts to change email, role or password", async () => {
    const { app } = appWith();
    const token = await authed(app);

    const res = await request(app)
      .put("/api/auth/update")
      .set("Authorization", `Bearer ${token}`)
      .field("email", "attacker@example.com")
      .field("role", "Admin")
      .field("password", "Hijacked123");

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe("ada@example.com");
    expect(res.body.user.role).toBe("Learner");

    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "ada@example.com", password: "Password123" });
    expect(login.status).toBe(200);
  });

  it("rejects an anonymous request", async () => {
    const { app } = appWith();
    const res = await request(app).put("/api/auth/update").field("firstName", "X");
    expect(res.status).toBe(401);
  });
});
