import jwt from "jsonwebtoken";
import type { Role } from "@learnbase/types";
import { AppError } from "../errors/AppError.js";

export interface TokenPayload {
  sub: string;
  role: Role;
  /**
   * Seconds since epoch. Normally left for `jsonwebtoken` to stamp at sign
   * time; `authenticate` reads it back to reject a token issued before the
   * account's last password change. Exposed here (rather than passing
   * `iat` only through the signed-and-decoded payload) so a caller can
   * also set it explicitly — tests use this to construct a deliberately
   * backdated token without sleeping or faking the system clock.
   */
  iat?: number;
}

function secret(): string {
  const value = process.env.JWT_SECRET;
  if (!value) {
    throw new Error("JWT_SECRET is not set. Copy .env.example to .env.");
  }
  return value;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, secret(), {
    expiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  } as jwt.SignOptions);
}

/** Throws AppError(401) for every failure mode — expired, tampered, wrong secret. */
export function verifyToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, secret());
    if (
      typeof decoded !== "object" ||
      decoded === null ||
      typeof (decoded as TokenPayload).sub !== "string"
    ) {
      throw new AppError("Not authorised", 401);
    }
    return decoded as TokenPayload;
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError("Not authorised", 401);
  }
}
