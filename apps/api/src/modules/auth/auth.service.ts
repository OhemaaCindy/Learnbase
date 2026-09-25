import crypto from "node:crypto";
import bcrypt from "bcrypt";
import type { Role, User as PublicUser } from "@learnbase/types";
import { AppError } from "../../shared/errors/AppError.js";
import { signToken } from "../../shared/auth/jwt.js";
import type { Mailer } from "../../shared/adapters/index.js";
import { verificationEmail, resetPasswordEmail } from "../../shared/adapters/mailer.js";
import { assertAllowedResetUrl } from "../../shared/auth/clientOrigins.js";
import { redactSecrets } from "../../shared/middleware/errorHandler.js";
import { User, toPublicUser, BCRYPT_ROUNDS } from "./user.model.js";
import type { UserDocument } from "./user.model.js";
import type { LoginInput, UpdateProfileInput } from "./auth.schema.js";
import type { ImageStore } from "../../shared/adapters/index.js";

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

const RESET_TTL_MS = 60 * 60 * 1000;

function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

/**
 * Sends in flight for `requestPasswordReset`, tracked so tests can await
 * "the email actually went out" deterministically instead of racing a
 * fire-and-forget promise or sleeping. A `Set` (not a single promise)
 * because concurrent requests can each have a send in flight at once; each
 * entry removes itself once settled.
 */
const pendingSends = new Set<Promise<void>>();

function trackSend(promise: Promise<void>): void {
  pendingSends.add(promise);
  void promise.finally(() => pendingSends.delete(promise));
}

/** Resolves once every currently in-flight send has settled. Tests only. */
export function flushPendingSends(): Promise<void> {
  return Promise.all(pendingSends).then(() => undefined);
}

export async function requestPasswordReset(
  rawEmail: string,
  baseResetURL: string,
  mailer: Mailer,
): Promise<void> {
  // Validate the URL before any lookup, so a bad URL is rejected the same way
  // whether or not the account exists.
  const base = assertAllowedResetUrl(baseResetURL);

  const user = await User.findOne({ email: rawEmail });
  if (!user) return; // Same response either way — no account enumeration.

  const raw = crypto.randomBytes(32).toString("hex");
  await User.updateOne(
    { _id: user._id },
    {
      resetPasswordToken: hashToken(raw),
      resetPasswordExpiresAt: new Date(Date.now() + RESET_TTL_MS),
    },
  );

  const link = `${base.replace(/\/+$/, "")}/${raw}`;

  // Deliberately NOT awaited: the caller must get the same response,
  // in the same time, whether or not an account exists. Awaiting the send
  // here made this a timing oracle — a slow mailer round trip on the "user
  // exists" branch, nothing at all on the "no such user" branch, with an
  // otherwise byte-identical response. Respond as soon as the token is
  // persisted; the send happens after, and its outcome never reaches the
  // caller — including whether it happened at all.
  trackSend(
    mailer.send({ to: user.email, ...resetPasswordEmail(link) }).catch((err) => {
      console.error(
        "forgot-password: mail send failed:",
        redactSecrets(err instanceof Error ? err.message : String(err)),
      );
    }),
  );
}

export async function resetPassword(
  rawToken: string,
  newPassword: string,
): Promise<void> {
  const user = await User.findOne({
    resetPasswordToken: hashToken(rawToken),
    resetPasswordExpiresAt: { $gt: new Date() },
  }).select("+password +resetPasswordToken +resetPasswordExpiresAt");

  if (!user) {
    throw new AppError("That reset link is invalid or has expired", 400);
  }

  user.password = newPassword; // pre-save hook hashes it
  user.resetPasswordToken = undefined;
  user.resetPasswordExpiresAt = undefined;
  // Evicts every token issued before this moment — see `authenticate`.
  user.passwordChangedAt = new Date();
  await user.save();
}

export async function changePassword(
  userId: string,
  newPassword: string,
): Promise<void> {
  const user = await User.findById(userId).select("+password");
  if (!user) throw new AppError("Not authorised", 401);
  user.password = newPassword;
  // Evicts every token issued before this moment — see `authenticate`.
  user.passwordChangedAt = new Date();
  await user.save();
}

export async function updateProfile(
  userId: string,
  fields: UpdateProfileInput,
  file: Buffer | undefined,
  imageStore: ImageStore,
): Promise<PublicUser> {
  const user = await User.findById(userId);
  if (!user) throw new AppError("Not authorised", 401);

  if (file) {
    user.profileImage = await imageStore.upload(file, "learnbase/profiles");
  }

  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) {
      (user as unknown as Record<string, unknown>)[key] = value;
    }
  }

  await user.save();
  return toPublicUser(user);
}
