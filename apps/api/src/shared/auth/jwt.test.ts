import { describe, it, expect, beforeEach } from "vitest";
import { signToken, verifyToken } from "./jwt.js";
import { AppError } from "../errors/AppError.js";

beforeEach(() => {
  process.env.JWT_SECRET = "test-secret-value-long-enough";
  process.env.JWT_EXPIRES_IN = "7d";
});

describe("jwt", () => {
  it("round-trips a payload", () => {
    const token = signToken({ sub: "507f1f77bcf86cd799439011", role: "Admin" });
    expect(verifyToken(token)).toMatchObject({
      sub: "507f1f77bcf86cd799439011",
      role: "Admin",
    });
  });

  it("rejects a tampered token with a 401 AppError", () => {
    const token = signToken({ sub: "abc", role: "Learner" });
    const tampered = `${token.slice(0, -2)}xx`;
    try {
      verifyToken(tampered);
      throw new Error("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).statusCode).toBe(401);
    }
  });

  it("rejects a token signed with a different secret", () => {
    const token = signToken({ sub: "abc", role: "Learner" });
    process.env.JWT_SECRET = "a-completely-different-secret";
    expect(() => verifyToken(token)).toThrow(AppError);
  });

  it("rejects an expired token", () => {
    process.env.JWT_EXPIRES_IN = "-1s";
    const token = signToken({ sub: "abc", role: "Learner" });
    expect(() => verifyToken(token)).toThrow(AppError);
  });

  it("refuses to sign when JWT_SECRET is missing", () => {
    delete process.env.JWT_SECRET;
    expect(() => signToken({ sub: "abc", role: "Learner" })).toThrow();
  });
});
