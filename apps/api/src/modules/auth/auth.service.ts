import crypto from "node:crypto";
import type { Role, User as PublicUser } from "@learnbase/types";
import { AppError } from "../../shared/errors/AppError.js";
import { signToken } from "../../shared/auth/jwt.js";
import type { Mailer } from "../../shared/adapters/index.js";
import { verificationEmail } from "../../shared/adapters/mailer.js";
import { User, toPublicUser } from "./user.model.js";

const OTP_TTL_MS = 15 * 60 * 1000;

/** Six digits, uniformly distributed, from a CSPRNG. */
export function generateOtp(): string {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
}

export interface RegisterInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  contact?: string;
}

export async function registerUser(
  input: RegisterInput,
  role: Role,
  mailer: Mailer,
): Promise<{ token: string; user: PublicUser }> {
  const existing = await User.findOne({ email: input.email });
  if (existing) {
    throw new AppError("An account with that email already exists", 409);
  }

  const code = generateOtp();
  const user = await User.create({
    ...input,
    role,
    verificationToken: code,
    verificationTokenExpiresAt: new Date(Date.now() + OTP_TTL_MS),
  });

  await mailer.send({ to: user.email, ...verificationEmail(code) });

  return {
    token: signToken({ sub: user._id.toString(), role }),
    user: toPublicUser(user),
  };
}
