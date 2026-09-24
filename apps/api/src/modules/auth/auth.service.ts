import crypto from "node:crypto";
import bcrypt from "bcrypt";
import type { Role, User as PublicUser } from "@learnbase/types";
import { AppError } from "../../shared/errors/AppError.js";
import { signToken } from "../../shared/auth/jwt.js";
import type { Mailer } from "../../shared/adapters/index.js";
import { verificationEmail } from "../../shared/adapters/mailer.js";
import { User, toPublicUser, BCRYPT_ROUNDS } from "./user.model.js";
import type { UserDocument } from "./user.model.js";
import type { LoginInput } from "./auth.schema.js";

const OTP_TTL_MS = 15 * 60 * 1000;

/**
 * A bcrypt hash of a random value nobody will ever submit, at the same cost
 * factor as real user passwords. Compared against on every "no such user" /
 * "disabled account" failure so those paths cost the same as a real
 * comparison — otherwise the ~O(100ms) bcrypt gap between "ran a compare"
 * and "didn't" answers "does this email have an account?" through response
 * timing, even though the response body is identical. Generated once at
 * module load (~cost-factor-12 bcrypt hash, a few hundred ms), which is
 * negligible against a server process's lifetime.
 */
const DUMMY_HASH = bcrypt.hashSync(crypto.randomBytes(16).toString("hex"), BCRYPT_ROUNDS);

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

export async function loginUser(
  input: LoginInput,
): Promise<{ token: string; user: PublicUser }> {
  const user = await User.findOne({ email: input.email }).select("+password");

  // One message for both branches so the endpoint cannot be used to discover
  // which email addresses have accounts.
  const invalid = new AppError("Invalid email or password", 401);
  if (!user || user.disabled) {
    // Pay the same bcrypt cost a real comparison would, so this branch
    // can't be distinguished from a wrong-password failure by timing.
    await bcrypt.compare(input.password, DUMMY_HASH);
    throw invalid;
  }
  if (!(await user.comparePassword(input.password))) throw invalid;

  user.lastLogin = new Date();
  await user.save();

  return {
    token: signToken({ sub: user._id.toString(), role: user.role }),
    user: toPublicUser(user),
  };
}

const MAX_VERIFICATION_ATTEMPTS = 5;

export async function verifyEmail(
  userId: string,
  submitted: string,
): Promise<PublicUser> {
  const user = await User.findById(userId).select(
    "+verificationToken +verificationTokenExpiresAt +verificationAttempts",
  );
  if (!user) throw new AppError("Not authorised", 401);
  if (user.isVerified) return toPublicUser(user);

  if ((user.verificationAttempts ?? 0) >= MAX_VERIFICATION_ATTEMPTS) {
    throw new AppError(
      "Too many incorrect codes. Request a new one to try again.",
      429,
    );
  }

  const expired =
    !user.verificationTokenExpiresAt ||
    user.verificationTokenExpiresAt.getTime() < Date.now();

  if (!user.verificationToken || expired) {
    throw new AppError("That code has expired. Request a new one.", 400);
  }

  if (user.verificationToken !== submitted) {
    user.verificationAttempts = (user.verificationAttempts ?? 0) + 1;
    await user.save();
    throw new AppError("That code is not correct", 400);
  }

  user.isVerified = true;
  user.verificationToken = undefined;
  user.verificationTokenExpiresAt = undefined;
  user.verificationAttempts = 0;
  await user.save();

  return toPublicUser(user);
}

export async function resendVerification(
  user: UserDocument,
  mailer: Mailer,
): Promise<void> {
  if (user.isVerified) return;

  const code = generateOtp();
  await User.updateOne(
    { _id: user._id },
    {
      verificationToken: code,
      verificationTokenExpiresAt: new Date(Date.now() + OTP_TTL_MS),
      verificationAttempts: 0,
    },
  );

  await mailer.send({ to: user.email, ...verificationEmail(code) });
}
